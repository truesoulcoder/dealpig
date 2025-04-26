import { createClient as createServerClient } from "./server";
import { createClient as createBrowserClient } from "./client";
import { StorageBucket, ImageTransformOptions } from "./storage";

// Re-export the enums and types
export { StorageBucket, type ImageTransformOptions } from "./storage";

/**
 * Safe storage wrapper that avoids build-time errors with Supabase storage
 */
export async function useStorage() {
  let supabase;
  
  if (typeof window === 'undefined') {
    // Server-side - use dynamic import to avoid bundling issues
    const { cookies } = await import('next/headers');
    supabase = await createServerClient(cookies());
  } else {
    // Client-side
    supabase = createBrowserClient();
  }

  // Get the storage instance directly (avoid potential bundling issues)
  const storage = supabase.storage;
  
  return {
    // Upload a file to storage
    uploadFile: async (
      bucketName: string,
      filePath: string,
      fileContent: Buffer | Blob | File,
      contentType?: string
    ) => {
      try {
        const bucket = storage.from(bucketName);
        const { data, error } = await bucket.upload(filePath, fileContent, {
          contentType,
          upsert: true,
        });
        
        if (error) {
          console.error('Error uploading file:', error);
          return null;
        }
        
        const urlResult = bucket.getPublicUrl(filePath);
        return urlResult.data.publicUrl;
      } catch (error) {
        console.error('Error uploading file:', error);
        return null;
      }
    },
    
    // Download a file from storage
    downloadFile: async (bucketName: string, filePath: string) => {
      try {
        const bucket = storage.from(bucketName);
        const { data, error } = await bucket.download(filePath);
        
        if (error || !data) {
          console.error('Error downloading file:', error);
          return null;
        }
        
        // Convert blob to buffer for server-side operations
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        console.error('Error downloading file:', error);
        return null;
      }
    },
    
    // List files in a bucket
    listFiles: async (bucketName: string, folderPath?: string) => {
      try {
        const bucket = storage.from(bucketName);
        const { data, error } = await bucket.list(folderPath || '');
        
        if (error) {
          console.error('Error listing files:', error);
          return null;
        }
        
        return data.map((file: { name: string }) => file.name);
      } catch (error) {
        console.error('Error listing files:', error);
        return null;
      }
    },
    
    // Delete a file from storage
    deleteFile: async (bucketName: string, filePath: string) => {
      try {
        const bucket = storage.from(bucketName);
        const { error } = await bucket.remove([filePath]);
        
        if (error) {
          console.error('Error deleting file:', error);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error deleting file:', error);
        return false;
      }
    },
    
    // Get public URL for a file
    getPublicUrl: (bucketName: string, filePath: string, transform?: ImageTransformOptions) => {
      try {
        const bucket = storage.from(bucketName);
        
        const options = transform ? {
          transform: {
            width: transform.width,
            height: transform.height,
            quality: transform.quality
          }
        } : undefined;
        
        const urlResult = bucket.getPublicUrl(filePath, options);
        return urlResult.data.publicUrl;
      } catch (error) {
        console.error('Error getting public URL:', error);
        return null;
      }
    },
    
    // Create a signed URL for temporary access
    createSignedUrl: async (
      bucketName: string,
      filePath: string,
      expiresIn = 60 // seconds
    ) => {
      try {
        const bucket = storage.from(bucketName);
        const { data, error } = await bucket.createSignedUrl(filePath, expiresIn);
        
        if (error) {
          console.error('Error creating signed URL:', error);
          return null;
        }
        
        return data.signedUrl;
      } catch (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
    }
  };
}

/**
 * Helper function for client components to upload a DOCX template
 */
export async function uploadDocxTemplate(file: File, filePath: string): Promise<string | null> {
  try {
    const storage = await useStorage();
    return storage.uploadFile(
      StorageBucket.TEMPLATES,
      filePath,
      file,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
  } catch (error) {
    console.error('Error uploading DOCX template:', error);
    return null;
  }
}

/**
 * Helper function for client components to upload an optimized image
 */
export async function uploadOptimizedImage(
  file: File | Buffer,
  filePath: string,
  options?: ImageTransformOptions
): Promise<string | null> {
  try {
    const storage = await useStorage();
    const url = await storage.uploadFile(
      StorageBucket.IMAGES,
      filePath,
      file,
      file instanceof File ? file.type : 'image/jpeg'
    );
    
    if (!url || !options) return url;
    
    // Return the URL with transform options
    return storage.getPublicUrl(StorageBucket.IMAGES, filePath, options);
  } catch (error) {
    console.error('Error uploading optimized image:', error);
    return null;
  }
}