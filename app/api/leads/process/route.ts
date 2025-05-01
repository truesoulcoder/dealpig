import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createResponse } from '@/lib/api';
import { normalizeLeadsForSource } from '@/actions/leadIngestion.action';
import { LeadSourceMetadata } from '@/helpers/types';

export const runtime = 'nodejs'; // Necessary for using Node.js APIs like crypto

/**
 * API Route to trigger the normalization and insertion of leads for a given source ID.
 */
export async function POST(request: NextRequest) {
  console.log('[API /leads/process] POST handler called');
  try {
    const body = await request.json();
    const { sourceId } = body;

    if (!sourceId || typeof sourceId !== 'string') {
      console.error('[API /leads/process] Missing or invalid sourceId in request body');
      return createResponse({ success: false, message: 'Missing or invalid sourceId' }, 400);
    }

    console.log(`[API /leads/process] Received request to process sourceId: ${sourceId}`);

    const admin = createAdminClient();

    // 1. Fetch the lead source record to get metadata (columnMap)
    console.log(`[API /leads/process] Fetching lead source details for ID: ${sourceId}`);
    const { data: leadSource, error: fetchSourceError } = await admin
      .from('lead_sources')
      .select('id, metadata, name, storage_path') // Need metadata and storage_path
      .eq('id', sourceId)
      .single();

    if (fetchSourceError) {
      console.error(`[API /leads/process] Error fetching lead source ${sourceId}:`, fetchSourceError);
      return createResponse({ success: false, message: `Error fetching lead source: ${fetchSourceError.message}` }, 404);
    }

    if (!leadSource) {
      console.error(`[API /leads/process] Lead source ${sourceId} not found.`);
      return createResponse({ success: false, message: `Lead source ${sourceId} not found.` }, 404);
    }

    console.log(`[API /leads/process] Found lead source: ${leadSource.name}`);

    // 2. Validate metadata and extract columnMap
    const metadata = leadSource.metadata as LeadSourceMetadata | null;
    if (!metadata || !metadata.columnMap || typeof metadata.columnMap !== 'object' || Object.keys(metadata.columnMap).length === 0) {
      console.error(`[API /leads/process] Missing or invalid columnMap in metadata for source ${sourceId}`);
      return createResponse({ success: false, message: 'Lead source is not configured properly (missing column mapping). Please configure it first.' }, 400);
    }
    
    // Filter out null/empty values from the map before passing to the action
    const columnMap = Object.entries(metadata.columnMap)
        .filter(([_, value]) => value !== null && value !== '')
        .reduce((acc, [key, value]) => {
            acc[key] = value as string; // Cast is safe due to filter
            return acc;
        }, {} as Record<string, string>);

    if (Object.keys(columnMap).length === 0) {
        console.error(`[API /leads/process] Column map is empty after filtering null/empty values for source ${sourceId}`);
        return createResponse({ success: false, message: 'Lead source configuration resulted in an empty column map. Please reconfigure.' }, 400);
    }

    console.log(`[API /leads/process] Extracted column map for source ${sourceId}:`, columnMap);

    // 3. Call the normalization action (no need to pass storage_path, it fetches it internally)
    console.log(`[API /leads/process] Calling normalizeLeadsForSource for source ${sourceId}...`);
    const normalizationResult = await normalizeLeadsForSource(sourceId, columnMap);

    // 4. Return the result from the action
    if (!normalizationResult.success) {
      console.error(`[API /leads/process] Normalization failed for source ${sourceId}:`, normalizationResult.message, normalizationResult.error);
      // Use a 500 status for processing failures
      return createResponse(
        { 
          success: false, 
          message: normalizationResult.message || 'Lead normalization failed.',
          error: normalizationResult.error ? JSON.stringify(normalizationResult.error) : undefined
        }, 
        500
      );
    }

    console.log(`[API /leads/process] Normalization successful for source ${sourceId}. Inserted: ${normalizationResult.insertedCount}`);
    return createResponse(
      { 
        success: true, 
        message: normalizationResult.message || `Successfully processed ${normalizationResult.insertedCount} leads.`,
        insertedCount: normalizationResult.insertedCount
      }, 
      200
    );

  } catch (error: any) {
    console.error('[API /leads/process] Unexpected error:', error);
    return createResponse(
      { 
        success: false, 
        message: 'Unexpected server error during lead processing',
        error: error.message || String(error)
      }, 
      500
    );
  }
}
