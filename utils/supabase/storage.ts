import { cookies } from "next/headers";
import { createClient as createServerClient } from "./server";
import { createClient as createBrowserClient } from "./client";

// S3 Configuration
export const STORAGE_S3_ENDPOINT = 'https://fzvueuydzfwtbyiumbep.supabase.co/storage/v1/s3';
export const STORAGE_S3_REGION = 'us-east-1';

// Define storage buckets
export enum StorageBucket {
  TEMPLATES = 'templates',
  GENERATED_DOCUMENTS = 'generated-documents',
  LEAD_IMPORTS = 'lead-imports',
  IMAGES = 'images',
  LOGOS = 'logos',
  ASSETS = 'assets'
}

// Image optimization options
export type ImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: number; // 0-100
  resize?: 'cover' | 'contain' | 'fill'; // How the image should resize
}

// Default image optimization options
const DEFAULT_IMAGE_OPTIONS: ImageTransformOptions = {
  quality: 80,    // Good balance between quality and size
  resize: 'cover' // Preserves aspect ratio
};

/**
 * Helper to upload a file to Supabase storage (server-side)
 */
export async function uploadToStorage(
  bucketName: string,
  filePath: string,
  fileContent: Buffer | Blob | File,
  contentType?: string
): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const supabase = await createServerClient(cookieStore);
    
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, fileContent, {
        contentType,
        upsert: true,
      });
      
    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    
    // Return the public URL
    const { data: urlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadToStorage:', error);
    return null;
  }
}

/**
 * Helper to upload a DOCX template to Supabase storage (client-side)
 * This function is specifically for uploading document templates
 */
export async function uploadDocxTemplateToStorage(
  file: File,
  filePath: string
): Promise<string | null> {
  try {
    const supabase = createBrowserClient();
    
    const { data, error } = await supabase
      .storage
      .from(StorageBucket.TEMPLATES)
      .upload(filePath, file, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true,
      });
      
    if (error) {
      console.error('Error uploading template file:', error);
      return null;
    }
    
    // Return the public URL
    const { data: urlData } = supabase
      .storage
      .from(StorageBucket.TEMPLATES)
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadDocxTemplateToStorage:', error);
    return null;
  }
}

/**
 * Helper to upload and optimize an image to Supabase storage
 * Note: Supabase's transform options are limited
 */
export async function uploadOptimizedImage(
  file: File | Buffer,
  filePath: string,
  options: ImageTransformOptions = DEFAULT_IMAGE_OPTIONS
): Promise<string | null> {
  try {
    const supabase = typeof window !== 'undefined' 
      ? createBrowserClient() 
      : await createServerClient(cookies());
    
    // Upload the original image
    const { data, error } = await supabase
      .storage
      .from(StorageBucket.IMAGES)
      .upload(filePath, file, {
        contentType: file instanceof File ? file.type : 'image/jpeg',
        upsert: true,
      });
      
    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }
    
    // Get the URL with transform options
    const { data: urlData } = supabase
      .storage
      .from(StorageBucket.IMAGES)
      .getPublicUrl(filePath, {
        transform: {
          width: options.width,
          height: options.height,
          quality: options.quality,
        }
      });
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadOptimizedImage:', error);
    return null;
  }
}

/**
 * Helper to upload company logo to storage with optimization
 */
export async function uploadCompanyLogo(
  file: File | Buffer,
  companyId: string
): Promise<string | null> {
  try {
    const fileExt = file instanceof File ? `.${file.name.split('.').pop()}` : '.png';
    const filePath = `company_${companyId}${fileExt}`;
    
    // Use specific options for logos (good quality, reasonable size)
    return uploadOptimizedImage(file, filePath, {
      width: 300,
      height: 300,
      quality: 90
    });
  } catch (error) {
    console.error('Error in uploadCompanyLogo:', error);
    return null;
  }
}

/**
 * Helper to get an optimized image URL from an existing image in storage
 */
export async function getOptimizedImageUrl(
  filePath: string,
  options: ImageTransformOptions = DEFAULT_IMAGE_OPTIONS
): Promise<string | null> {
  try {
    const supabase = typeof window !== 'undefined' 
      ? createBrowserClient() 
      : await createServerClient(cookies());
    
    const { data: urlData } = supabase
      .storage
      .from(StorageBucket.IMAGES)
      .getPublicUrl(filePath, {
        transform: {
          width: options.width,
          height: options.height,
          quality: options.quality
        }
      });
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in getOptimizedImageUrl:', error);
    return null;
  }
}

// Helper to upload SVG files (no optimization needed)
export async function uploadSvg(
  file: File | Buffer,
  filePath: string
): Promise<string | null> {
  try {
    const supabase = typeof window !== 'undefined' 
      ? createBrowserClient() 
      : await createServerClient(cookies());
    
    const { data, error } = await supabase
      .storage
      .from(StorageBucket.ASSETS)
      .upload(filePath, file, {
        contentType: 'image/svg+xml',
        upsert: true,
      });
      
    if (error) {
      console.error('Error uploading SVG:', error);
      return null;
    }
    
    const { data: urlData } = supabase
      .storage
      .from(StorageBucket.ASSETS)
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadSvg:', error);
    return null;
  }
}

/**
 * Helper to download a file from Supabase storage (server-side)
 */
export async function downloadFromStorage(
  bucketName: string,
  filePath: string
): Promise<Buffer | null> {
  try {
    const cookieStore = cookies();
    const supabase = await createServerClient(cookieStore);
    
    const { data, error } = await supabase
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

/**
 * Helper to list files in a Supabase storage bucket
 */
export async function listFiles(bucketName: string, folderPath?: string): Promise<string[] | null> {
  try {
    const cookieStore = cookies();
    const supabase = await createServerClient(cookieStore);
    
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list(folderPath || '');
      
    if (error) {
      console.error('Error listing files:', error);
      return null;
    }
    
    return data.map((file: { name: string }) => file.name);
  } catch (error) {
    console.error('Error in listFiles:', error);
    return null;
  }
}

/**
 * Helper to delete a file from Supabase storage
 */
export async function deleteFromStorage(bucketName: string, filePath: string): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const supabase = await createServerClient(cookieStore);
    
    const { error } = await supabase
      .storage
      .from(bucketName)
      .remove([filePath]);
      
    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteFromStorage:', error);
    return false;
  }
}

/**
 * Helper to create a signed URL for temporary access to private files
 */
export async function createSignedUrl(
  bucketName: string,
  filePath: string,
  expiresIn = 60 // seconds
): Promise<string | null> {
  try {
    const cookieStore = cookies();
    const supabase = await createServerClient(cookieStore);
    
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);
      
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in createSignedUrl:', error);
    return null;
  }
}

/**
 * Creates a browser-side upload helper for use in client components
 */
export function useClientStorage() {
  const supabase = createBrowserClient();
  
  return {
    uploadFile: async (bucketName: string, filePath: string, file: File) => {
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .upload(filePath, file);
        
      if (error) {
        throw error;
      }
      
      return supabase
        .storage
        .from(bucketName)
        .getPublicUrl(filePath);
    },
    
    listFiles: async (bucketName: string, folderPath?: string) => {
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .list(folderPath || '');
        
      if (error) {
        throw error;
      }
      
      return data;
    },
    
    deleteFile: async (bucketName: string, filePath: string) => {
      const { error } = await supabase
        .storage
        .from(bucketName)
        .remove([filePath]);
        
      if (error) {
        throw error;
      }
      
      return true;
    }
  };
}