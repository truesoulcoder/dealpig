import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createResponse } from '@/lib/api';
import { ingestLeadSource, normalizeLeadsForSource, isDuplicateFile } from '@/actions/leadIngestion.action';
import crypto from 'crypto';

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
    if (!file.name.endsWith('.csv')) {
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
    const isDuplicate = await isDuplicateFile(admin, buffer, file.name);
    if (isDuplicate) {
      return createResponse(
        { success: false, message: 'This file appears to be a duplicate of an existing import' },
        400
      );
    }

    const fileName = file.name;
    console.log('[API /leads] Generated file name:', fileName);
    console.log('[API /leads] File size:', buffer.length, 'bytes');
    
    // Upload file using upsert:false so existing files cause a duplicate error
    console.log('[API /leads] Uploading file to storage...');
    console.log('[API /leads] Storage client initialized:', !!admin.storage);
    
    try {
      // Upload the file directly without chunking
      const { data, error: storageError } = await admin.storage
        .from('lead-imports')
        .upload(fileName, buffer, { 
          contentType: 'text/csv',
          upsert: false,
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

      if (!data?.path) {
        console.error('[API /leads] No path returned from storage upload');
        return createResponse(
          { 
            success: false, 
            message: 'Storage upload failed: No path returned',
            data
          },
          500
        );
      }

      const uploadPath = data.path;
      console.log('[API /leads] File uploaded successfully to path:', uploadPath);

      // Create lead source record and metadata via ingestLeadSource
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
      const columnTypes: Record<string, string> = {}; // TODO: derive column types via CSV parsing
      console.log('[API /leads] Creating lead source record...');
      const leadSource = await ingestLeadSource(
        fileName,
        file.name,
        fileHash,
        columnTypes
      );
      const sourceId = leadSource.id;
      console.log('[API /leads] Created lead source:', sourceId);

      // Normalize leads in the raw table
      console.log('[API /leads] Normalizing leads...');
      const { inserted } = await normalizeLeadsForSource(sourceId);
      console.log('[API /leads] Lead normalization complete');

      return createResponse(
        {
          success: true,
          count: inserted,
          message: `Successfully processed ${inserted} leads`,
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