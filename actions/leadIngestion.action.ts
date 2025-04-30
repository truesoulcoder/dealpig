'use server';

import { createAdminClient } from '@/lib/supabase';
import Papa from 'papaparse';
import crypto from 'crypto';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

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

// Helper function to infer column type from sample values
function inferColumnType(values: (string | null)[]): string {
  // Filter out null/empty values
  const nonEmptyValues = values.filter((v): v is string => v != null && v !== '');
  if (nonEmptyValues.length === 0) return 'TEXT';

  // Check if column name suggests it's a phone number
  const columnNameLower = values[0]?.toLowerCase() || '';
  if (columnNameLower.includes('phone') || columnNameLower.includes('mobile') || columnNameLower.includes('fax')) {
    return 'TEXT';
  }

  // Check if values match phone number pattern
  const phonePattern = /^\+?\d{10,}$/;
  if (nonEmptyValues.some(v => phonePattern.test(v.replace(/\D/g, '')))) {
    return 'TEXT';
  }

  // Check if all values are boolean-like
  if (nonEmptyValues.every(v => ['true', 'false', '0', '1'].includes(v.toLowerCase()))) {
    return 'BOOLEAN';
  }

  // Check if all values are valid dates
  if (nonEmptyValues.every(v => !isNaN(Date.parse(v)))) {
    return 'TIMESTAMPTZ';
  }

  // Check if all values are numeric
  if (nonEmptyValues.every(v => !isNaN(parseFloat(v.replace(/[$,%]/g, ''))))) {
    const maxValue = Math.max(...nonEmptyValues.map(v => parseFloat(v.replace(/[$,%]/g, ''))));
    // Use NUMERIC for large numbers or decimals
    if (maxValue > 2147483647 || nonEmptyValues.some(v => v.includes('.'))) {
      return 'NUMERIC';
    }
    return 'INTEGER';
  }

  // Default to TEXT for everything else
  return 'TEXT';
}

export async function ingestLeadSource(name: string,
  file_name: string,
  file_hash: string,
  column_types: Record<string, string>
): Promise<any> {
   try {
    const admin: any = createAdminClient();
    const table_name = `lead_source_${uuidv4().replace(/-/g, '_')}`;
    
    const insertData = {
       name,
       file_name,
       metadata: {
         table_name,
         file_hash,
         column_types,
       },
      last_imported: new Date().toISOString(),
     };

     const { data, error: insertError } = await admin
       .from('lead_sources')
       .insert([insertData])
       .select()
       .single();

    if (insertError) {
      throw insertError;
    }

    if (!data) {
      throw new Error('Failed to insert lead source');
    }

    return data;
  } catch (error) {
    console.error('Error ingesting lead source:', error);
    throw error;
  }
}

export async function updateLeadSourceRecordCount(
  leadSourceId: string,
  recordCount: number
): Promise<void> {
  try {
    const admin: any = createAdminClient();
    
    const { data: current, error: fetchError } = await admin
      .from('lead_sources')
      .select('metadata')
      .match({ id: leadSourceId })
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!current || !('metadata' in current)) {
      throw new Error('Lead source not found');
    }

    const updateData = {
      metadata: {
        ...current.metadata,
        record_count: recordCount
      }
    };

    const { error: updateError } = await admin
      .from('lead_sources')
      .update(updateData)
      .match({ id: leadSourceId });

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error updating lead source record count:', error);
    throw error;
  }
}

