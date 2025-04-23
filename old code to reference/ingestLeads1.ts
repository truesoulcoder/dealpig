import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing environment variables for Supabase');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ingestCSV(): Promise<number> {
  // Define the CSV file location relative to the project root
  const csvPath = path.resolve(process.cwd(), 'data', 'leads.csv');
  console.log('📄 Reading CSV from', csvPath);

  // Read the CSV file
  const raw = fs.readFileSync(csvPath, 'utf8');

  // Parse the CSV file with a header row and BOM support
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];

  console.log(`🧮 Parsed ${rows.length} rows from CSV`);

  let inserted = 0;
  for (const row of rows) {
    // 1) Filter by Days On Market (DOM) ≥ 90
    const dom = Number(row['MLS_Curr_DaysOnMarket']);
    if (isNaN(dom) || dom < 90) continue;

    // 2) Validate that there’s at least one contact email
    const contact1_email = (row['Contact1Email_1'] || '').trim() || null;
    const contact2_email = (row['Contact1Email_2'] || '').trim() || null;
    const contact3_email = (row['Contact1Email_3'] || '').trim() || null;
    if (!contact1_email && !contact2_email && !contact3_email) continue;

    // 3) Retrieve contact names
    const contact1_name = (row['Contact1Name'] || '').trim() || null;
    const contact2_name = (row['Contact2Name'] || '').trim() || null;
    const contact3_name = (row['Contact3Name'] || '').trim() || null;

    // 4) Build property address (with fallback to recipient fields)
    const property_address = ((row['PropertyAddress'] || row['RecipientAddress']) || '').trim();
    const property_city = ((row['PropertyCity'] || row['RecipientCity']) || '').trim();
    const property_state = ((row['PropertyState'] || row['RecipientState']) || '').trim();
    const property_postal_code = ((row['PropertyPostalCode'] || row['RecipientPostalCode']) || '').trim();

    // 5) Parse the wholesale value
    const wholesale_value = parseFloat((row['WholesaleValue'] || '0').replace(/[$,]/g, ''));

    // 6) Insert the record into Supabase
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
  return inserted;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET for this ingestion endpoint
  if (req.method !== 'GET') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const inserted = await ingestCSV();
    res.status(200).json({ message: `🎉 Successfully inserted ${inserted} leads` });
  } catch (error: any) {
    console.error('💥 Ingestion error:', error);
    res.status(500).json({ error: error.message });
  }
}