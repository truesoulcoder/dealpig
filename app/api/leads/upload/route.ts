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
    // Swallow errors silently for logging
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
    const buf = Buffer.from(await file.arrayBuffer());
    const bucket = 'lead-uploads';
    // Create a file name in the format: uploadedfilename_uniquehash.ext
    const originalName = file.name;
    const extMatch = originalName.match(/\.([^.]+)$/);
    const ext = extMatch ? `.${extMatch[1]}` : '';
    const baseName = originalName.replace(/\.[^.]+$/, '');
    const uniqueHash = randomUUID();
    // Use the original filename + _ + hash + extension
    const storageFileName = `${baseName}_${uniqueHash}${ext}`;
    const objectPath = storageFileName;

    const { error: storeErr } = await sb.storage
      .from(bucket)
      .upload(objectPath, buf, { contentType: file.type || 'text/csv' });

    if (storeErr) {
      await postLogEvent('error', `Failed to upload file to storage: ${storeErr.message}`);
      steps.push(`❌ Failed to upload file to storage: ${storeErr.message}`);
      return NextResponse.json({ ok: false, error: storeErr.message, steps }, { status: 500 });
    }
    steps.push(`File uploaded to storage as ${storageFileName}`);
    await postLogEvent('success', `File uploaded to storage as ${storageFileName}`);
    steps.push('Parsing CSV...');
    await postLogEvent('info', 'Parsing CSV...');

    /* ───── 2. parse CSV and bulk insert ───── */
    const { data: rows, errors } = Papa.parse<Record<string, any>>(buf.toString('utf8'), {
      header: true,
      skipEmptyLines: true
    });

    if (errors.length) {
      await postLogEvent('error', `CSV parse errors: ${errors.length} errors in ${file.name}`);
      steps.push(`❌ CSV parse errors: ${errors.length} errors in ${file.name}`);
      return NextResponse.json({ ok: false, error: 'CSV parse errors', details: errors, steps }, { status: 400 });
    }
    steps.push(`Parsed ${rows.length} rows from ${file.name}`);
    await postLogEvent('success', `Parsed ${rows.length} rows from ${file.name}`);
    steps.push('Cleaning and normalizing fields...');
    await postLogEvent('info', 'Cleaning and normalizing fields...');

    // Fetch the valid columns from the leads table
    // Use SQL without trailing semicolon and handle JSON result
    const { data: columnsData, error: columnsErr } = await sb.rpc('run_sql', {
      sql: `SELECT column_name FROM information_schema.columns WHERE table_name = 'leads'`
    });
    if (columnsErr || !columnsData) {
      await postLogEvent('error', `Failed to fetch leads table columns: ${columnsErr?.message}`);
      steps.push(`❌ Failed to fetch leads table columns: ${columnsErr?.message}`);
      return NextResponse.json({ ok: false, error: columnsErr?.message || 'Could not fetch leads table columns', details: columnsErr, steps }, { status: 500 });
    }
    steps.push('Fetched valid columns from leads table.');
    // run_sql returns [{ result: [ ... ] }] or similar, so extract
    let validColumns: Set<string> = new Set();
    try {
      const resultArr = (columnsData as any[])[0]?.result;
      if (Array.isArray(resultArr)) {
        validColumns = new Set(resultArr.map((c: any) => c.column_name.toLowerCase()));
      } else {
        await postLogEvent('error', `run_sql did not return expected result array: ${JSON.stringify(columnsData)}`);
        return NextResponse.json({ ok: false, error: 'run_sql did not return expected result array', details: columnsData }, { status: 500 });
      }
    } catch (e: any) {
      await postLogEvent('error', `Error parsing columns from run_sql: ${e.message}`);
      return NextResponse.json({ ok: false, error: 'Error parsing columns from run_sql', details: e }, { status: 500 });
    }

    // Only keep columns present in the uploaded CSV AND in the DB, lowercase keys to match DB schema
    const cleanedRows = rows.map((row) => {
      const normalized: Record<string, any> = {};
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (!validColumns.has(lowerKey)) return; // Skip columns not in the DB
        if (lowerKey === 'addresshash') return; // Skip the problematic column
        let value = row[key];
        // Optionally clean numeric fields if present in CSV
        if (["avm", "assessed_total", "assessed_year", "baths", "beds", "mls_curr_days_on_market"].includes(lowerKey)) {
          if (typeof value === "string") {
            value = parseFloat(value.replace(/[$,]/g, ""));
            if (isNaN(value)) value = null;
          }
        }
        normalized[lowerKey] = value === '' ? null : value;
      });
      return normalized;
    });

    // Log any CSV columns that are not in the DB
    const csvColumns = Object.keys(rows[0] || {}).map(k => k.toLowerCase());
    const missingInDb = csvColumns.filter(col => !validColumns.has(col));
    if (missingInDb.length > 0) {
      await postLogEvent('info', `CSV columns not in DB and skipped: ${missingInDb.join(', ')}`);
      steps.push(`Skipped CSV columns not in DB: ${missingInDb.join(', ')}`);
    }

    // Extra debug logging for first row
    if (cleanedRows.length > 0) {
      console.log('[upload] first cleaned row:', cleanedRows[0]);
    }
    steps.push(`Inserting ${cleanedRows.length} leads into database...`);
    await postLogEvent('info', `Inserting ${cleanedRows.length} leads into database...`);
    await postLogEvent('info', `Sample row: ${JSON.stringify(cleanedRows[0])}`);
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
    const normalizationSQL = `
      INSERT INTO normalized_leads (
        original_lead_id, contact_name, contact_email,
        property_address, property_city, property_state, property_postal_code,
        property_type, baths, beds, year_built, square_footage,
        wholesale_value, assessed_total, mls_curr_status, mls_curr_days_on_market
      )
      SELECT id, Contact1Name, Contact1Email_1, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
      FROM leads
      WHERE Contact1Name IS NOT NULL AND TRIM(Contact1Name) <> '' AND Contact1Email_1 IS NOT NULL AND TRIM(Contact1Email_1) <> ''
      UNION ALL
      SELECT id, Contact2Name, Contact2Email_1, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
      FROM leads
      WHERE Contact2Name IS NOT NULL AND TRIM(Contact2Name) <> '' AND Contact2Email_1 IS NOT NULL AND TRIM(Contact2Email_1) <> ''
      UNION ALL
      SELECT id, Contact3Name, Contact3Email_1, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
      FROM leads
      WHERE Contact3Name IS NOT NULL AND TRIM(Contact3Name) <> '' AND Contact3Email_1 IS NOT NULL AND TRIM(Contact3Email_1) <> ''
      UNION ALL
      SELECT id, MLS_Curr_ListAgentName, MLS_Curr_ListAgentEmail, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
      FROM leads
      WHERE MLS_Curr_ListAgentName IS NOT NULL AND TRIM(MLS_Curr_ListAgentName) <> '' AND MLS_Curr_ListAgentEmail IS NOT NULL AND TRIM(MLS_Curr_ListAgentEmail) <> '';
    `;
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
    const storageBaseMatch = storageFileName.match(/^(.*)_([0-9a-fA-F-]+)\.[^/.]+$/);
    let normBaseName = baseName;
    let normHash = uniqueHash.slice(0, 8);
    if (storageBaseMatch) {
      normBaseName = storageBaseMatch[1];
      normHash = storageBaseMatch[2].slice(0, 8);
    }
    const normTableName = `normalized_${normBaseName}_${normHash}`.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const renameSQL = `ALTER TABLE IF EXISTS normalized_leads RENAME TO ${normTableName};\nTRUNCATE TABLE leads;`;
    const { error: sqlErr } = await sb.rpc('run_sql', { sql: renameSQL });
    if (sqlErr) {
      await postLogEvent('error', `Failed to rename/truncate table: ${sqlErr.message}`);
      steps.push(`❌ Failed to rename/truncate table: ${sqlErr.message}`);
      return NextResponse.json({ ok: false, error: sqlErr.message, details: sqlErr, steps }, { status: 500 });
    }
    steps.push(`Upload and normalization complete. File stored as ${storageFileName}. Table: ${normTableName}`);
    await postLogEvent('success', `Upload and normalization complete. File stored as ${storageFileName}. Table: ${normTableName}`);
    return NextResponse.json({ ok: true, rows: count, normalized: true, normalized_table: normTableName, steps });
  } catch (e: any) {
    await postLogEvent('error', `Fatal error during upload: ${e.message ?? 'Unexpected'}`);
    steps.push(`❌ Fatal error during upload: ${e.message ?? 'Unexpected'}`);
    return NextResponse.json({ ok: false, error: e.message ?? 'Unexpected', steps }, { status: 500 });
  }
}