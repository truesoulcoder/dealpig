'use server';

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

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

  // Admin client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const admin = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Clear staging table and insert raw rows
  await admin.from(rawTable).delete();
  const batchSize = 500;
  for (let i = 0; i < (rows as any[]).length; i += batchSize) {
    const batch = (rows as any[]).slice(i, i + batchSize);
    await admin.from(rawTable).insert(batch);
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

  // Execute raw SQL via RPC (assumes run_sql function exists)
  const { data: execResult, error: execError } = await admin.rpc('run_sql', { sql });
  if (execError) throw execError;

  return { rawTable, normalizedTable, count: (rows as any[]).length };
}
