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
 * Direct implementation with minimal steps to ensure upload works
 */
export async function uploadToStorage(
  bucketName: string, 
  filePath: string, 
  fileContent: Buffer | string,
  contentType?: string
): Promise<string> {
  try {
    console.log(`[STORAGE] Direct upload to bucket: ${bucketName}, file: ${filePath}`);
    console.log(`[STORAGE] Content type: ${contentType || 'not specified'}, Content size: ${
      typeof fileContent === 'string' ? fileContent.length : fileContent.byteLength
    } bytes`);
    
    // Create a fresh Supabase admin client with explicit auth settings
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      // Add global error handler
      global: {
        fetch: (url, options) => {
          console.log(`[FETCH] ${options?.method || 'GET'} ${url}`);
          return fetch(url, options);
        }
      }
    });
    
    // Get direct reference to the bucket
    const bucket = supabase.storage.from(bucketName);
    
    console.log(`[STORAGE] Executing upload to ${bucketName}/${filePath}`);
    const { data, error } = await bucket.upload(filePath, fileContent, {
      contentType: contentType || 'text/plain',
      cacheControl: '3600',
      upsert: true // Always use upsert to avoid conflicts
    });
      
    if (error) {
      console.error('[STORAGE] Error uploading file:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
    
    if (!data || !data.path) {
      console.error('[STORAGE] Upload succeeded but no path returned');
      throw new Error('Upload succeeded but no path was returned');
    }
    
    console.log(`[STORAGE] File uploaded successfully to path: ${data.path}`);
    
    // Explicitly get public URL
    const { data: urlData } = bucket.getPublicUrl(filePath);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('[STORAGE] Failed to generate public URL');
      throw new Error('Failed to generate public URL');
    }
    
    console.log(`[STORAGE] Generated public URL: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  } catch (error) {
    console.error('[STORAGE] Error in uploadToStorage:', error);
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