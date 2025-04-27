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
const supabaseAdmin = createClient(supabaseUrl as string, supabaseServiceRoleKey as string, {
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
 * Optimized for Vercel serverless environment
 */
export async function uploadToStorage(
  bucketName: string, 
  filePath: string, 
  fileContent: Buffer | string,
  contentType?: string
): Promise<string> {
  try {
    // Log key info (will appear in Vercel logs)
    console.log(`Uploading file to ${bucketName}: ${filePath} (${typeof fileContent === 'string' ? fileContent.length : fileContent.byteLength} bytes)`);
    
    // Create a fresh Supabase client for this upload
    // This ensures we don't have stale connections in serverless environment
    const client = createClient(supabaseUrl as string, supabaseServiceRoleKey as string, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
    
    // Create a Promise with timeout to handle potential hanging requests
    const uploadWithTimeout = async () => {
      return new Promise<string>((resolve, reject) => {
        // Set a 25-second timeout (Vercel functions have a 30s limit)
        const timeoutId = setTimeout(() => {
          reject(new Error('Upload timed out after 25 seconds'));
        }, 25000);
        
        const executeUpload = async () => {
          try {
            // Get bucket reference
            const bucket = client.storage.from(bucketName);
            
            // First verify the bucket exists
            const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
            
            if (bucketsError) {
              console.error('Error listing buckets:', bucketsError);
              reject(new Error(`Failed to list buckets: ${bucketsError.message}`));
              return;
            }
            
            const bucketExists = buckets.some(b => b.name === bucketName);
            if (!bucketExists) {
              console.error(`Bucket ${bucketName} does not exist`);
              reject(new Error(`Bucket ${bucketName} does not exist`));
              return;
            }
            
            console.log(`Bucket ${bucketName} found, proceeding with upload`);
            
            // Execute the upload with maximum compatibility options
            const { data, error } = await bucket.upload(filePath, fileContent, {
              contentType: contentType || 'text/plain',
              cacheControl: '3600',
              upsert: true
            });
            
            if (error) {
              console.error('Error uploading file:', error);
              reject(new Error(`Upload failed: ${error.message}`));
              return;
            }
            
            console.log('Upload successful:', data);
            
            // Get public URL
            const { data: urlData } = bucket.getPublicUrl(filePath);
            
            if (!urlData || !urlData.publicUrl) {
              reject(new Error('Failed to generate public URL'));
              return;
            }
            
            // Complete successfully
            resolve(urlData.publicUrl);
          } catch (err) {
            console.error('Unexpected error during upload:', err);
            reject(err);
          } finally {
            clearTimeout(timeoutId);
          }
        };
        
        // Start the upload
        executeUpload();
      });
    };
    
    // Execute the upload with timeout
    return await uploadWithTimeout();
    
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