'use server';

import { createAdminClient } from '@/lib/supabase';
import Papa from 'papaparse';
import crypto from 'crypto';
import { Client } from 'pg';

// Helper function to get clean table name from file name
async function getUniqueTableName(admin: any, fileName: string, attempt: number = 0): Promise<string> {
  // Remove the extension
  const tableName = fileName.replace(/\.[^/.]+$/, '');
  
  try {
    // Check if table exists
    const { error } = await admin.rpc('check_table_exists', { table_name: tableName });
    
    if (error) {
      // Table doesn't exist, we can use this name
      return tableName;
    }
    
    // Table exists, try next number
    return getUniqueTableName(admin, fileName, attempt + 1);
  } catch (err) {
    console.error('[getUniqueTableName] Error checking table:', err);
    throw err;
  }
}

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
  
  // Fetch source info
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('name, file_name')
    .eq('id', sourceId)
    .single();
    
  if (srcErr || !sourceData) {
    console.error('[LeadIngestion] Source fetch error:', srcErr);
    throw new Error(srcErr?.message || 'Source not found');
  }
  
  const fileName = sourceData.name;
  const originalFileName = sourceData.file_name;
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

  // Get unique table name
  const rawTable = await getUniqueTableName(admin, originalFileName);
  console.log('[LeadIngestion] Using table name:', rawTable);

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

    // Update source record count and metadata
    const { error: updateError } = await admin
      .from('lead_sources')
      .update({ 
        record_count: rows.length,
        metadata: {
          table_name: rawTable,
          file_hash: crypto.createHash('sha256').update(text).digest('hex')
        }
      })
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
      const leads = [];

      // Extract contact information for up to 5 contacts
      for (let i = 1; i <= 5; i++) {
        const nameKey = `Contact${i}Name`;
        const emailKey = `Contact${i}Email_1`;
        const contactName = row[nameKey];
        const contactEmail = row[emailKey];

        if (contactName && contactEmail) {
          leads.push({
            uuid: crypto.randomUUID(),
            contact_name: contactName,
            contact_email: contactEmail,
            property_address: row.PropertyAddress,
            property_city: row.PropertyCity,
            property_state: row.PropertyState,
            property_postal_code: row.PropertyPostalCode,
            property_type: row.PropertyType,
            baths: row.Baths,
            beds: row.Beds,
            year_built: row.YearBuilt,
            square_footage: row.SquareFootage,
            wholesale_value: row.WholesaleValue,
            assessed_total: row.AssessedTotal,
            mls_curr_status: row.MLS_Curr_Status,
            mls_curr_days_on_market: row.MLS_Curr_DaysOnMarket,
            source_id: sourceId
          });
        }
      }

      // Add MLS agent as a lead
      if (row.MLS_Curr_ListAgentName && row.MLS_Curr_ListAgentEmail) {
        leads.push({
          uuid: crypto.randomUUID(),
          contact_name: row.MLS_Curr_ListAgentName,
          contact_email: row.MLS_Curr_ListAgentEmail,
          property_address: row.PropertyAddress,
          property_city: row.PropertyCity,
          property_state: row.PropertyState,
          property_postal_code: row.PropertyPostalCode,
          property_type: row.PropertyType,
          baths: row.Baths,
          beds: row.Beds,
          year_built: row.YearBuilt,
          square_footage: row.SquareFootage,
          wholesale_value: row.WholesaleValue,
          assessed_total: row.AssessedTotal,
          mls_curr_status: row.MLS_Curr_Status,
          mls_curr_days_on_market: row.MLS_Curr_DaysOnMarket,
          source_id: sourceId
        });
      }

      // Insert leads into the normalized_leads table
      for (const lead of leads) {
        const { error: insertError } = await admin
          .from('normalized_leads')
          .insert(lead);

        if (insertError) {
          console.error('Insert lead error:', insertError);
          continue; // Skip this lead but continue with others
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

// Migration function to update existing tables to new naming convention
export async function migrateExistingTables() {
  const admin = createAdminClient();
  
  // Get all lead sources
  const { data: sources, error } = await admin
    .from('lead_sources')
    .select('id, name, file_name, metadata');
    
  if (error) {
    console.error('[Migration] Error fetching sources:', error);
    throw error;
  }

  for (const source of sources) {
    try {
      // Get new table name
      const newTableName = await getUniqueTableName(admin, source.file_name);
      
      // If there's an existing raw table (old naming convention)
      const oldTableName = `raw_${source.id.replace(/-/g, '_')}`;
      
      // Check if old table exists
      const { error: checkError } = await admin.rpc('check_table_exists', { 
        table_name: oldTableName 
      });
      
      if (!checkError) {
        // Old table exists, rename it
        const renameQuery = `ALTER TABLE IF EXISTS "${oldTableName}" RENAME TO "${newTableName}";`;
        await admin.rpc('exec_sql', { query: renameQuery });
        
        // Update metadata
        await admin
          .from('lead_sources')
          .update({
            metadata: {
              ...source.metadata,
              table_name: newTableName
            }
          })
          .eq('id', source.id);
          
        console.log(`Migrated table ${oldTableName} to ${newTableName}`);
      }
    } catch (err) {
      console.error(`[Migration] Error processing source ${source.id}:`, err);
      // Continue with next source
    }
  }
}
