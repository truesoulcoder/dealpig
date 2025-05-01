'use server';

import { createAdminClient } from '@/lib/supabase';
import Papa from 'papaparse';
import crypto from 'crypto';

// Helper function to check for duplicate file content
export async function isDuplicateFile(admin: any, fileBuffer: Buffer, fileName: string): Promise<boolean> {
  // Calculate hash of new file
  const newHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  // Get all files from the same original name (without UUID prefix)
  const nameWithoutHash = fileName.replace(/^[^_]+_/, '');
  const { data: existingSources, error } = await admin
    .from('lead_sources')
    .select('name, metadata')
    .ilike('file_name', nameWithoutHash);
    
  if (error) {
    console.error('[isDuplicateFile] Error checking existing sources:', error);
    throw error;
  }
  
  // Check each existing file's hash
  for (const source of existingSources) {
    const { data: existingFile, error: downloadError } = await admin.storage
      .from('lead-imports')
      .download(source.name);
      
    if (downloadError) {
      console.error('[isDuplicateFile] Error downloading existing file:', downloadError);
      continue;
    }
    
    const existingBuffer = await existingFile.arrayBuffer();
    const existingHash = crypto.createHash('sha256')
      .update(Buffer.from(existingBuffer))
      .digest('hex');
      
    if (existingHash === newHash) {
      return true;
    }
  }
  
  return false;
}

// Parses CSV from storage for a given lead_source ID and ingests into a raw table
export async function ingestLeadSource(sourceId: string) {
  const admin = createAdminClient();
  console.log('[LeadIngestion] Starting ingestion for source:', sourceId);

  // Fetch source info, including metadata
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('name, file_name, metadata') // Added metadata here
    .eq('id', sourceId)
    .single();
    
  if (srcErr || !sourceData) {
    console.error('[LeadIngestion] Source fetch error:', srcErr);
    throw new Error(srcErr?.message || 'Source not found');
  }
  
  const fileName = sourceData.name;
  const originalFileName = sourceData.file_name;
  console.log('[LeadIngestion] Processing file:', fileName, 'Original:', originalFileName);

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
  if (!rows || rows.length === 0) {
    console.log('[LeadIngestion] No data rows found in CSV.');
    return { count: 0 };
  }
  console.log('[LeadIngestion] Parsed rows:', rows.length);

  // Derive base table name from the original file name (before UUID prefix)
  const baseTableName = originalFileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  console.log('[LeadIngestion] Derived base table name:', baseTableName);

  try {
    // Call the Supabase function to create the table and get its actual name
    const { data: dynamicTableData, error: createTableError } = await admin.rpc('create_dynamic_lead_table', {
      p_table_name: baseTableName
    });

    if (createTableError || !dynamicTableData || !dynamicTableData.table_name) {
      console.error('[LeadIngestion] Error calling create_dynamic_lead_table:', createTableError);
      throw new Error(`Failed to create or confirm dynamic table: ${createTableError?.message || 'No table name returned'}`);
    }

    const actualTableName = dynamicTableData.table_name;
    console.log('[LeadIngestion] Using actual table name from DB function:', actualTableName);

    // Insert rows in batches using the actual table name
    const batchSize = 100;
    const keys = Object.keys(rows[0]); // Get keys from the first row

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const batchData = batch.map(row => {
        const record: { [key: string]: any } = {};
        keys.forEach(key => {
          record[key] = row[key] !== undefined ? row[key] : null;
        });
        return record;
      });

      const { error: insertError } = await admin
        .from(actualTableName)
        .insert(batchData);

      if (insertError) {
        console.error('[LeadIngestion] Batch insert error:', insertError);
        console.error('Failed batch details:', { table: actualTableName, batchSize: batchData.length, firstRowKeys: Object.keys(batchData[0] || {}) });
        throw new Error(`Failed to insert batch into ${actualTableName}: ${insertError.message}`);
      }

      console.log(`[LeadIngestion] Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} into ${actualTableName}`);
    }

    // Update source record count and metadata with the actual table name
    const fileHash = crypto.createHash('sha256').update(text).digest('hex');
    const { error: updateError } = await admin
      .from('lead_sources')
      .update({
        record_count: rows.length,
        metadata: {
          table_name: actualTableName,
          file_hash: fileHash
        },
        status: 'PROCESSED',
        last_processed_at: new Date().toISOString()
      })
      .eq('id', sourceId);

    if (updateError) {
      console.error('[LeadIngestion] Update record count/metadata error:', updateError);
    }

    console.log('[LeadIngestion] Successfully processed', rows.length, 'rows into table', actualTableName);
    return { count: rows.length, tableName: actualTableName };
  } catch (err: any) {
    console.error('[LeadIngestion] Unexpected error during ingestion:', err);
    // Update source status to 'ERROR'
    await admin
      .from('lead_sources')
      .update({
        status: 'ERROR',
        last_processed_at: new Date().toISOString(),
        metadata: {
          ...(sourceData.metadata || {}), // Now sourceData.metadata exists
          error: err.message || 'Unknown ingestion error'
        }
      })
      .eq('id', sourceId);
    throw err; // Re-throw the error to be caught by the caller
  }
}

