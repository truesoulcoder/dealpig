import { createClient } from '@supabase/supabase-js';

// Get environment variables - make sure these are set in your .env file
// SUPABASE_URL should be the same as NEXT_PUBLIC_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY is different from the anon key and has admin privileges
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Storage configuration
const storageS3Endpoint = process.env.STORAGE_S3_ENDPOINT || 'https://fzvueuydzfwtbyiumbep.supabase.co/storage/v1/s3';
const storageS3Region = process.env.STORAGE_S3_REGION || 'us-east-1';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase server-side environment variables');
}

if (!supabaseUrl.startsWith('http')) {
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

// Create a Supabase client with the service role key for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  // Adding custom S3 endpoint for storage
  global: {
    headers: {
      'X-Supabase-Storage-S3-Endpoint': storageS3Endpoint,
    },
  },
});

/**
 * Creates a storage bucket with appropriate policies
 * @param bucketName Name of the bucket to create
 * @param isPublic Whether the bucket should be public (true) or private (false)
 * @param fileSizeLimit Maximum file size in bytes (default is 52428800 = 50MB)
 * @param mimeTypes Array of allowed MIME types (optional)
 */
export async function createBucketWithPolicy(
  bucketName: string,
  isPublic: boolean,
  fileSizeLimit: number = 52428800, // 50MB
  mimeTypes?: string[]
): Promise<boolean> {
  try {
    console.log(`Creating bucket: ${bucketName}, public: ${isPublic}`);
    
    // Create bucket with specified settings
    const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: isPublic,
      fileSizeLimit: fileSizeLimit,
      allowedMimeTypes: mimeTypes,
    });
    
    if (createError) {
      console.error(`Failed to create bucket ${bucketName}:`, createError);
      return false;
    }
    
    // Set appropriate policies based on whether the bucket is public or private
    if (isPublic) {
      // For public buckets, allow anyone to download files
      const { error: policyError } = await supabaseAdmin
        .storage
        .from(bucketName)
        .createSignedUrl('policy.txt', 60); // This is a hack to ensure bucket exists before setting policies
        
      if (!policyError) {
        console.log(`Successfully created public bucket: ${bucketName}`);
      } else {
        console.error(`Error setting policy for ${bucketName}:`, policyError);
      }
    }

    return true;
  } catch (error) {
    console.error(`Error creating bucket ${bucketName}:`, error);
    return false;
  }
}

/**
 * Creates storage buckets if they don't exist, with appropriate policies
 * This should be called during app initialization or before first storage operation
 */
export async function ensureStorageBuckets(): Promise<void> {
  const requiredBuckets = [
    { name: 'templates', isPublic: false, mimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    { name: 'generated-documents', isPublic: true, mimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] },
    { name: 'lead-imports', isPublic: false, mimeTypes: ['text/csv', 'application/vnd.ms-excel'] }
  ];
  
  for (const bucket of requiredBuckets) {
    // Check if bucket exists
    const { data: existingBucket, error: getBucketError } = await supabaseAdmin
      .storage
      .getBucket(bucket.name);
      
    // If bucket doesn't exist or there was an error retrieving it, create it
    if (getBucketError || !existingBucket) {
      await createBucketWithPolicy(
        bucket.name,
        bucket.isPublic,
        52428800, // 50MB limit
        bucket.mimeTypes
      );
    }
  }
}

// Export as standalone function for server components
export function getSupabaseAdmin() {
  return supabaseAdmin;
}

/**
 * Upload a file to Supabase storage and return the public URL
 * Will automatically create the bucket if it doesn't exist
 */
export async function uploadToStorage(
  bucketName: string, 
  filePath: string, 
  fileContent: Buffer | string,
  contentType?: string
): Promise<string> {
  try {
    // Check if bucket exists, create if it doesn't
    const { data: bucketExists, error: bucketError } = await supabaseAdmin.storage.getBucket(bucketName);
    
    // If bucket doesn't exist, create with appropriate settings based on bucket name
    if (bucketError || !bucketExists) {
      const isPublic = bucketName === 'generated-documents'; // Only generated docs are public
      let mimeTypes: string[] | undefined;
      
      // Set appropriate MIME types based on bucket purpose
      if (bucketName === 'lead-imports') {
        mimeTypes = ['text/csv', 'application/vnd.ms-excel'];
      } else if (bucketName === 'templates' || bucketName === 'generated-documents') {
        mimeTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      }
      
      await createBucketWithPolicy(bucketName, isPublic, 52428800, mimeTypes);
    }
    
    // Upload file
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, fileContent, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error(`File upload failed: ${uploadError.message}`);
    }
    
    // Get public URL
    const { data } = supabaseAdmin.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadToStorage:', error);
    throw error;
  }
}

export async function downloadFromStorage(bucketName: string, filePath: string): Promise<Buffer | null> {
  try {
    // Check if bucket exists, create if it doesn't using the same logic as uploadToStorage
    const { data: bucketExists, error: bucketError } = await supabaseAdmin.storage.getBucket(bucketName);
    
    if (bucketError || !bucketExists) {
      const isPublic = bucketName === 'generated-documents';
      await createBucketWithPolicy(bucketName, isPublic);
    }
  
    // Download file
    const { data, error } = await supabaseAdmin
      .storage
      .from(bucketName)
      .download(filePath);
      
    if (error || !data) {
      console.error('Error downloading file:', error);
      return null;
    }
    
    // Convert blob to buffer for server-side operations
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error in downloadFromStorage:', error);
    return null;
  }
}