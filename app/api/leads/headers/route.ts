import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createResponse } from '@/lib/api';
import Papa from 'papaparse';
import { Readable } from 'stream';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
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
      .from('lead-imports') // Ensure this matches your bucket name
      .download(storagePath.replace('lead-imports/', '')); // Remove bucket prefix if present

    if (downloadError) {
      console.error(`[API /leads/headers] Storage download error for ${storagePath}:`, downloadError);
      return createResponse({ success: false, message: `Storage download error: ${downloadError.message}` }, 500);
    }

    if (!blob) {
        console.error(`[API /leads/headers] No data returned from storage download for ${storagePath}`);
        return createResponse({ success: false, message: 'Failed to download file data from storage.' }, 500);
    }

    console.log(`[API /leads/headers] File downloaded successfully, size: ${blob.size} bytes. Parsing headers...`);

    // Parse only the header row using PapaParse stream
    const headers: string[] = await new Promise((resolve, reject) => {
      let firstChunk = true;
      const stream = Readable.from(blob.stream()); // Convert Blob stream to Node stream

      Papa.parse<string[]>(stream, {
        header: false, // We want the first row as an array
        preview: 1, // Only parse the first row
        step: (results) => {
          if (results.data && results.data.length > 0) {
            // Filter out any potentially empty strings from the header row
            const foundHeaders = results.data[0].map(h => String(h).trim()).filter(h => h !== '');
             console.log(`[API /leads/headers] Parsed headers:`, foundHeaders);
            resolve(foundHeaders);
          } else {
             console.warn(`[API /leads/headers] No data found in the first row for ${storagePath}.`);
            resolve([]); // Resolve with empty array if no data
          }
          // Abort parsing after the first row is processed
          // Note: PapaParse streams might not have an explicit abort in this setup,
          // but `preview: 1` should limit processing.
        },
        error: (error) => {
          console.error(`[API /leads/headers] PapaParse error for ${storagePath}:`, error);
          reject(new Error(`Failed to parse CSV headers: ${error.message}`));
        },
        complete: () => {
          // This might be called even if step resolved, ensure we don't overwrite
          // If step didn't resolve (e.g., empty file), resolve with empty array
          // This is a fallback, step should ideally handle it.
          // resolve([]); // Removed to avoid potential double-resolve issues
           console.log(`[API /leads/headers] PapaParse complete for ${storagePath}.`);
        }
      });
    });

    return createResponse({ success: true, headers: headers }, 200);

  } catch (error: any) {
    console.error(`[API /leads/headers] Unexpected error for ${storagePath}:`, error);
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
