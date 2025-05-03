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
          // Log the raw CSV headers for debugging
          console.log('[upload] CSV headers:', results.meta.fields);
          
          results.data.forEach((row) => {
            // Set default values for required fields
            row.avm = row.avm || null;
            
            // Map property fields explicitly to ensure they're captured
            // This handles common variations in CSV column naming
            if (row.address && !row.property_address) row.property_address = row.address;
            if (row.city && !row.property_city) row.property_city = row.city;
            if (row.state && !row.property_state) row.property_state = row.state;
            if (row.zip && !row.property_postal_code) row.property_postal_code = row.zip;
            if (row.postal_code && !row.property_postal_code) row.property_postal_code = row.postal_code;
            if (row.zipcode && !row.property_postal_code) row.property_postal_code = row.zipcode;
            if (row.type && !row.property_type) row.property_type = row.type;
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
          
          // Log all available database columns for debugging
          console.log('[upload] Available DB columns:', dbColumns);
          
          // Create mapping for exact matches
          dbColumns.forEach(dbCol => {
            // Normalize DB column name for matching (lowercase, remove quotes if present for key)
            const mapKey = dbCol.toLowerCase().replace(/"/g, '');
            csvHeaderToDbColumnMap.set(mapKey, dbCol);
          });
          
          // Define exact mapping from CSV headers to database columns
          const exactMappings: Record<string, string> = {
            // Basic info
            'firstname': 'first_name',
            'lastname': 'last_name',
            'recipientaddress': 'recipient_address',
            'recipientcity': 'recipient_city',
            'recipientstate': 'recipient_state',
            'recipientpostalcode': 'recipient_postal_code',
            
            // Property info
            'propertyaddress': 'property_address',
            'propertycity': 'property_city',
            'propertystate': 'property_state',
            'propertypostalcode': 'property_postal_code',
            'county': 'county',
            'ownertype': 'owner_type',
            'lastsalesdate': 'last_sales_date',
            'lastsalesprice': 'last_sales_price',
            'pricepersqft': 'price_per_sqft',
            'squarefootage': 'square_footage',
            'lotsizesqft': 'lot_size_sqft',
            'propertytype': 'property_type',
            'baths': 'baths',
            'beds': 'beds',
            
            // Contact info
            'contact1name': 'contact1_name',
            'contact1phone_1': 'contact1_phone_1',
            'contact1phone_1_type': 'contact1_phone_1_type',
            'contact1phone_1_dnc': 'contact1_phone_1_dnc',
            'contact1phone_1_litigator': 'contact1_phone_1_litigator',
            'contact1email_1': 'contact1_email_1',
            'contact1phone_2': 'contact1_phone_2',
            'contact1phone_2_type': 'contact1_phone_2_type',
            'contact1phone_2_dnc': 'contact1_phone_2_dnc',
            'contact1phone_2_litigator': 'contact1_phone_2_litigator',
            'contact1email_2': 'contact1_email_2',
            'contact1phone_3': 'contact1_phone_3',
            'contact1phone_3_type': 'contact1_phone_3_type',
            'contact1phone_3_dnc': 'contact1_phone_3_dnc',
            'contact1phone_3_litigator': 'contact1_phone_3_litigator',
            'contact1email_3': 'contact1_email_3',
            
            'contact2name': 'contact2_name',
            'contact2phone_1': 'contact2_phone_1',
            'contact2phone_1_type': 'contact2_phone_1_type',
            'contact2phone_1_dnc': 'contact2_phone_1_dnc',
            'contact2phone_1_litigator': 'contact2_phone_1_litigator',
            'contact2email_1': 'contact2_email_1',
            'contact2phone_2': 'contact2_phone_2',
            'contact2phone_2_type': 'contact2_phone_2_type',
            'contact2phone_2_dnc': 'contact2_phone_2_dnc',
            'contact2phone_2_litigator': 'contact2_phone_2_litigator',
            'contact2email_2': 'contact2_email_2',
            'contact2phone_3': 'contact2_phone_3',
            'contact2phone_3_type': 'contact2_phone_3_type',
            'contact2phone_3_dnc': 'contact2_phone_3_dnc',
            'contact2phone_3_litigator': 'contact2_phone_3_litigator',
            'contact2email_3': 'contact2_email_3',
            
            'contact3name': 'contact3_name',
            'contact3phone_1': 'contact3_phone_1',
            'contact3phone_1_type': 'contact3_phone_1_type',
            'contact3phone_1_dnc': 'contact3_phone_1_dnc',
            'contact3phone_1_litigator': 'contact3_phone_1_litigator',
            'contact3email_1': 'contact3_email_1',
            'contact3phone_2': 'contact3_phone_2',
            'contact3phone_2_type': 'contact3_phone_2_type',
            'contact3phone_2_dnc': 'contact3_phone_2_dnc',
            'contact3phone_2_litigator': 'contact3_phone_2_litigator',
            'contact3email_2': 'contact3_email_2',
            'contact3phone_3': 'contact3_phone_3',
            'contact3phone_3_type': 'contact3_phone_3_type',
            'contact3phone_3_dnc': 'contact3_phone_3_dnc',
            'contact3phone_3_litigator': 'contact3_phone_3_litigator',
            'contact3email_3': 'contact3_email_3',
            
            // Property details
            'housestyle': 'house_style',
            'yearbuilt': 'year_built',
            'assessedyear': 'assessed_year',
            'schooldistrict': 'school_district',
            'stories': 'stories',
            'heatingfuel': 'heating_fuel',
            'subdivision': 'subdivision',
            'zoning': 'zoning',
            'units': 'units',
            'condition': 'condition',
            'exterior': 'exterior',
            'interiorwalls': 'interior_walls',
            'basement': 'basement',
            'roof': 'roof',
            'roofshape': 'roof_shape',
            'water': 'water',
            'sewer': 'sewer',
            'locationinfluence': 'location_influence',
            'heating': 'heating',
            'airconditioning': 'airconditioning',
            'fireplace': 'fireplace',
            'garage': 'garage',
            'patio': 'patio',
            'pool': 'pool',
            'porch': 'porch',
            
            // Financial info
            'taxamount': 'tax_amount',
            'avm': 'avm',
            'rentalestimatehigh': 'rental_estimate_high',
            'rentalestimatelow': 'rental_estimate_low',
            'wholesalevalue': 'wholesale_value',
            'marketvalue': 'market_value',
            'assessedtotal': 'assessed_total',
            'numberofloans': 'number_of_loans',
            'totalloans': 'total_loans',
            'ltv': 'ltv',
            'loanamount': 'loan_amount',
            'recordingdate': 'recording_date',
            'maturitydate': 'maturity_date',
            'lendername': 'lender_name',
            'estimatedmortgagebalance': 'estimated_mortgage_balance',
            'estimatedmortgagepayment': 'estimated_mortgage_payment',
            'mortgageinterestrate': 'mortgage_interest_rate',
            'loantype': 'loan_type',
            'event': 'event',
            'buyer': 'buyer',
            'seller': 'seller',
            
            // MLS current info
            'mls_curr_listingid': 'mls_curr_listing_id',
            'mls_curr_status': 'mls_curr_status',
            'mls_curr_listdate': 'mls_curr_list_date',
            'mls_curr_solddate': 'mls_curr_sold_date',
            'mls_curr_daysonmarket': 'mls_curr_days_on_market',
            'mls_curr_listprice': 'mls_curr_list_price',
            'mls_curr_saleprice': 'mls_curr_sale_price',
            'mls_curr_description': 'mls_curr_description',
            'mls_curr_source': 'mls_curr_source',
            'mls_curr_listagentname': 'mls_curr_list_agent_name',
            'mls_curr_listagentphone': 'mls_curr_list_agent_phone',
            'mls_curr_listagentoffice': 'mls_curr_list_agent_office',
            'mls_curr_listagent_email': 'mls_curr_list_agent_email',
            'mls_curr_pricepersqft': 'mls_curr_price_per_sqft',
            'mls_curr_sqft': 'mls_curr_sqft',
            'mls_curr_basement': 'mls_curr_basement',
            'mls_curr_lot': 'mls_curr_lot',
            'mls_curr_beds': 'mls_curr_beds',
            'mls_curr_baths': 'mls_curr_baths',
            'mls_curr_garage': 'mls_curr_garage',
            'mls_curr_stories': 'mls_curr_stories',
            'mls_curr_yearbuilt': 'mls_curr_year_built',
            'mls_curr_photos': 'mls_curr_photos',
            
            // MLS previous info
            'mls_prev_listingid': 'mls_prev_listing_id',
            'mls_prev_status': 'mls_prev_status',
            'mls_prev_listdate': 'mls_prev_list_date',
            'mls_prev_solddate': 'mls_prev_sold_date',
            'mls_prev_daysonmarket': 'mls_prev_days_on_market',
            'mls_prev_listprice': 'mls_prev_list_price',
            'mls_prev_saleprice': 'mls_prev_sale_price',
            'mls_prev_description': 'mls_prev_description',
            'mls_prev_source': 'mls_prev_source',
            'mls_prev_listagentname': 'mls_prev_list_agent_name',
            'mls_prev_listagentphone': 'mls_prev_list_agent_phone',
            'mls_prev_listagentoffice': 'mls_prev_list_agent_office',
            'mls_prev_listagent_email': 'mls_prev_list_agent_email',
            'mls_prev_pricepersqft': 'mls_prev_price_per_sqft',
            'mls_prev_sqft': 'mls_prev_sqft',
            'mls_prev_basement': 'mls_prev_basement',
            'mls_prev_lot': 'mls_prev_lot',
            'mls_prev_beds': 'mls_prev_beds',
            'mls_prev_baths': 'mls_prev_baths',
            'mls_prev_garage': 'mls_prev_garage',
            'mls_prev_stories': 'mls_prev_stories',
            'mls_prev_yearbuilt': 'mls_prev_year_built',
            'mls_prev_photos': 'mls_prev_photos',
            
            // Property flags
            'absenteeowner': 'absentee_owner',
            'activeinvestorowned': 'active_investor_owned',
            'activelisting': 'active_listing',
            'boredinvestor': 'bored_investor',
            'cashbuyer': 'cash_buyer',
            'delinquenttaxactivity': 'delinquent_tax_activity',
            'flipped': 'flipped',
            'foreclosures': 'foreclosures',
            'freeandclear': 'free_and_clear',
            'highequity': 'high_equity',
            'longtermowner': 'long_term_owner',
            'lowequity': 'low_equity',
            'potentiallyinherited': 'potentially_inherited',
            'preforeclosure': 'pre_foreclosure',
            'upsidedown': 'upside_down',
            'vacancy': 'vacancy',
            'zombieproperty': 'zombie_property',
            
            // Scores and IDs
            'retailscore': 'retail_score',
            'rentalscore': 'rental_score',
            'wholesalescore': 'wholesale_score',
            'auctiondate': 'auction_date',
            'lastnoticedate': 'last_notice_date',
            'sourceid': 'source_id',
            'addresshash': 'address_hash',
            'id': 'id'
          };
          
          // Add all exact mappings
          Object.entries(exactMappings).forEach(([csvHeader, dbColumn]) => {
            csvHeaderToDbColumnMap.set(csvHeader.toLowerCase(), dbColumn);
          });
          
          console.log('[upload] CSV header to DB column mapping created with', csvHeaderToDbColumnMap.size, 'mappings');
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

      // Identify TEXT columns from the actual DB schema for cleaning
      const TEXTColumns = new Set([
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
        // Add any other TEXT columns from your schema here
      ]);

      // Debug: Log first row of CSV data
      console.log('[upload] First row of CSV data:', rows[0]);
      
      // Use the map to build rows with correct DB column names
      const cleanedRows = rows.map((row) => {
        const dbRow: Record<string, any> = {};
        
        // Process each field in the CSV row
        Object.keys(row).forEach(csvHeader => {
  const lowerCsvHeader = csvHeader.toLowerCase();
  if (lowerCsvHeader === 'id') return; // Skip CSV 'Id', let DB generate UUID

  // Only map columns that exist in the DB
  const dbColumnName = csvHeaderToDbColumnMap.get(lowerCsvHeader);
  if (!dbColumnName) return; // Skip any CSV column that doesn't map to a DB column

  let value = row[csvHeader];

  // Skip empty values
  if (value === undefined || value === null || value === '') {
    // Don't set a value for this column; DB will use NULL/default
    return;
  }

  

  // Handle date fields
  if (dbColumnName.toLowerCase().includes('date') && value) {
    try {
      // Try to parse the date and format it as ISO string
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        value = date.toISOString();
      }
    } catch (e) {
      // If date parsing fails, keep the original value
      console.log(`[upload] Failed to parse date: ${value}`);
    }
  }

  // Assign the value to the database row
  dbRow[dbColumnName] = value;
});
        
        // Handle special mappings for address fields that might be in different formats
        if (!dbRow.property_address && row.address) {
          dbRow.property_address = row.address;
        }
        if (!dbRow.property_city && row.city) {
          dbRow.property_city = row.city;
        }
        if (!dbRow.property_state && row.state) {
          dbRow.property_state = row.state;
        }
        if (!dbRow.property_postal_code && (row.zip || row.postal_code || row.zipcode)) {
          dbRow.property_postal_code = row.zip || row.postal_code || row.zipcode;
        }
        
        return dbRow;
      });
      
      // Debug: Log the first processed row
      console.log('[upload] First processed row:', cleanedRows[0]);

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
        // Insert the data without user_id (single-user/no-user-ownership mode)
const insertResult = await sb
  .from('leads')
  .insert(cleanedRows as any[], { count: 'exact' });
insertErr = insertResult.error;
count = insertResult.count;
// Skipping processing_status entry, as user_id is not tracked

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

      /* ───── 3. Skip normalized_leads table creation for now ───── */
      // Instead of creating a new table which might cause permission issues,
      // let's just log the success and continue
      steps.push('Skipping normalized_leads table creation to avoid permission issues.');
      await postLogEvent('info', 'Skipping normalized_leads table creation to avoid permission issues.');
      
      // Log success for the initial insert
      await postLogEvent('success', `Successfully inserted ${count} leads from ${file?.name || 'uploaded file'}`);
      steps.push(`✅ Successfully inserted ${count} leads`);
      
      // Trigger the normalization process
      steps.push('Starting lead normalization process...');
      await postLogEvent('info', 'Starting lead normalization process...');
      
      try {
        // Call the normalization API endpoint (single-user mode, no userId needed)
const normResponse = await fetch(new URL('/api/leads/normalize', req.url).toString(), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sourceFilename: file?.name || 'unknown-file'
  })
});
        
        if (!normResponse.ok) {
          const normError = await normResponse.json();
          steps.push(`⚠ Normalization process started but returned an error: ${normError.message || 'Unknown error'}`);
          await postLogEvent('error', `Normalization process error: ${normError.message || 'Unknown error'}`);
        } else {
          const normResult = await normResponse.json();
          steps.push(`✅ ${normResult.message}`);
        }
      } catch (normError: any) {
        // If normalization fails, log it but still return success for the upload
        console.error('Error triggering normalization:', normError);
        steps.push(`⚠ Normalization process started but encountered an error: ${normError.message || 'Unknown error'}`);
        await postLogEvent('error', `Error triggering normalization: ${normError.message || 'Unknown error'}`);
      }
      
      // Return success for the overall process
      return NextResponse.json({ 
        ok: true, 
        rows: count, 
        message: `Successfully inserted ${count} leads from ${file?.name || 'uploaded file'}`,
        steps 
      });
      
      /* The following code is commented out to avoid permission issues
      // Define the SQL for creating the normalized_leads table
      const createNormalizedTableSQL = `
        CREATE TABLE IF NOT EXISTS normalized_leads (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          original_lead_id UUID REFERENCES leads(id),
          contact_name TEXT,
          contact_email TEXT,
          property_address TEXT,
          property_city TEXT,
          property_state TEXT,
          property_postal_code TEXT,
          property_type TEXT,
          baths TEXT,
          beds TEXT,
          year_built INTEGER,
          square_footage TEXT,
          wholesale_value TEXT,
          assessed_total TEXT,
          mls_curr_status TEXT,
          mls_curr_days_on_market INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;
      
      const { error: createNormErr } = await sb.rpc('run_sql', { sql: createNormalizedTableSQL });
      if (createNormErr) {
        await postLogEvent('error', `Failed to create normalized_leads table: ${createNormErr.message}`);
        steps.push(`❌ Failed to create normalized_leads table: ${createNormErr.message}`);
        return NextResponse.json({ ok: false, error: createNormErr.message, details: createNormErr, steps }, { status: 500 });
      }
      */

      // Note: All the normalization code has been removed since we're returning early after the insert
      // This simplifies the process and avoids permission issues with table creation
    } catch (error: any) {
      console.error('Unexpected error during upload process:', error);
      await postLogEvent('error', `Error during upload process: ${error.message || 'Unknown error'}`);
      steps.push(`❌ Error during upload process: ${error.message || 'Unknown error'}`);
      return NextResponse.json({ 
        ok: false, 
        error: error.message || 'Unknown error during upload process', 
        steps 
      }, { status: 500 });
    }
  } catch (e: any) {
    console.error('Unexpected error:', e);
    try {
      await postLogEvent('error', `Unexpected error: ${e.message || 'Unknown error'}`);
      steps.push(`❌ Unexpected server error: ${e.message || 'Unknown error'}`);
    } catch (logError) {
      console.error('Failed to log error:', logError);
      steps.push('❌ Failed to log error');
    }
    
    return NextResponse.json({ 
      ok: false, 
      error: 'Server exception', 
      message: e.message || 'Unknown server error',
      steps 
    }, { status: 500 });
  }
}