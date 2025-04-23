// scripts/ingestLeads.ts
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

// 1) Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 2) Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function ingest() {
  // 3) Read & parse your CSV (with BOM support)
  const csvPath = path.resolve(process.cwd(), 'data', 'leads.csv');
  console.log('📄 Reading CSV from', csvPath);
  const raw = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];
  console.log(`🧮 Parsed ${rows.length} rows from CSV`);

  let inserted = 0;
  for (const row of rows) {
    // 4a) Filter by DOM ≥ 90
    const dom = Number(row['MLS_Curr_DaysOnMarket']);
    if (isNaN(dom) || dom < 90) continue;

    // 4b) Harvest all three contact emails
    const contact1_email = (row['Contact1Email_1'] || '').trim() || null;
    const contact2_email = (row['Contact1Email_2'] || '').trim() || null;
    const contact3_email = (row['Contact1Email_3'] || '').trim() || null;
    if (!contact1_email && !contact2_email && !contact3_email) continue;

    // 4c) Harvest corresponding names
    const contact1_name = (row['Contact1Name'] || '').trim() || null;
    const contact2_name = (row['Contact2Name'] || '').trim() || null;
    const contact3_name = (row['Contact3Name'] || '').trim() || null;

    // 4d) Build property address with fallback to Recipient*
    const property_address     = (row['PropertyAddress']     || row['RecipientAddress']    || '').trim();
    const property_city        = (row['PropertyCity']        || row['RecipientCity']       || '').trim();
    const property_state       = (row['PropertyState']       || row['RecipientState']      || '').trim();
    const property_postal_code = (row['PropertyPostalCode']  || row['RecipientPostalCode'] || '').trim();

    // 4e) Parse wholesale value
    const wholesale_value = parseFloat(
      (row['WholesaleValue'] || '0').replace(/[$,]/g, '')
    );

    // 5) Insert one row per property, carrying all contacts & address/value
    const { error } = await supabase.from('leads').insert({
      dom,
      property_address,
      property_city,
      property_state,
      property_postal_code,
      wholesale_value,
      contact1_email,
      contact2_email,
      contact3_email,
      contact1_name,
      contact2_name,
      contact3_name,
    });

    if (error) {
      console.error('❌ Insert failed for', property_address, error.message);
    } else {
      inserted++;
    }
  }

  console.log(`🎉 Ingestion complete — inserted ${inserted} rows.`);
}

ingest().catch(err => {
  console.error('💥 Fatal ingestion error:', err);
  process.exit(1);
});
