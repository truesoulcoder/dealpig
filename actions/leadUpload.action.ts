'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import { Database } from '@/types/supabase'; // Import generated types
import { randomUUID } from 'crypto'; // Add randomUUID import

// Helper function to convert header keys to snake_case
const toSnakeCase = (str: string): string => {
  return str
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
    .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`) // Convert camelCase to snake_case
    .replace(/^_/, '') // Remove leading underscore if any
    .toLowerCase(); // Ensure everything is lowercase
};

// Define the expected shape of a row after header transformation
// This should align with the columns added in the migration
// 20250502023012_add_all_csv_columns_to_leads.sql
type LeadStagingRow = Database['public']['Tables']['leads']['Insert'];

export async function uploadLeads(formData: FormData) {
  const file = formData.get('leadCsv') as File;
  if (!file) return { success: false, error: 'No file provided.' };

  const supabase = createServerActionClient<Database>({ cookies });

  try {
    /* ---------- 1.  PUSH THE RAW FILE TO STORAGE ---------- */
    const fileBytes = await file.arrayBuffer();
    const bucket = 'lead-uploads';
    const objectPath = `${randomUUID()}/${Date.now()}-${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from(bucket)
      .upload(objectPath, fileBytes, {
        cacheControl: '3600',
        contentType: file.type || 'text/csv',
        upsert: false,
      });

    if (uploadErr) {
      console.error('Storage upload failed:', uploadErr);
      return { success: false, error: 'Storage upload failed', details: uploadErr.message };
    }

    /* ---------- 2.  PARSE + BULK INSERT INTO leads ---------- */
    const csvText = new TextDecoder().decode(fileBytes);
    const parsed = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => toSnakeCase(h.trim()),
    });
    if (parsed.errors.length) {
      return { success: false, error: 'CSV parse errors', details: parsed.errors };
    }
    const rows = parsed.data as LeadStagingRow[];
    if (!rows.length) return { success: false, error: 'CSV contained no rows.' };

    // bulk insert (Supabase limits ~10 MB payload, chunk if needed)
    const { error: insertErr, count } = await supabase
      .from('leads')
      .insert(rows, { count: 'exact' });

    if (insertErr) {
      console.error('Insert error:', insertErr);
      return { success: false, error: 'Insert failed', details: insertErr.message };
    }

    /* ---------- 3.  TRIGGER NORMALISATION ---------- */
    const { error: rpcErr } = await supabase.rpc('normalize_staged_leads');
    if (rpcErr) {
      console.error('Normalization RPC failed:', rpcErr);
      return { success: true, warning: 'Rows inserted but normalization failed', details: rpcErr.message };
    }

    return { success: true, count };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: 'Server exception', details: msg };
  }
}