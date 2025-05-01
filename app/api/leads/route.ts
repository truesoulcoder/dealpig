import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createResponse } from '@/lib/api';
// Remove the import for processLeadSourceFile as it's no longer called here
// import { processLeadSourceFile } from '@/actions/leadIngestion.action';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

export const runtime = 'nodejs';

// Increase the body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(request: NextRequest) {
  console.log('[API /leads] POST handler called');
  try {
    // Log request headers for debugging
    console.log('[API /leads] Request headers:', Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    console.log('[API /leads] FormData keys:', Array.from(formData.keys()));
    
    const fileField = formData.get('file');
    console.log('[API /leads] formData file:', fileField);
    
    if (!(fileField instanceof File)) {
      console.error('[API /leads] Invalid file type received:', typeof fileField);
      return createResponse(
        { success: false, message: 'No file uploaded' },
        400
      );
    }

    const file = fileField;
    const originalFileName = file.name; // Store original filename

    if (!originalFileName.endsWith('.csv')) {
      console.error('[API /leads] Invalid file format - must be CSV');
      return createResponse(
        { success: false, message: 'Only CSV files are supported' },
        400
      );
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      return createResponse(
        { 
          success: false, 
          message: `File is too large. Maximum size is 50MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
        },
        413
      );
    }

    // Convert File to Buffer for duplicate checking
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check for duplicate content
    const admin = createAdminClient();
    // const isDuplicate = await isDuplicateFile(admin, buffer, originalFileName); // Use originalFileName for duplicate check if needed
    // if (isDuplicate) { ... }

    // Generate UUID for this new source
    const sourceId = uuidv4();
    const storageObjectName = sourceId; // Use UUID as the object name in storage
    const storagePath = `lead-imports/${storageObjectName}`;
    const sourceName = `${sourceId}_${originalFileName}`; // Name combines UUID and original name

    console.log('[API /leads] Generated Source ID (UUID):', sourceId);
    console.log('[API /leads] Storage Object Name:', storageObjectName);
    console.log('[API /leads] File size:', buffer.length, 'bytes');

    // Upload file using UUID as the name
    console.log('[API /leads] Uploading file to storage path:', storagePath);
    console.log('[API /leads] Storage client initialized:', !!admin.storage);

    try {
      const { data: uploadData, error: storageError } = await admin.storage
        .from('lead-imports')
        .upload(storageObjectName, buffer, { // Use UUID for upload name
          contentType: 'text/csv',
          upsert: false, // Keep this false to prevent overwriting by mistake
          cacheControl: '3600'
        });

      if (storageError) {
        console.error('[API /leads] Storage upload error:', storageError);
        return createResponse(
          { 
            success: false, 
            message: `Storage error: ${storageError.message}`,
            error: storageError
          },
          500
        );
      }

      if (!uploadData?.path) {
        console.error('[API /leads] No path returned from storage upload');
        return createResponse(
          { 
            success: false, 
            message: 'Storage upload failed: No path returned',
            data: uploadData
          },
          500
        );
      }

      console.log('[API /leads] File uploaded successfully to path:', uploadData.path); // Path will be the UUID

      // Create the initial lead source record HERE
      console.log('[API /leads] Creating initial lead source record...');
      const createdAt = new Date().toISOString();
      const { error: dbError } = await admin
        .from('lead_sources')
        .insert({
          id: sourceId,             // The generated UUID
          name: sourceName,           // Combined UUID + original name
          file_name: originalFileName, // The original file name
          storage_path: storagePath,    // Path in storage (includes UUID)
          record_count: 0,            // Initial count
          is_active: true,
          last_imported: createdAt,   // Set initial import time
          created_at: createdAt,
          updated_at: createdAt
        });

      if (dbError) {
        console.error('[API /leads] Failed to create initial lead source record:', dbError);
        // Potentially delete the uploaded file if DB insert fails
        await admin.storage.from('lead-imports').remove([storageObjectName]);
        return createResponse(
          { success: false, message: `Database error: ${dbError.message}` },
          500
        );
      }
      console.log('[API /leads] Initial lead source record created successfully:', sourceId);

      // Return success after upload and initial record creation.
      // Processing should be triggered elsewhere after metadata is configured.
      return createResponse(
        {
          success: true,
          message: `Successfully uploaded file: ${originalFileName}. Configure metadata to start processing.`,
          sourceId: sourceId
        },
        200
      );

    } catch (error) {
      console.error('[API /leads] Unexpected error during upload:', error);
      return createResponse(
        { 
          success: false, 
          message: 'Unexpected error during file upload',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        500
      );
    }
  } catch (error) {
    console.error('[API /leads] Unexpected error:', error);
    return createResponse(
      { 
        success: false, 
        message: 'Unexpected server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}