import { createClient } from '@supabase/supabase-js';

/**
 * Simple storage utility focused on reliable uploads in production environments
 * Strips away all the complexity and focuses on just making uploads work
 */
export async function simpleUpload(
  bucketName: string,
  filePath: string,
  fileContent: Buffer | string,
  contentType: string = 'text/plain'
): Promise<string | null> {
  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    return null;
  }

  console.log(`Starting upload to ${bucketName}/${filePath}, size: ${
    typeof fileContent === 'string' ? fileContent.length : fileContent.byteLength
  } bytes`);

  try {
    // Create a fresh client with minimal options
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Direct upload approach
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileContent, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Upload failed:', error);
      return null;
    }

    // Get URL
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('Upload successful, URL:', data.publicUrl);
    return data.publicUrl;
  } catch (err) {
    console.error('Unexpected error during upload:', err);
    return null;
  }
}