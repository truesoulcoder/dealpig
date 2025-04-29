'use server';

import { createAdminClient } from '@/lib/supabase';
import Papa from 'papaparse';
import crypto from 'crypto';

// Parses CSV from storage for a given lead_source ID and ingests into a raw table
export async function ingestLeadSource(sourceId: string) {
  const admin = createAdminClient();
  console.log('[LeadIngestion] Starting ingestion for source:', sourceId);
  
  // Fetch source info
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('name')
    .eq('id', sourceId)
    .single();
    
  if (srcErr || !sourceData) {
    console.error('[LeadIngestion] Source fetch error:', srcErr);
    throw new Error(srcErr?.message || 'Source not found');
  }
  
  const fileName = sourceData.name;
  console.log('[LeadIngestion] Processing file:', fileName);

  // Download CSV from storage
  const { data: fileBlob, error: blobErr } = await admin.storage
    .from('lead-imports')
    .download(fileName);
    
  if (blobErr || !fileBlob) {
    console.error('[LeadIngestion] File download error:', blobErr);
    throw new Error(blobErr?.message || 'Failed to download file');
  }
  
  const text = await fileBlob.text();
  console.log('[LeadIngestion] File downloaded, size:', text.length);

  // Parse CSV into JSON rows
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    console.error('[LeadIngestion] CSV parse errors:', parsed.errors);
    throw new Error('Failed to parse CSV');
  }
  
  const rows = parsed.data;
  console.log('[LeadIngestion] Parsed rows:', rows.length);

  // Build raw table name
  const rawTable = `raw_${sourceId.replace(/-/g, '_')}`;
  console.log('[LeadIngestion] Creating raw table:', rawTable);

  try {
    // Create table if not exists with TEXT columns for each header
    const cols = Object.keys(rows[0] || {}).map((col) => `"${col}" TEXT`).join(', ');
    const createTableQuery = `CREATE TABLE IF NOT EXISTS "${rawTable}" (${cols});`;
    
    const { error: createError } = await admin.rpc('exec_sql', { query: createTableQuery });
    if (createError) {
      console.error('[LeadIngestion] Table creation error:', createError);
      throw new Error(`Failed to create table: ${createError.message}`);
    }

    // Insert rows in batches
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const keys = Object.keys(rows[0]);
      const values = batch.map(row => keys.map(k => row[k]));
      
      const { error: insertError } = await admin
        .from(rawTable)
        .insert(values.map(vals => Object.fromEntries(keys.map((k, i) => [k, vals[i]]))));
        
      if (insertError) {
        console.error('[LeadIngestion] Batch insert error:', insertError);
        throw new Error(`Failed to insert batch: ${insertError.message}`);
      }
      
      console.log(`[LeadIngestion] Inserted batch ${i / batchSize + 1}/${Math.ceil(rows.length / batchSize)}`);
    }

    // Update source record count
    const { error: updateError } = await admin
      .from('lead_sources')
      .update({ record_count: rows.length })
      .eq('id', sourceId);
      
    if (updateError) {
      console.error('[LeadIngestion] Update record count error:', updateError);
      throw new Error(`Failed to update record count: ${updateError.message}`);
    }

    console.log('[LeadIngestion] Successfully processed', rows.length, 'rows');
    return { count: rows.length };
  } catch (err) {
    console.error('[LeadIngestion] Unexpected error:', err);
    throw err;
  }
}

// Normalizes raw rows: splits multi-contact fields into individual leads in 'leads' table
export async function normalizeLeadsForSource(sourceId: string) {
  const admin = createAdminClient();
  const rawTable = `raw_${sourceId.replace(/-/g, '_')}`;
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  let inserted = 0;
  try {
    // Fetch all raw rows
    const res = await pg.query(`SELECT * FROM "${rawTable}";`);
    for (const row of res.rows) {
      // Extract contact fields up to 5
      for (let i = 1; i <= 5; i++) {
        const nameKey = `contact${i}name`;
        const emailKey = `contact${i}email`;
        const contactName = row[nameKey];
        const contactEmail = row[emailKey];
        if (contactName && contactEmail) {
          // Build lead record from row plus this contact
          const lead = { ...row, contact_name: contactName, contact_email: contactEmail };
          // Insert into normalized 'leads' table, add source_id
          const { error } = await admin
            .from('leads')
            .insert({ ...lead, source_id: sourceId });
          if (error) console.error('Insert lead error:', error);
          inserted++;
        }
      }
    }
  } finally {
    await pg.end();
  }
  return { success: true, inserted };
}