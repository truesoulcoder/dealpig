'use server';

import { createAdminClient } from '@/lib/supabase';
import { Client } from 'pg';
import Papa from 'papaparse';
import crypto from 'crypto';

// Parses CSV from storage for a given lead_source ID and ingests into a raw table
export async function ingestLeadSource(sourceId: string) {
  const admin = createAdminClient();
  // Fetch source info
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('name')
    .eq('id', sourceId)
    .single();
  if (srcErr || !sourceData) throw new Error(srcErr?.message || 'Source not found');
  const fileName = sourceData.name;

  // Download CSV from storage
  const { data: fileBlob, error: blobErr } = await admin.storage
    .from('lead-imports')
    .download(fileName);
  if (blobErr || !fileBlob) throw new Error(blobErr?.message || 'Failed to download file');
  const text = await fileBlob.text();

  // Parse CSV into JSON rows
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    console.error('CSV parse errors:', parsed.errors);
    throw new Error('Failed to parse CSV');
  }
  const rows = parsed.data;

  // Build raw table name
  const rawTable = `raw_${sourceId.replace(/-/g, '_')}`;

  // Connect to Postgres directly to create raw table and insert rows
  const pg = new Client({ connectionString: process.env.DATABASE_URL });
  await pg.connect();
  try {
    // Create table if not exists with TEXT columns for each header
    const cols = Object.keys(rows[0] || {}).map((col) => `"${col}" TEXT`).join(', ');
    await pg.query(`CREATE TABLE IF NOT EXISTS "${rawTable}" (${cols});`);

    // Insert rows
    for (const row of rows) {
      const keys = Object.keys(row);
      const vals = keys.map((k) => row[k]);
      const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
      await pg.query(
        `INSERT INTO "${rawTable}" (${keys.map((k) => `"${k}"`).join(',')}) VALUES (${placeholders});`,
        vals
      );
    }
    // Update record_count and table_name in lead_sources
    await admin
      .from('lead_sources')
      .update({ record_count: rows.length, table_name: rawTable })
      .eq('id', sourceId);
  } finally {
    await pg.end();
  }
  return { success: true, count: rows.length };
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