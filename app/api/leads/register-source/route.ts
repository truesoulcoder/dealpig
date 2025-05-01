import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createResponse } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * API Route to register a new lead source in the database after 
 * a file has been successfully uploaded directly to Supabase Storage.
 */
export async function POST(request: NextRequest) {
  console.log('[API /leads/register-source] POST handler called');
  try {
    const body = await request.json();
    const { storagePath, originalFileName, sourceId } = body;

    // Validate input
    if (!storagePath || typeof storagePath !== 'string') {
      console.error('[API /leads/register-source] Missing or invalid storagePath');
      return createResponse({ success: false, message: 'Missing or invalid storagePath' }, 400);
    }
    if (!originalFileName || typeof originalFileName !== 'string') {
      console.error('[API /leads/register-source] Missing or invalid originalFileName');
      return createResponse({ success: false, message: 'Missing or invalid originalFileName' }, 400);
    }
    if (!sourceId || typeof sourceId !== 'string') {
      console.error('[API /leads/register-source] Missing or invalid sourceId');
      return createResponse({ success: false, message: 'Missing or invalid sourceId' }, 400);
    }

    console.log(`[API /leads/register-source] Received request for sourceId: ${sourceId}`);
    console.log(`[API /leads/register-source] Storage Path: ${storagePath}`);
    console.log(`[API /leads/register-source] Original Filename: ${originalFileName}`);

    const admin = createAdminClient();

    // Create the lead source record
    const createdAt = new Date().toISOString();
    // Construct the name field (e.g., uuid_originalname.csv)
    const sourceName = `${sourceId}_${originalFileName}`;

    console.log(`[API /leads/register-source] Inserting record into lead_sources for ID: ${sourceId}`);
    const { error: dbError } = await admin
      .from('lead_sources')
      .insert({
        id: sourceId,             // The generated UUID from the client
        name: sourceName,           // Combined UUID + original name
        file_name: originalFileName, // The original file name
        storage_path: storagePath,    // Path in storage (e.g., lead-imports/uuid)
        record_count: 0,            // Initial count, will be updated after processing
        is_active: true,
        last_imported: null,        // Not imported/processed yet
        created_at: createdAt,
        updated_at: createdAt,
        metadata: null              // No metadata configured yet
      });

    if (dbError) {
      console.error(`[API /leads/register-source] Failed to create lead source record for ${sourceId}:`, dbError);
      // Note: We don't automatically delete the file here. The client-side handles that on registration failure.
      return createResponse(
        { success: false, message: `Database error: ${dbError.message}` },
        500
      );
    }

    console.log(`[API /leads/register-source] Lead source record created successfully for ID: ${sourceId}`);
    return createResponse(
      {
        success: true,
        message: `Successfully registered source: ${originalFileName}. Configure metadata to start processing.`,
        sourceId: sourceId
      },
      200 // Use 200 OK for successful creation in this context
    );

  } catch (error: any) {
    console.error('[API /leads/register-source] Unexpected error:', error);
    return createResponse(
      { 
        success: false, 
        message: 'Unexpected server error during source registration',
        error: error.message || String(error)
      }, 
      500
    );
  }
}
