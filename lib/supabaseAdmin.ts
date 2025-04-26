import { createClient } from '@supabase/supabase-js';

// Get environment variables - make sure these are set in your .env file
// SUPABASE_URL should be the same as NEXT_PUBLIC_SUPABASE_URL
// SUPABASE_SERVICE_ROLE_KEY is different from the anon key and has admin privileges
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Storage configuration
const storageS3Endpoint = process.env.STORAGE_S3_ENDPOINT || 'https://fzvueuydzfwtbyiumbep.supabase.co/storage/v1/s3';
const storageS3Region = process.env.STORAGE_S3_REGION || 'us-east-1';

// Debug environment variables (without exposing secrets)
console.log(`Supabase URL available: ${Boolean(supabaseUrl)}`);
console.log(`Supabase service role key available: ${Boolean(supabaseServiceRoleKey)}`);

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase environment variables!");
  console.error(`URL defined: ${Boolean(supabaseUrl)}, key defined: ${Boolean(supabaseServiceRoleKey)}`);
  throw new Error('Missing Supabase server-side environment variables');
}

if (!supabaseUrl.startsWith('http')) {
  console.error(`Invalid Supabase URL format: "${supabaseUrl.substring(0, 10)}..."`);
  throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
}

// Create a Supabase client with the service role key for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

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

/**
 * Creates a bucket with appropriate access policy
 */
async function createBucketWithPolicy(
  bucketName: string, 
  isPublic: boolean, 
  fileSizeLimit = 52428800, 
  allowedMimeTypes?: string[]
) {
  // Create the bucket
  const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
    public: isPublic,
    fileSizeLimit,
    allowedMimeTypes
  });
  
  if (error) {
    console.error(`Error creating bucket ${bucketName}:`, error);
    throw new Error(`Failed to create storage bucket: ${error.message}`);
  }
  
  // If public bucket, set appropriate policies
  if (isPublic) {
    // Set bucket policy to allow public access
    await supabaseAdmin.storage.updateBucket(bucketName, {
      public: true,
      allowedMimeTypes
    });
  }
  
  return true;
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