'use server';

import Papa from 'papaparse';
import { createAdminClient } from '@/lib/supabase';

export async function uploadLeads(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

  // Parse CSV
  const text = await file.text();
  const { data: rows, errors } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (errors.length) throw new Error(`CSV parse error: ${errors.map(e => e.message).join(', ')}`);

  const rawRows = rows as any[];
  if (rawRows.length === 0) {
    return { message: 'CSV file is empty or contains no data.', count: 0 };
  }

  // Use service-role admin client for all DB operations
  const supabase = createAdminClient();
  const timestamp = Date.now();

  // 1. Upload raw CSV to storage bucket
  const bucket = 'lead-uploads';
  const storagePath = `${timestamp}_${file.name}`;
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file);
  if (storageError) {
    console.error('Storage upload error:', storageError);
    throw new Error(`Failed to upload file to storage: ${storageError.message}`);
  }

  // 2. Record source in lead_sources table (optional tracking)
  // Consider adding status field here (e.g., 'UPLOADED')
  const { error: sourceError } = await supabase.from('lead_sources').insert({
    name: file.name,
    file_name: file.name,
    storage_path: storagePath,
    last_imported: new Date().toISOString(),
    record_count: rawRows.length,
    is_active: true, // Or manage status explicitly
  });
  if (sourceError) {
    console.error('Lead source insert error:', sourceError);
    // Optionally attempt to delete the uploaded file if source record fails
    // await supabase.storage.from(bucket).remove([storagePath]);
    throw new Error(`Failed to record lead source: ${sourceError.message}`);
  }

  // 3. Clear staging table and insert raw rows
  // IMPORTANT: 'leads' table acts as a staging area per upload.
  // Ensure its schema matches the expected raw CSV headers from PapaParse.
  const stagingTable = 'leads';
  // Corrected delete condition for UUID column
  const { error: deleteError } = await supabase.from(stagingTable).delete().not('id', 'is', null); 
  if (deleteError) {
    console.error('Staging table clear error:', deleteError);
    throw new Error(`Failed to clear staging table: ${deleteError.message}`);
  }

  const batchSize = 500;
  for (let i = 0; i < rawRows.length; i += batchSize) {
    const batch = rawRows.slice(i, i + batchSize);
    const { error: insertError } = await supabase.from(stagingTable).insert(batch);
    if (insertError) {
      console.error(`Batch insert error (rows ${i} to ${i + batchSize}):`, insertError);
      // Consider rollback or cleanup strategy here
      throw new Error(`Failed to insert batch into staging table: ${insertError.message}`);
    }
  }

  // 4. Call the normalization function via RPC
  const { error: rpcError } = await supabase.rpc('normalize_staged_leads');
  if (rpcError) {
    console.error('Error calling normalize_staged_leads RPC:', rpcError);
    // Consider what state to leave the system in - raw data is staged, but normalization failed.
    // Maybe update lead_sources status to 'STAGING_FAILED' or 'NORMALIZATION_FAILED'.
    throw new Error(`Failed to trigger lead normalization: ${rpcError.message}`);
  }

  // 5. Return success (count refers to raw rows staged)
  return { message: `Successfully staged ${rawRows.length} rows. Normalization triggered.`, count: rawRows.length };
}
