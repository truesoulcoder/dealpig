'use server';

import fs from 'fs';
import path from 'path';
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

  // Derive safe table suffix
  const base = file.name.replace(/\.[^/.]+$/, '')
                     .replace(/[^a-zA-Z0-9_]/g, '_')
                     .toLowerCase();
  const timestamp = Date.now();
  const rawTable = 'leads';
  const normalizedTable = `normalized_${base}_${timestamp}`;

  // Service-role admin client for all DB operations
  const supabase = createAdminClient();

  // Upload raw CSV to storage bucket
  const bucket = 'lead-uploads';
  const storagePath = `${timestamp}_${file.name}`;
  const { error: storageError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, file);
  if (storageError) throw storageError;

  // Record source in lead_sources table (optional tracking)
  await supabase.from('lead_sources').insert({
    name: file.name,
    file_name: file.name,
    storage_path: storagePath,
    last_imported: new Date().toISOString(),
    record_count: (rows as any[]).length,
    is_active: true,
  });

  // Clear staging table and insert raw rows
  await supabase.from(rawTable).delete();
  const batchSize = 500;
  for (let i = 0; i < (rows as any[]).length; i += batchSize) {
    const batch = (rows as any[]).slice(i, i + batchSize);
    await supabase.from(rawTable).insert(batch);
  }

  // Read and adjust normalize script
  const sqlPath = path.resolve(process.cwd(), 'supabase', 'normalizeLeadsScript.sql');
  let sql = fs.readFileSync(sqlPath, 'utf-8');
  sql = sql.replace(/DROP TABLE IF EXISTS normalized_leads;/,
                    `DROP TABLE IF EXISTS ${normalizedTable};`);
  sql = sql.replace(/CREATE TABLE normalized_leads/,
                    `CREATE TABLE ${normalizedTable}`);
  sql = sql.replace(/INSERT INTO normalized_leads/,
                    `INSERT INTO ${normalizedTable}`);
  sql = sql.replace(/CREATE INDEX IF NOT EXISTS idx_normalized_leads_email/,
                    `CREATE INDEX IF NOT EXISTS idx_${normalizedTable}_email`);
  sql = sql.replace(/CREATE INDEX IF NOT EXISTS idx_normalized_leads_property_address/,
                    `CREATE INDEX IF NOT EXISTS idx_${normalizedTable}_property_address`);
  // Fix index ON clauses to reference the dynamic table name
  sql = sql.replace(/ON normalized_leads/g, `ON ${normalizedTable}`);

  // Execute raw SQL via RPC (assumes run_sql function exists)
  const { error: execError } = await supabase.rpc('run_sql', { sql });
  if (execError) {
    console.error('Error executing normalization script:', execError);
    // Optionally, delete the empty normalized table and the lead_source record
    // await supabase.rpc('run_sql', { sql: `DROP TABLE IF EXISTS ${normalizedTable};` });
    // await supabase.from('lead_sources').delete().match({ storage_path: storagePath });
    throw new Error(`Failed to normalize leads: ${execError.message}`);
  }

  return { rawTable, normalizedTable, count: (rows as any[]).length };
}
