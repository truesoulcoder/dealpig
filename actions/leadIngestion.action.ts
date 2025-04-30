'use server';

import { createAdminClient } from '@/lib/supabase';
import Papa from 'papaparse';
import crypto from 'crypto';

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
  console.log('[LeadIngestion] Starting ingestion for existing source ID:', sourceId);

  // 1. Fetch existing source info using the provided UUID
  console.log('[LeadIngestion] Fetching source record for ID:', sourceId);
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('name, file_name, storage_path') // Select necessary fields
    .eq('id', sourceId)
    .single();

  if (srcErr || !sourceData) {
    console.error('[LeadIngestion] Source fetch error:', srcErr);
    // If the record doesn't exist here, something went wrong in the API route
    throw new Error(srcErr?.message || `Source record not found for ID: ${sourceId}`);
  }

  const storageObjectName = sourceId; // The object name in storage is the UUID
  const originalFileName = sourceData.file_name;
  console.log('[LeadIngestion] Found source record. Original file name:', originalFileName);
  console.log('[LeadIngestion] Storage object name (UUID):', storageObjectName);

  // 2. Download CSV from storage using the UUID as the object name
  console.log('[LeadIngestion] Downloading file from storage path:', `lead-imports/${storageObjectName}`);
  const { data: fileBlob, error: blobErr } = await admin.storage
    .from('lead-imports')
    .download(storageObjectName); // Download using the UUID

  if (blobErr || !fileBlob) {
    console.error('[LeadIngestion] File download error:', blobErr);
    throw new Error(blobErr?.message || `Failed to download file: ${storageObjectName}`);
  }

  const text = await fileBlob.text();
  console.log('[LeadIngestion] File downloaded, size:', text.length);

  // 3. Parse CSV into JSON rows
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) {
    console.error('[LeadIngestion] CSV parse errors:', parsed.errors);
    // Optionally update source status to 'error' here
    throw new Error('Failed to parse CSV');
  }

  const rows = parsed.data;
  const rowCount = rows.length;
  console.log('[LeadIngestion] Parsed rows:', rowCount);

  if (rowCount === 0) {
    console.warn('[LeadIngestion] CSV file has no data rows after header.');
    // Update source record count and mark as processed (or error?)
    await admin
      .from('lead_sources')
      .update({ record_count: 0, updated_at: new Date().toISOString() /*, status: 'processed_empty' */ })
      .eq('id', sourceId);
    return { count: 0 }; // Or indicate empty file
  }

  // 4. Get unique table name
  const rawTable = await getUniqueTableName(admin, originalFileName);
  console.log('[LeadIngestion] Using table name:', rawTable);

  try {
    // 5. Create table if not exists
    const cols = Object.keys(rows[0] || {}).map((col) => `"${col}" TEXT`).join(', ');
    const createTableQuery = `CREATE TABLE IF NOT EXISTS public."${rawTable}" (${cols});`; // Specify public schema

    const { error: createTableError } = await admin.rpc('exec_sql', { query: createTableQuery });
    if (createTableError) {
      console.error('[LeadIngestion] Table creation error:', createTableError);
      throw new Error(`Failed to create table: ${createTableError.message}`);
    }
    console.log('[LeadIngestion] Ensured raw table exists:', rawTable);

    // --- Add RLS Enablement and Policy for the raw table ---
    try {
      const enableRlsQuery = `ALTER TABLE public."${rawTable}" ENABLE ROW LEVEL SECURITY;`;
      const { error: rlsEnableError } = await admin.rpc('exec_sql', { query: enableRlsQuery });
      if (rlsEnableError) {
        // Log warning but potentially continue, as service_role might bypass anyway
        console.warn(`[LeadIngestion] Could not enable RLS on ${rawTable}:`, rlsEnableError.message);
      } else {
        console.log(`[LeadIngestion] Enabled RLS on ${rawTable}`);

        // Add a permissive insert policy (allowing service_role implicitly)
        // This policy mainly serves as an explicit marker or for potential future non-service roles
        const createPolicyQuery = `
          CREATE POLICY "Allow service role insert" 
          ON public."${rawTable}" 
          FOR INSERT 
          WITH CHECK (true);
        `;
        const { error: policyError } = await admin.rpc('exec_sql', { query: createPolicyQuery });
        if (policyError && !policyError.message.includes('already exists')) { // Ignore if policy already exists
          // Log warning but potentially continue
          console.warn(`[LeadIngestion] Could not create insert policy on ${rawTable}:`, policyError.message);
        } else if (!policyError) {
          console.log(`[LeadIngestion] Created insert policy on ${rawTable}`);
        }
      }
    } catch (rlsSetupError) {
       console.warn(`[LeadIngestion] Error during RLS setup for ${rawTable}:`, rlsSetupError);
    }
    // --- End RLS Setup ---

    // 6. Insert rows in batches
    const batchSize = 100;
    for (let i = 0; i < rowCount; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const keys = Object.keys(rows[0]);
      // Ensure all rows in the batch have the same keys/structure if needed
      const batchData = batch.map(row => Object.fromEntries(keys.map(k => [k, row[k] || null]))); // Handle potentially missing values

      const { error: insertError } = await admin
        .from(rawTable)
        .insert(batchData);

      if (insertError) {
        console.error('[LeadIngestion] Batch insert error:', insertError);
        // Optionally update source status to 'error'
        throw new Error(`Failed to insert batch: ${insertError.message}`);
      }

      console.log(`[LeadIngestion] Inserted batch ${i / batchSize + 1}/${Math.ceil(rowCount / batchSize)} into ${rawTable}`);
    }

    // 7. Update source record with final count and metadata
    const updatedAt = new Date().toISOString();
    const fileHash = crypto.createHash('sha256').update(text).digest('hex');
    console.log('[LeadIngestion] Updating source record with final count and metadata...');
    const { error: updateError } = await admin
      .from('lead_sources')
      .update({
        record_count: rowCount, // Update with actual count
        metadata: {
          table_name: rawTable,
          file_hash: fileHash
        },
        updated_at: updatedAt,
        last_imported: updatedAt // Also update last_imported time
        // status: 'processed' // Optional: set a status field
      })
      .eq('id', sourceId);

    if (updateError) {
      console.error('[LeadIngestion] Update source record error:', updateError);
      // Don't necessarily throw, but log that the final update failed
      // The data is ingested, but the count/metadata might be stale
    }

    console.log('[LeadIngestion] Successfully processed', rowCount, 'rows for source:', sourceId);
    // Trigger normalization AFTER successful ingestion
    console.log('[LeadIngestion] Triggering normalization for source:', sourceId);
    try {
      await normalizeLeadsForSource(sourceId);
      console.log('[LeadIngestion] Normalization completed for source:', sourceId);
    } catch (normError) {
      console.error('[LeadIngestion] Normalization failed after ingestion for source:', sourceId, normError);
      // Update status to indicate ingestion complete but normalization failed?
    }

    return { count: rowCount };

  } catch (err) {
    console.error('[LeadIngestion] Unexpected error during ingestion process for source:', sourceId, err);
    // Optionally update source status to 'error'
    await admin
      .from('lead_sources')
      .update({ updated_at: new Date().toISOString() /*, status: 'error' */ })
      .eq('id', sourceId);
    throw err; // Re-throw the error to be caught by the API route
  }
}

