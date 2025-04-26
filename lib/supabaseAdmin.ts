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
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Export the admin client directly
export { supabaseAdmin };

// Export as async function for server components
export async function getSupabaseAdmin() {
  return supabaseAdmin;
}

/**
 * Upload a file to Supabase storage and return the public URL
 * Assumes the bucket already exists
 */
export async function uploadToStorage(
  bucketName: string, 
  filePath: string, 
  fileContent: Buffer | string,
  contentType?: string
): Promise<string> {
  try {
    const supabase = await getSupabaseAdmin();
    const storage = supabase.storage;
    
    // Upload file - avoid chaining
    const bucket = storage.from(bucketName);
    const uploadResult = await bucket.upload(filePath, fileContent, {
      contentType,
      cacheControl: '3600',
      upsert: false
    });
      
    if (uploadResult.error) {
      console.error('Error uploading file:', uploadResult.error);
      throw new Error(`File upload failed: ${uploadResult.error.message}`);
    }
    
    // Get public URL - avoid chaining
    const urlResult = bucket.getPublicUrl(filePath);
    return urlResult.data.publicUrl;
  } catch (error) {
    console.error('Error in uploadToStorage:', error);
    throw error;
  }
}

export async function downloadFromStorage(bucketName: string, filePath: string): Promise<Buffer | null> {
  try {
    const supabase = await getSupabaseAdmin();
    const storage = supabase.storage;
    
    // Download file - avoid chaining
    const bucket = storage.from(bucketName);
    const downloadResult = await bucket.download(filePath);
      
    if (downloadResult.error || !downloadResult.data) {
      console.error('Error downloading file:', downloadResult.error);
      return null;
    }
    
    // Convert blob to buffer for server-side operations
    const arrayBuffer = await downloadResult.data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Error in downloadFromStorage:', error);
    return null;
  }
}