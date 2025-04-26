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
 * Creates storage buckets if they don't exist
 */
export async function ensureStorageBuckets() {
  const requiredBuckets = ['templates', 'generated-documents', 'lead-imports'];
  
  for (const bucketName of requiredBuckets) {
    const { data: existingBucket, error: getBucketError } = await supabaseAdmin
      .storage
      .getBucket(bucketName);
      
    if (getBucketError && !existingBucket) {
      // Create the bucket if it doesn't exist
      const { error: createError } = await supabaseAdmin
        .storage
        .createBucket(bucketName, {
          public: bucketName === 'generated-documents', // Only generated docs are public
          fileSizeLimit: 52428800, // 50MB
        });
        
      if (createError) {
        console.error(`Failed to create storage bucket ${bucketName}:`, createError);
      } else {
        console.log(`Created storage bucket: ${bucketName}`);
      }
    }
  }
}

// Export as standalone function for server components
export function getSupabaseAdmin() {
  return supabaseAdmin;
}

/**
 * Upload a file to Supabase storage and return the public URL
 */
export async function uploadToStorage(
  bucketName: string, 
  filePath: string, 
  fileContent: Buffer | string,
  contentType?: string
): Promise<string> {
  try {
    // Create bucket if it doesn't exist
    const { data: bucketExists } = await supabaseAdmin.storage.getBucket(bucketName);
    
    if (!bucketExists) {
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        fileSizeLimit: 10485760 // 10MB
      });
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