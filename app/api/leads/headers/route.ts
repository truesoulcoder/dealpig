import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createResponse } from '@/lib/api';
import Papa from 'papaparse';
import { requireSuperAdmin } from '@/lib/api-guard';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return createResponse({ success: false, message: error.message }, 401);
    } else if (error.message === 'Forbidden: Not a super admin') {
      return createResponse({ success: false, message: error.message }, 403);
    }
    return createResponse({ success: false, message: 'Access denied' }, 403);
  }

  const { searchParams } = new URL(request.url);
  const storagePath = searchParams.get('path');

  if (!storagePath) {
    return createResponse({ success: false, message: 'Missing storage path parameter' }, 400);
  }

  console.log(`[API /leads/headers] Received request for path: ${storagePath}`);

  try {
    const admin = createAdminClient();

    // Download the file from storage
    console.log(`[API /leads/headers] Downloading file from: ${storagePath}`);
    const { data: blob, error: downloadError } = await admin.storage
      .from('lead-uploads') // Bucket for lead uploads
      .download(storagePath.replace('lead-uploads/', '')); // Remove bucket prefix if present

    if (downloadError) {
      console.error(`[API /leads/headers] Storage download error for ${storagePath}:`, downloadError);
      return createResponse({ success: false, message: `Storage download error: ${downloadError.message}` }, 500);
    }

    if (!blob) {
      console.error(`[API /leads/headers] No data returned from storage download for ${storagePath}`);
      return createResponse({ success: false, message: 'Failed to download file data from storage.' }, 500);
    }

    console.log(`[API /leads/headers] File downloaded successfully, size: ${blob.size} bytes. Parsing headers...`);

    // Convert blob to text and parse CSV
    try {
      const text = await blob.text();
      const parseResult = Papa.parse(text, {
        header: false,
        preview: 1, // Only parse the first row
      });

      if (parseResult.errors && parseResult.errors.length > 0) {
        console.error(`[API /leads/headers] CSV parsing errors:`, parseResult.errors);
        return createResponse({ 
          success: false, 
          message: `CSV parsing error: ${parseResult.errors[0].message}` 
        }, 400);
      }

      if (!parseResult.data || parseResult.data.length === 0) {
        console.warn(`[API /leads/headers] No data found in CSV file`);
        return createResponse({ success: true, headers: [] }, 200);
      }

      // Get the headers from the first row
      const headerRow = parseResult.data[0];
      if (!Array.isArray(headerRow)) {
        console.error(`[API /leads/headers] Expected array for header row, got:`, typeof headerRow);
        return createResponse({ success: false, message: 'Invalid CSV format' }, 400);
      }

      // Clean up headers
      const headers = headerRow.map((h: string) => h.trim()).filter((h: string) => h !== '');
      console.log(`[API /leads/headers] Parsed headers:`, headers);

      return createResponse({ success: true, headers }, 200);
    } catch (parseError: any) {
      console.error(`[API /leads/headers] Error parsing CSV:`, parseError);
      return createResponse({ 
        success: false, 
        message: `Error parsing CSV: ${parseError.message}` 
      }, 500);
    }
  } catch (error: any) {
    console.error(`[API /leads/headers] Unexpected error:`, error);
    return createResponse(
      {
        success: false,
        message: 'Unexpected server error while fetching headers',
        error: error.message || String(error),
      },
      500
    );
  }
}