// Helper function to safely parse numbers
function safeParseFloat(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

function safeParseInt(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}


export async function normalizeLeadsForSource(sourceId: string) {
  const admin = createAdminClient();
  console.log(`[NormalizeLeads] Starting normalization for source: ${sourceId}`);

  // Get the source info including metadata
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('file_name, metadata')
    .eq('id', sourceId)
    .single();

  if (srcErr || !sourceData) {
    console.error(`[NormalizeLeads] Source fetch error for ID ${sourceId}:`, srcErr);
    throw new Error(srcErr?.message || 'Source not found');
  }

  // Get table name from metadata
  const rawTable = sourceData.metadata?.table_name;
  if (!rawTable) {
    console.error(`[NormalizeLeads] No table name found in metadata for source: ${sourceId}`);
    throw new Error('No table name found in source metadata');
  }

  let totalInserted = 0;
  const batchSize = 100; // Adjust batch size as needed
  let allNormalizedLeads: any[] = []; // Array to hold all leads before inserting

  try {
    // Fetch ALL raw rows (remove default limit)
    console.log(`[NormalizeLeads] Fetching ALL raw rows from table: ${rawTable}`);
    // Use range() to fetch more than the default 1000 limit. Adjust upper bound if needed.
    const { data: rawRows, error: fetchError } = await admin
      .from(rawTable)
      .select('*')
      .range(0, 50000); // Fetch up to 50000 rows

    if (fetchError) {
      console.error(`[NormalizeLeads] Failed to fetch raw rows from ${rawTable}:`, fetchError);
      throw new Error(`Failed to fetch raw rows: ${fetchError.message}`);
    }

    if (!rawRows || rawRows.length === 0) {
      console.log(`[NormalizeLeads] No raw rows found in ${rawTable} for source: ${sourceId}`);
      return { success: true, inserted: 0 };
    }
    console.log(`[NormalizeLeads] Fetched ${rawRows.length} raw rows from ${rawTable}`); // Should now show correct count

    // Process each raw row and collect normalized leads
    console.log(`[NormalizeLeads] Processing raw rows and generating normalized leads...`);
    for (const row of rawRows) {
      // Common property data with parsing
      const commonLeadData = {
        property_address: row.PropertyAddress,
        property_city: row.PropertyCity,
        property_state: row.PropertyState,
        property_postal_code: row.PropertyPostalCode,
        property_type: row.PropertyType,
        baths: safeParseFloat(row.Baths), // Parse numeric fields
        beds: safeParseInt(row.Beds),     // Parse numeric fields
        year_built: safeParseInt(row.YearBuilt), // Parse numeric fields
        square_footage: safeParseInt(row.SquareFootage), // Parse numeric fields
        wholesale_value: safeParseFloat(row.WholesaleValue), // Parse numeric fields
        assessed_total: safeParseFloat(row.AssessedTotal), // Parse numeric fields
        mls_curr_status: row.MLS_Curr_Status,
        mls_curr_days_on_market: safeParseInt(row.MLS_Curr_DaysOnMarket), // Parse numeric fields
        source_id: sourceId
        // Add any other relevant fields from the raw row that should be in normalized_leads
      };

      // Extract contact information (up to 5 contacts)
      for (let i = 1; i <= 5; i++) {
        const nameKey = `Contact${i}Name`;
        const emailKey = `Contact${i}Email_1`;
        const contactName = row[nameKey];
        const contactEmail = row[emailKey];

        if (contactName && contactEmail) {
          allNormalizedLeads.push({
            uuid: crypto.randomUUID(), // Generate UUID for each normalized lead
            contact_name: contactName,
            contact_email: contactEmail,
            ...commonLeadData // Spread common data
          });
        }
      }

      // Add MLS agent as a lead
      if (row.MLS_Curr_ListAgentName && row.MLS_Curr_ListAgentEmail) {
        allNormalizedLeads.push({
          uuid: crypto.randomUUID(),
          contact_name: row.MLS_Curr_ListAgentName,
          contact_email: row.MLS_Curr_ListAgentEmail,
          ...commonLeadData // Spread common data
        });
      }
    }
    console.log(`[NormalizeLeads] Generated ${allNormalizedLeads.length} normalized leads.`);

    // Insert normalized leads in batches
    console.log(`[NormalizeLeads] Inserting ${allNormalizedLeads.length} leads into normalized_leads in batches of ${batchSize}...`);
    for (let i = 0; i < allNormalizedLeads.length; i += batchSize) {
      const batch = allNormalizedLeads.slice(i, i + batchSize);
      const { error: insertBatchError, count } = await admin
        .from('normalized_leads')
        .insert(batch, { count: 'exact' }); // Use { count: 'exact' } for better error reporting if needed

      if (insertBatchError) {
        // Log the FULL error object for details
        console.error(`[NormalizeLeads] Batch insert error (Batch ${i / batchSize + 1}):`, JSON.stringify(insertBatchError, null, 2));
        // console.error('[NormalizeLeads] Failing Batch Data:', JSON.stringify(batch, null, 2)); // Uncomment to log failing data (can be large)
        // Use the full error object to construct a more informative message if possible
        const errorMessage = insertBatchError.message || JSON.stringify(insertBatchError);
        throw new Error(`Failed to insert normalized leads batch: ${errorMessage}`);
      }

      totalInserted += count || batch.length; // Add count of inserted rows
      console.log(`[NormalizeLeads] Inserted batch ${i / batchSize + 1}/${Math.ceil(allNormalizedLeads.length / batchSize)}. Total inserted so far: ${totalInserted}`);
    }

    console.log(`[NormalizeLeads] Successfully inserted ${totalInserted} normalized leads for source: ${sourceId}`);
    return { success: true, inserted: totalInserted };

  } catch (err) {
    console.error(`[NormalizeLeads] Error during normalization for source ${sourceId}:`, err);
    // Update source status to 'normalization_failed'?
    await admin
      .from('lead_sources')
      .update({ updated_at: new Date().toISOString() /*, status: 'normalization_failed' */ })
      .eq('id', sourceId);
    throw err; // Re-throw error
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