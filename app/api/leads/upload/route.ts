import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';   // service‑role client
import Papa from 'papaparse';
import { randomUUID } from 'crypto';

// Helper to post log events directly to Supabase for realtime UI Console Log
import { cookies } from 'next/headers';
async function postLogEvent(type: 'info' | 'error' | 'success', message: string) {
  try {
    const sb = createAdminClient();
    // Try to get user_id from cookie/session (if available)
    let user_id = null;
    try {
      const cookieStore = await cookies();
      const session = cookieStore.get('sb:token') || cookieStore.get('sb-access-token');
      if (session) {
        // If you store user_id elsewhere, update this logic
        user_id = session.value;
      }
    } catch {}
    await sb.from('console_log_events').insert({
      type,
      message,
      user_id,
      timestamp: new Date().getTime(),
    });
  } catch (err) {
    console.error('Error posting log event:', err);
  }
}

export async function POST(req: Request) {
  const steps: string[] = [];
  try {
    /* ───── 0. grab the file ───── */
    const form = await req.formData();
    const file = form.get('file') as File | null;
    console.log('[upload] file present?', !!file);

    if (!file) {
      await postLogEvent('error', 'No file provided for upload.');
      steps.push('❌ No file provided for upload.');
      return NextResponse.json({ ok: false, error: 'No file', steps }, { status: 400 });
    }
    steps.push(`Started upload: ${file.name}`);
    await postLogEvent('info', `Started upload: ${file.name}`);
    steps.push('Uploading file to Supabase Storage...');
    await postLogEvent('info', 'Uploading file to Supabase Storage...');

    /* ───── 1. upload raw file to Storage ───── */
    const sb = createAdminClient();                // uses service‑role key
    const bucket = 'lead-uploads';
    const { data, error } = await sb.storage.from(bucket).upload(file.name, file);
    if (error) {
      console.error('Error uploading file:', error);
      await postLogEvent('error', `Error uploading file: ${error.message}`);
      steps.push(`❌ Error uploading file: ${error.message}`);
      return NextResponse.json({ ok: false, error: error.message, steps }, { status: 500 });
    }
    steps.push('File uploaded successfully.');
    await postLogEvent('success', 'File uploaded successfully.');
    steps.push('Parsing CSV...');
    await postLogEvent('info', 'Parsing CSV...');

    try {
      /* ───── 2. parse CSV and bulk insert ───── */
      const { data: rows, errors } = Papa.parse<Record<string, any>>(await file.text(), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        dynamicTyping: true,
        complete: (results) => {
          results.data.forEach((row) => {
            row.avm = row.avm || null; // Set default value for missing 'avm' column
          });
        }
      });

      if (errors.length) {
        await postLogEvent('error', `CSV parse errors: ${errors.length} errors in ${file.name}`);
        steps.push(`❌ CSV parse errors: ${errors.length} errors in ${file.name}`);
        return NextResponse.json({ ok: false, error: 'CSV parse errors', details: errors, steps }, { status: 400 });
      }
      steps.push(`Parsed ${rows.length} rows from ${file.name}`);
      await postLogEvent('success', `Parsed ${rows.length} rows from ${file.name}`);
      steps.push('Fetching database schema and mapping columns...');
      await postLogEvent('info', 'Fetching database schema and mapping columns...');

      // Fetch the valid columns from the leads table AND create a map for CSV header -> DB column name
      const { data: columnsData, error: columnsErr } = await sb.rpc('run_sql', {
        sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position`
      });

      if (columnsErr || !columnsData) {
        await postLogEvent('error', `Failed to fetch leads table columns: ${columnsErr?.message}`);
        steps.push(`❌ Failed to fetch leads table columns: ${columnsErr?.message}`);
        return NextResponse.json({ ok: false, error: columnsErr?.message || 'Could not fetch leads table columns', details: columnsErr, steps }, { status: 500 });
      }

      // Create a map: lowercase CSV header -> exact DB column name
      let dbColumns: string[] = [];
      const csvHeaderToDbColumnMap = new Map<string, string>();
      try {
        const resultArr = (columnsData as any[])[0]?.result;
        if (Array.isArray(resultArr)) {
          dbColumns = resultArr.map((c: any) => c.column_name);
          dbColumns.forEach(dbCol => {
            // Normalize DB column name for matching (lowercase, remove quotes if present for key)
            const mapKey = dbCol.toLowerCase().replace(/"/g, '');
            csvHeaderToDbColumnMap.set(mapKey, dbCol);
          });
        } else {
          const errorMsg = `run_sql did not return expected result array: ${JSON.stringify(columnsData)}`;
          await postLogEvent('error', errorMsg);
          steps.push(`❌ ${errorMsg}`);
          return NextResponse.json({ ok: false, error: 'run_sql did not return expected result array', details: columnsData }, { status: 500 });
        }
      } catch (e: any) {
        const errorMsg = `Error parsing columns from run_sql: ${e.message}`;
        await postLogEvent('error', errorMsg);
        steps.push(`❌ ${errorMsg}`);
        return NextResponse.json({ ok: false, error: 'Error parsing columns from run_sql', details: e }, { status: 500 });
      }
      steps.push('Fetched and mapped valid columns from leads table.');
      await postLogEvent('info', 'Fetched and mapped valid columns from leads table.');
      steps.push('Cleaning and preparing data for insertion...');
      await postLogEvent('info', 'Cleaning and preparing data for insertion...');

      // Identify numeric columns from the actual DB schema for cleaning
      const numericColumns = new Set([
        'avm', 'assessed_total', 'assessed_year', 'baths', 'beds',
        'mls_curr_days_on_market', 'square_footage', 'lot_size_sqft',
        'year_built', 'stories', 'units', 'fireplace',
        'tax_amount', 'rental_estimate_low', 'rental_estimate_high',
        'wholesale_value', 'market_value', 'number_of_loans',
        'total_loans', 'ltv', 'loan_amount',
        'estimated_mortgage_balance', 'estimated_mortgage_payment',
        'mortgage_interest_rate', 'mls_curr_list_price',
        'mls_curr_sale_price', 'mls_curr_price_per_sqft', 'mls_curr_sqft',
        'mls_curr_lot', 'mls_curr_beds', 'mls_curr_baths',
        'mls_curr_stories', 'mls_curr_year_built',
        'mls_prev_days_on_market', 'mls_prev_list_price',
        'mls_prev_sale_price', 'mls_prev_price_per_sqft',
        'mls_prev_sqft', 'mls_prev_lot', 'mls_prev_beds',
        'mls_prev_baths', 'mls_prev_stories', 'mls_prev_year_built',
        'retail_score', 'rental_score', 'wholesale_score'
        // Add any other numeric columns from your schema here
      ]);

      // Use the map to build rows with correct DB column names
      const cleanedRows = rows.map((row) => {
        const dbRow: Record<string, any> = {};
        Object.keys(row).forEach(csvHeader => {
          const lowerCsvHeader = csvHeader.toLowerCase();
          if (lowerCsvHeader === 'id') return; // Skip CSV 'Id', let DB generate UUID

          const dbColumnName = csvHeaderToDbColumnMap.get(lowerCsvHeader);
          if (dbColumnName) { // Only include if the CSV header maps to a DB column
            let value = row[csvHeader];

            // Clean numeric fields based on the mapped DB column's lowercase name
            if (numericColumns.has(lowerCsvHeader)) {
              if (typeof value === 'string') {
                // Remove currency symbols, commas, etc.
                const cleanedValue = value.replace(/[$,% ]/g, '');
                // Allow negative numbers with '-' prefix
                if (cleanedValue === '' || cleanedValue === '-') {
                  value = null; // Treat empty or just '-' as null
                } else {
                  const num = parseFloat(cleanedValue);
                  value = isNaN(num) ? null : num;
                }
              } else if (typeof value !== 'number') {
                 // If it's not a string or number already, treat as null
                 value = null;
              }
            }
            // Ensure null for empty strings, otherwise use the potentially cleaned value
            dbRow[dbColumnName] = (value === '' || value === undefined) ? null : value;
          }
        });
        return dbRow;
      });

      // Log any CSV columns that did not map to a DB column
      const csvColumns = Object.keys(rows[0] || {}).map(k => k.toLowerCase());
      const unmappedCsvColumns = csvColumns.filter(csvCol => csvCol !== 'id' && !csvHeaderToDbColumnMap.has(csvCol));
      if (unmappedCsvColumns.length > 0) {
        const msg = `CSV columns not found in DB schema and skipped: ${unmappedCsvColumns.join(', ')}`;
        await postLogEvent('info', msg);
        steps.push(`Skipped CSV columns: ${unmappedCsvColumns.join(', ')}`);
      }

      // Extra debug logging for first row using mapped DB names
      if (cleanedRows.length > 0) {
        console.log('[upload] first cleaned row for DB insert:', cleanedRows[0]);
        await postLogEvent('info', `Sample row for insert: ${JSON.stringify(cleanedRows[0])}`)
      }

      if (cleanedRows.length === 0) {
         const msg = 'No valid rows found after cleaning/mapping. Check CSV headers and DB schema.';
         await postLogEvent('error', msg);
         steps.push(`❌ ${msg}`);
         return NextResponse.json({ ok: false, error: msg, steps }, { status: 400 });
      }

      steps.push(`Attempting to insert ${cleanedRows.length} leads into database...`);
      await postLogEvent('info', `Attempting to insert ${cleanedRows.length} leads into database...`);

      let insertErr, count;
      try {
        const insertResult = await sb
          .from('leads')
          .insert(cleanedRows as any[], { count: 'exact' });
        insertErr = insertResult.error;
        count = insertResult.count;
      } catch (e: any) {
        await postLogEvent('error', `Bulk insert threw: ${e.message}`);
        await postLogEvent('error', `First row: ${JSON.stringify(cleanedRows[0])}`);
        return NextResponse.json({ ok: false, error: e.message, details: e }, { status: 500 });
      }
      if (insertErr) {
        await postLogEvent('error', `Database insert failed: ${insertErr.message}`);
        await postLogEvent('error', `First row: ${JSON.stringify(cleanedRows[0])}`);
        steps.push(`❌ Database insert failed: ${insertErr.message}`);
        return NextResponse.json({ ok: false, error: insertErr.message, details: insertErr, steps }, { status: 500 });
      }
      steps.push(`Inserted ${count} leads into database from ${file.name}`);
      await postLogEvent('success', `Inserted ${count} leads into database from ${file.name}`);
      steps.push('Creating normalized_leads table...');
      await postLogEvent('info', 'Creating normalized_leads table...');

      /* ───── 3. Drop and recreate normalized_leads table (fresh for each batch) ───── */
      const createNormalizedTableSQL = `
        DROP TABLE IF EXISTS normalized_leads;
        CREATE TABLE normalized_leads (
          id SERIAL PRIMARY KEY,
          original_lead_id BIGINT,
          contact_name TEXT,
          contact_email TEXT,
          property_address TEXT,
          property_city TEXT,
          property_state TEXT,
          property_postal_code TEXT,
          property_type TEXT,
          baths TEXT,
          beds INTEGER,
          year_built INTEGER,
          square_footage INTEGER,
          wholesale_value NUMERIC,
          assessed_total NUMERIC,
          mls_curr_status TEXT,
          mls_curr_days_on_market INTEGER
        );`;
      const { error: createNormErr } = await sb.rpc('run_sql', { sql: createNormalizedTableSQL });
      if (createNormErr) {
        await postLogEvent('error', `Failed to create normalized_leads table: ${createNormErr.message}`);
        steps.push(`❌ Failed to create normalized_leads table: ${createNormErr.message}`);
        return NextResponse.json({ ok: false, error: createNormErr.message, details: createNormErr, steps }, { status: 500 });
      }
      steps.push('Created normalized_leads table for import.');
      await postLogEvent('success', 'Created normalized_leads table for import.');
      steps.push('Normalizing data...');
      await postLogEvent('info', 'Normalizing data...');

      /* ───── 4. Normalize data using mapping and WHERE logic ───── */
      // Helper function to safely cast text to numeric, removing common non-numeric chars
      const safeNumericCast = (colName: string) => `"${colName}"`;
      const safeIntegerCast = (colName: string) => `"${colName}"`;

      const normalizationSQL = `
        INSERT INTO normalized_leads (
          original_lead_id, contact_name, contact_email,
          property_address, property_city, property_state, property_postal_code,
          property_type, baths, beds, year_built, square_footage,
          wholesale_value, assessed_total, mls_curr_status, mls_curr_days_on_market
        )
        SELECT
          id,
          contact1_name, contact1_email_1,
          property_address, property_city, property_state, property_postal_code,
          property_type,
          ${safeIntegerCast('baths')},
          ${safeIntegerCast('beds')},
          ${safeIntegerCast('year_built')},
          ${safeNumericCast('square_footage')},
          ${safeNumericCast('wholesale_value')},
          ${safeNumericCast('"ASSESSED_TOTAL"')}, -- Note: Quoted identifier
          mls_curr_status,
          ${safeIntegerCast('mls_curr_days_on_market')}
        FROM leads
        WHERE contact1_name IS NOT NULL AND TRIM(contact1_name) <> ''
          AND contact1_email_1 IS NOT NULL AND TRIM(contact1_email_1) <> ''

        UNION ALL

        SELECT
          id,
          contact2_name, contact2_email_1,
          property_address, property_city, property_state, property_postal_code,
          property_type,
          ${safeIntegerCast('baths')},
          ${safeIntegerCast('beds')},
          ${safeIntegerCast('year_built')},
          ${safeNumericCast('square_footage')},
          ${safeNumericCast('wholesale_value')},
          ${safeNumericCast('"ASSESSED_TOTAL"')},
          mls_curr_status,
          ${safeIntegerCast('mls_curr_days_on_market')}
        FROM leads
        WHERE contact2_name IS NOT NULL AND TRIM(contact2_name) <> ''
          AND contact2_email_1 IS NOT NULL AND TRIM(contact2_email_1) <> ''
          AND (contact1_name IS NULL OR TRIM(contact1_name) = '' OR contact1_email_1 IS NULL OR TRIM(contact1_email_1) = '') -- Only use if contact 1 invalid

        UNION ALL

        SELECT
          id,
          contact3_name, contact3_email_1,
          property_address, property_city, property_state, property_postal_code,
          property_type,
          ${safeIntegerCast('baths')},
          ${safeIntegerCast('beds')},
          ${safeIntegerCast('year_built')},
          ${safeNumericCast('square_footage')},
          ${safeNumericCast('wholesale_value')},
          ${safeNumericCast('"ASSESSED_TOTAL"')},
          mls_curr_status,
          ${safeIntegerCast('mls_curr_days_on_market')}
        FROM leads
        WHERE contact3_name IS NOT NULL AND TRIM(contact3_name) <> ''
          AND contact3_email_1 IS NOT NULL AND TRIM(contact3_email_1) <> ''
          AND (contact1_name IS NULL OR TRIM(contact1_name) = '' OR contact1_email_1 IS NULL OR TRIM(contact1_email_1) = '') -- Only use if contact 1 invalid
          AND (contact2_name IS NULL OR TRIM(contact2_name) = '' OR contact2_email_1 IS NULL OR TRIM(contact2_email_1) = '') -- Only use if contact 2 invalid

        UNION ALL

        SELECT
          id,
          mls_curr_list_agent_name, mls_curr_list_agent_email,
          property_address, property_city, property_state, property_postal_code,
          property_type,
          ${safeIntegerCast('baths')},
          ${safeIntegerCast('beds')},
          ${safeIntegerCast('year_built')},
          ${safeNumericCast('square_footage')},
          ${safeNumericCast('wholesale_value')},
          ${safeNumericCast('"ASSESSED_TOTAL"')},
          mls_curr_status,
          ${safeIntegerCast('mls_curr_days_on_market')}
        FROM leads
        WHERE mls_curr_list_agent_name IS NOT NULL AND TRIM(mls_curr_list_agent_name) <> ''
          AND mls_curr_list_agent_email IS NOT NULL AND TRIM(mls_curr_list_agent_email) <> ''
          AND (contact1_name IS NULL OR TRIM(contact1_name) = '' OR contact1_email_1 IS NULL OR TRIM(contact1_email_1) = '') -- Only use if contact 1 invalid
          AND (contact2_name IS NULL OR TRIM(contact2_name) = '' OR contact2_email_1 IS NULL OR TRIM(contact2_email_1) = '') -- Only use if contact 2 invalid
          AND (contact3_name IS NULL OR TRIM(contact3_name) = '' OR contact3_email_1 IS NULL OR TRIM(contact3_email_1) = ''); -- Only use if contact 3 invalid
      `;

      // Execute the normalization SQL
      const { error: normErr } = await sb.rpc('run_sql', { sql: normalizationSQL });
      if (normErr) {
        await postLogEvent('error', `Normalization failed: ${normErr.message}`);
        steps.push(`❌ Normalization failed: ${normErr.message}`);
        return NextResponse.json({ ok: false, error: normErr.message, details: normErr, steps }, { status: 500 });
      }
      steps.push('Data normalization step completed.');
      await postLogEvent('success', 'Data normalization step completed.');
      steps.push('Renaming normalized_leads table and truncating leads table...');
      await postLogEvent('info', 'Renaming normalized_leads table and truncating leads table...');

      /* ───── 5. Rename normalized_leads to normalized_{filename}_{hash} and truncate leads ───── */
      // Compute baseName and hash from the actual stored file name
      // storageFileName: `${baseName}_${uniqueHash}${ext}`
      const storageBaseMatch = file.name.match(/^(.*)_([0-9a-fA-F-]+)\.[^/.]+$/);
      let normBaseName = file.name;
      let normHash = randomUUID().slice(0, 8);
      if (storageBaseMatch) {
        normBaseName = storageBaseMatch[1];
        normHash = storageBaseMatch[2].slice(0, 8);
      }
      const normTableName = `normalized_${normBaseName}_${normHash}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const renameSQL = `ALTER TABLE IF EXISTS normalized_leads RENAME TO ${normTableName};\nTRUNCATE TABLE leads;`;
      try {
        const { error: sqlErr } = await sb.rpc('run_sql', { sql: renameSQL });
        if (sqlErr) {
          console.error('Detailed error message:', sqlErr);
          steps.push(`❌ Failed to rename/truncate table: ${sqlErr.message}`);
          return NextResponse.json({ ok: false, error: sqlErr.message, details: sqlErr, steps }, { status: 500 });
        }
      } catch (error: any) {
        console.error('Detailed error message:', error);
        steps.push(`❌ Failed to rename/truncate table: ${error.message}`);
        return NextResponse.json({ ok: false, error: error.message, details: error, steps }, { status: 500 });
      }
      steps.push(`Upload and normalization complete. File stored as ${file.name}. Table: ${normTableName}`);
      await postLogEvent('success', `Upload and normalization complete. File stored as ${file.name}. Table: ${normTableName}`);
      return NextResponse.json({ ok: true, rows: count, normalized: true, normalized_table: normTableName, steps });
    } catch (error: any) {
      console.error('Unexpected error during upload process:', error);
      return NextResponse.json({ ok: false, error: error.message, steps }, { status: 500 });
    }
  } catch (e: any) {
    console.error('Unexpected error:', e);
    await postLogEvent('error', `Unexpected error: ${e.message}`);
    return NextResponse.json({ ok: false, error: 'Server exception', steps }, { status: 500 });
  }
}