import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { supabase } from '@/lib/supabaseClient';

interface Lead {
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  wholesale_value: number;
  market_value: number;
  days_on_market: number;
  mls_status: string;
  mls_list_date?: string;
  mls_list_price?: number;
  status: string;
  source_id?: string;
}

export async function ingestLeadsFromCsv(filePath: string): Promise<number> {
  const csvPath = path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(csvPath, 'utf8');

  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
  }) as Lead[];

  let insertedCount = 0;

  for (const row of rows) {
    const { error } = await supabase.from('leads').insert(row);

    if (error) {
      console.error('Error inserting lead:', error.message);
    } else {
      insertedCount++;
    }
  }

  return insertedCount;
}