// Normalizes raw rows: splits multi-contact fields into individual leads in 'leads' table
export async function normalizeLeadsForSource(sourceId: string) {
  const admin = createAdminClient();

  // Get the source info including metadata
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('file_name, metadata')
    .eq('id', sourceId)
    .single();

  if (srcErr || !sourceData) {
    throw new Error(srcErr?.message || 'Source not found');
  }

  // Get table name from metadata
  const rawTable = sourceData.metadata?.table_name;
  if (!rawTable) {
    throw new Error('No table name found in source metadata');
  }

  let inserted = 0;
  try {
    // Fetch all raw rows using Supabase client
    const { data: rawRows, error: fetchError } = await admin
      .from(rawTable)
      .select('*');

    if (fetchError) {
      throw new Error(`Failed to fetch raw rows: ${fetchError.message}`);
    }

    if (!rawRows || rawRows.length === 0) {
      return { success: true, inserted: 0 };
    }

    // Process each row
    for (const row of rawRows) {
      const leadsToInsert = [];

      // Extract contact information for up to 5 contacts
      for (let i = 1; i <= 5; i++) {
        const nameKey = `Contact${i}Name`;
        const emailKey = `Contact${i}Email_1`;
        const contactName = row[nameKey];
        const contactEmail = row[emailKey];

        if (contactName && contactEmail) {
          leadsToInsert.push({
            owner_name: contactName,
            owner_email: contactEmail,
            property_address: row.PropertyAddress,
            property_city: row.PropertyCity,
            property_state: row.PropertyState,
            property_zip: row.PropertyPostalCode,
            property_type: row.PropertyType,
            baths: row.Baths,
            beds: row.Beds,
            year_built: row.YearBuilt,
            square_footage: row.SquareFootage,
            wholesale_value: row.WholesaleValue,
            assessed_total: row.AssessedTotal,
            mls_status: row.MLS_Curr_Status,
            days_on_market: row.MLS_Curr_DaysOnMarket,
            source_id: sourceId,
            status: 'NEW',
            raw_lead_table: rawTable,
            raw_lead_id: row.id
          });
        }
      }

      // Add MLS agent as a lead
      if (row.MLS_Curr_ListAgentName && row.MLS_Curr_ListAgentEmail) {
        leadsToInsert.push({
          owner_name: row.MLS_Curr_ListAgentName,
          owner_email: row.MLS_Curr_ListAgentEmail,
          property_address: row.PropertyAddress,
          property_city: row.PropertyCity,
          property_state: row.PropertyState,
          property_zip: row.PropertyPostalCode,
          property_type: row.PropertyType,
          baths: row.Baths,
          beds: row.Beds,
          year_built: row.YearBuilt,
          square_footage: row.SquareFootage,
          wholesale_value: row.WholesaleValue,
          assessed_total: row.AssessedTotal,
          mls_status: row.MLS_Curr_Status,
          days_on_market: row.MLS_Curr_DaysOnMarket,
          source_id: sourceId,
          status: 'NEW',
          owner_type: 'AGENT',
          raw_lead_table: rawTable,
          raw_lead_id: row.id
        });
      }

      // Insert leads into the 'leads' table
      for (const lead of leadsToInsert) {
        lead.beds = lead.beds ? parseInt(String(lead.beds), 10) : null;
        lead.baths = lead.baths ? parseFloat(String(lead.baths)) : null;
        lead.square_footage = lead.square_footage ? parseInt(String(lead.square_footage), 10) : null;
        lead.year_built = lead.year_built ? parseInt(String(lead.year_built), 10) : null;
        lead.wholesale_value = lead.wholesale_value ? parseFloat(String(lead.wholesale_value)) : null;
        lead.assessed_total = lead.assessed_total ? parseFloat(String(lead.assessed_total)) : null;
        lead.days_on_market = lead.days_on_market ? parseInt(String(lead.days_on_market), 10) : null;

        const { error: insertError } = await admin
          .from('leads')
          .insert(lead);

        if (insertError) {
          console.error('Insert lead error:', insertError);
          continue;
        }

        inserted++;
      }
    }

    return { success: true, inserted };
  } catch (err) {
    console.error('[NormalizeLeads] Error:', err);
    throw err;
  }
}