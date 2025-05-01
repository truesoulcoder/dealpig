'use server';

import { createAdminClient } from '@/lib/supabase';
import { FileObject } from '@supabase/storage-js'; // Import type if needed

/**
 * Lists files in the lead-imports storage bucket.
 * @returns Promise<FileObject[]>
 */
export async function listStorageFiles(): Promise<FileObject[]> {
  const admin = createAdminClient();

  const { data, error } = await admin.storage
    .from('lead-imports')
    .list(undefined, { // List all files in the root of the bucket
      limit: 100, // Adjust limit as needed
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('[listStorageFiles] Error listing files:', error);
    throw new Error(`Failed to list storage files: ${error.message}`);
  }

  // Filter out potential placeholder files if Supabase adds them (like .emptyFolderPlaceholder)
  return (data || []).filter(file => file.name !== '.emptyFolderPlaceholder');
}