// Normalizes raw rows: splits multi-contact fields into individual leads in 'leads' table
export async function normalizeLeadsForSource(sourceId: string) {
  const admin: any = createAdminClient();
  const BATCH_SIZE = 100; // Process 100 leads at a time
  
  const { data: sourceData, error: srcErr } = await admin
    .from('lead_sources')
    .select('file_name, metadata')
    .match({ id: sourceId })
    .single();
    
  if (srcErr || !sourceData) {
    throw new Error(srcErr?.message || 'Source not found');
  }

  const rawTable = sourceData.metadata?.table_name;
  if (!rawTable) {
    throw new Error('No table name found in source metadata');
  }

  let inserted = 0;
  let currentBatch: any[] = [];
  
  try {
    const { data: rawRows, error: fetchError } = await admin
      .from(rawTable)
      .select('*');
      
    if (fetchError || !rawRows) {
      throw new Error(fetchError?.message || 'Failed to fetch raw rows');
    }

    console.log(`[NormalizeLeads] Processing ${rawRows.length} properties...`);

    // Process each property row
    for (const row of rawRows) {
      // Base property data that will be included with each contact
      const propertyData = {
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
        source_id: sourceId
      };

      // Process regular contacts (1-5)
      for (let i = 1; i <= 5; i++) {
        const contactName = row[`Contact${i}Name`];
        const contactEmail = row[`Contact${i}Email_1`];
        
        if (contactName && contactEmail) {
          // Create lead record for this contact
          currentBatch.push({ 
            ...propertyData,
            owner_name: contactName,
            owner_email: contactEmail,
            contact_type: 'OWNER'
          });

          // Insert batch if it reaches the size limit
          if (currentBatch.length >= BATCH_SIZE) {
            const { error: insertError } = await admin
              .from('leads')
              .insert(currentBatch);
              
            if (insertError) {
              console.error('[NormalizeLeads] Batch insert error:', insertError);
              // Log the problematic batch for debugging
              console.error('[NormalizeLeads] Failed batch:', {
                size: currentBatch.length,
                first: currentBatch[0],
                last: currentBatch[currentBatch.length - 1]
              });
            } else {
              inserted += currentBatch.length;
              console.log(`[NormalizeLeads] Inserted batch of ${currentBatch.length} leads. Total: ${inserted}`);
            }
            
            currentBatch = []; // Clear the batch
          }
        }
      }

      // Process MLS agent if present
      const agentName = row.MLS_Curr_ListAgentName;
      const agentEmail = row.MLS_Curr_ListAgentEmail;
      
      if (agentName && agentEmail) {
        // Create lead record for the agent
        currentBatch.push({ 
          ...propertyData,
          owner_name: agentName,
          owner_email: agentEmail,
          contact_type: 'AGENT'
        });

        // Insert batch if it reaches the size limit
        if (currentBatch.length >= BATCH_SIZE) {
          const { error: insertError } = await admin
            .from('leads')
            .insert(currentBatch);
            
          if (insertError) {
            console.error('[NormalizeLeads] Batch insert error:', insertError);
            console.error('[NormalizeLeads] Failed batch:', {
              size: currentBatch.length,
              first: currentBatch[0],
              last: currentBatch[currentBatch.length - 1]
            });
          } else {
            inserted += currentBatch.length;
            console.log(`[NormalizeLeads] Inserted batch of ${currentBatch.length} leads. Total: ${inserted}`);
          }
          
          currentBatch = []; // Clear the batch
        }
      }
    }

    // Insert any remaining leads in the final batch
    if (currentBatch.length > 0) {
      const { error: insertError } = await admin
        .from('leads')
        .insert(currentBatch);
        
      if (insertError) {
        console.error('[NormalizeLeads] Final batch insert error:', insertError);
        console.error('[NormalizeLeads] Failed batch:', {
          size: currentBatch.length,
          first: currentBatch[0],
          last: currentBatch[currentBatch.length - 1]
        });
      } else {
        inserted += currentBatch.length;
        console.log(`[NormalizeLeads] Inserted final batch of ${currentBatch.length} leads. Total: ${inserted}`);
      }
    }
    
    console.log(`[NormalizeLeads] Completed processing. Total leads inserted: ${inserted}`);
    return { success: true, inserted };
  } catch (err) {
    console.error('[NormalizeLeads] Error:', err);
    throw err;
  }
}

// Migration function to update existing tables to new naming convention
export async function migrateExistingTables() {
  const admin: any = createAdminClient();
  
  // Get all lead sources
  const { data: sources, error: fetchError } = await admin
    .from('lead_sources')
    .select('id, name, file_name, metadata');
  if (fetchError || !sources) {
    console.error('[Migration] Error fetching sources:', fetchError);
    throw fetchError || new Error('No lead sources found');
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
          .match({ id: source.id });
          
        console.log(`Migrated table ${oldTableName} to ${newTableName}`);
      }
    } catch (err) {
      console.error(`[Migration] Error processing source ${source.id}:`, err);
      // Continue with next source
    }
  }
}

type LeadSourceMetadata = {
  table_name: string;
  file_hash: string;
  column_types: Record<string, string>;
};

type LeadSourceRecord = {
  id: string;
  name: string;
  file_name: string;
  metadata: LeadSourceMetadata;
};