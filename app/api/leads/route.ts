import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import crypto from 'crypto';
import { Buffer } from 'buffer';
import { ingestLeadSource, normalizeLeadsForSource, isDuplicateFile } from '@/actions/leadIngestion.action';

export const runtime = 'nodejs';

// Increase the body size limit for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// Helper function to create consistent responses
const createResponse = (data: any, status: number = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
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
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const file = fileField;
    if (!file.name.endsWith('.csv')) {
      console.error('[API /leads] Invalid file format - must be CSV');
      return NextResponse.json(
        { success: false, message: 'Only CSV files are supported' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Convert File to Buffer for duplicate checking
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check for duplicate content
    const admin = createAdminClient();
    const isDuplicate = await isDuplicateFile(admin, buffer, file.name);
    if (isDuplicate) {
      return NextResponse.json(
        { success: false, message: 'This file appears to be a duplicate of an existing import' },
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const fileName = file.name;
    console.log('[API /leads] Generated file name:', fileName);
    console.log('[API /leads] File size:', buffer.length, 'bytes');
    
    // Upload file using upsert:false so existing files cause a duplicate error
    console.log('[API /leads] Uploading file to storage...');
    console.log('[API /leads] Storage client initialized:', !!admin.storage);
    
    try {
      const { data, error: storageError } = await admin.storage
        .from('lead-imports')
        .upload(fileName, buffer, { 
          contentType: 'text/csv',
          upsert: false,
          cacheControl: '3600'
        });

      console.log('[API /leads] Upload response data:', data);
      
      if (storageError) {
        console.error('[API /leads] Storage upload error:', storageError);
        console.error('[API /leads] Error details:', {
          message: storageError.message,
          name: storageError.name
        });
        return createResponse(
          { success: false, message: `Storage error: ${storageError.message}` },
          500
        );
      }

      console.log('[API /leads] File uploaded successfully to path:', data?.path);

      // Record file metadata in lead_sources
      const { data: newSource, error: dbError } = await admin
        .from('lead_sources')
        .insert({
          name: fileName,
          file_name: file.name,
          last_imported: new Date().toISOString(),
          record_count: 0,
          is_active: true,
          storage_path: data?.path || `lead-imports/${fileName}`,
        })
        .select('id')
        .single();

      if (dbError || !newSource) {
        console.error('[API /leads] Database error:', dbError);
        return createResponse(
          { success: false, message: `Database error: ${dbError?.message}` },
          500
        );
      }

      const sourceId = newSource.id;
      console.log('[API /leads] Created lead source:', sourceId);

      try {
        // Ingest raw rows and normalize into leads
        console.log('[API /leads] Starting lead ingestion...');
        const { count } = await ingestLeadSource(sourceId);
        console.log('[API /leads] Ingested', count, 'leads');

        console.log('[API /leads] Normalizing leads...');
        await normalizeLeadsForSource(sourceId);
        console.log('[API /leads] Lead normalization complete');

        return createResponse(
          { 
            success: true, 
            count, 
            message: `Successfully processed ${count} leads`,
            logs: [
              `Starting ingestion for ${file.name}`,
              `File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`,
              `Parsed ${count} rows`,
              `Created table: ${fileName.replace(/\.[^/.]+$/, '')}`,
              `Successfully processed all leads`
            ]
          },
          200
        );
      } catch (ingestionError) {
        console.error('[API /leads] Lead ingestion error:', ingestionError);
        return createResponse(
          { 
            success: false, 
            message: `Lead ingestion error: ${ingestionError instanceof Error ? ingestionError.message : 'Unknown error'}`,
            logs: [
              `Error during ingestion: ${ingestionError instanceof Error ? ingestionError.message : 'Unknown error'}`
            ]
          },
          500
        );
      }

    } catch (err) {
      console.error('[API /leads] Unexpected error:', err);
      return createResponse(
        { 
          success: false, 
          message: `Unexpected server error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          logs: [
            `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
          ]
        },
        500
      );
    }

  } catch (err) {
    console.error('[API /leads] Unexpected error:', err);
    return createResponse(
      { 
        success: false, 
        message: `Unexpected server error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        logs: [
          `Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`
        ]
      },
      500
    );
  }
}