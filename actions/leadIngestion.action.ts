import { admin } from '@/lib/supabaseClient';
// Make sure NormalizedLead type is correctly defined, potentially in @/types/supabase or @/helpers/types
import { LeadSource, NormalizedLead } from '@/types/supabase';
import { PostgrestError } from '@supabase/supabase-js';
import * as crypto from 'crypto'; // For UUID generation
import Papa from 'papaparse';

// Adjust batch size as needed based on performance/limits
const BATCH_SIZE = 500;

/**
 * Normalizes leads from a specific dynamic source table and inserts them into a central target table.
 *
 * @param sourceId The UUID of the lead_sources record.
 * @param dynamicTableName The exact name of the source table containing raw leads (e.g., 'dallas_houses_leads').
 * @param columnMap A mapping from normalized field names to raw field names in the dynamic source table.
 * @returns Promise resolving to an object indicating success, message, inserted count, and optional error.
 */
export async function normalizeLeadsForSource(
  sourceId: string,
  dynamicTableName: string,
  columnMap: Record<string, string>
): Promise<{ success: boolean; message: string; insertedCount?: number; error?: any }> {
  console.log(`[NormalizeLeads] Starting normalization for sourceId: ${sourceId} from dynamic table: ${dynamicTableName}`);

  // -------- IMPORTANT: Define your TARGET table for normalized leads here --------
  const TARGET_NORMALIZED_TABLE = 'leads'; // <--- CHANGE THIS if your central table name is different
  // -------------------------------------------------------------------------------
  // Verify the target table exists (optional but recommended)
  // You might want a separate check or rely on insert errors if it doesn't exist.

  try {
    // 1. Fetch raw leads from the dynamic source table that haven't been processed yet
    console.log(`[NormalizeLeads] Fetching unprocessed raw leads from: ${dynamicTableName}`);
    const { data: rawLeads, error: fetchError } = await admin
      .from(dynamicTableName)
      .select('*') // Select all columns for mapping
      .eq('processed', false); // Filter for unprocessed leads

    if (fetchError) {
      console.error(`[NormalizeLeads] Error fetching raw leads from ${dynamicTableName}:`, fetchError);
      return { success: false, message: `Failed to fetch raw leads: ${fetchError.message}`, error: fetchError };
    }

    if (!rawLeads || rawLeads.length === 0) {
      console.log(`[NormalizeLeads] No unprocessed raw leads found in ${dynamicTableName}.`);
      return { success: true, message: 'No new leads to normalize.', insertedCount: 0 };
    }

    console.log(`[NormalizeLeads] Fetched ${rawLeads.length} raw leads from ${dynamicTableName}. Normalizing...`);

    // 2. Normalize leads based on columnMap and perform validation/coercion
    const allNormalizedLeads: Omit<NormalizedLead, 'id' | 'created_at' | 'updated_at'>[] = [];
    const processedRawLeadIds: string[] = []; // Track IDs of raw leads successfully normalized

    // Define required fields for a lead to be considered valid for insertion
    // Adjust this list based on your actual requirements for the TARGET_NORMALIZED_TABLE
    const requiredFields: (keyof NormalizedLead)[] = [
        'contact_name', 'contact_email', 'property_address', 'property_city', 'property_state', 'property_postal_code'
        // Add any other fields that MUST have a non-empty value in the 'leads' table
    ];

    for (const rawLead of rawLeads) {
      // Use Partial because we build it incrementally, then cast later after validation
      const normalizedLead: Partial<NormalizedLead> = {
        uuid: crypto.randomUUID(), // Generate a new UUID for the normalized record
        source_id: sourceId,       // Link back to the original lead source
        raw_lead_table: dynamicTableName, // Store the source table name for provenance
        raw_lead_id: rawLead.id,         // Store the original raw lead ID for provenance
        // Initialize other fields potentially to null or default values if needed
        property_type: null,
        baths: null,
        beds: null,
        year_built: null,
        square_footage: null,
        wholesale_value: null,
        assessed_total: null,
        mls_curr_status: null,
        mls_curr_days_on_market: null,
        // ... other nullable fields
      };

      let skipLead = false; // Flag to skip this lead if critical data is missing/invalid

      for (const [normalizedKey, rawKey] of Object.entries(columnMap)) {
        if (rawKey in rawLead && rawLead[rawKey] !== null && rawLead[rawKey] !== undefined && String(rawLead[rawKey]).trim() !== '') {
          let value: any = rawLead[rawKey];

          // --- Type Coercion & Basic Validation ---
          // Extend this section based on the data types defined in your NormalizedLead type/target table schema
          try {
            switch (normalizedKey as keyof NormalizedLead) {
              case 'beds':
              case 'baths':
              case 'square_footage':
              case 'year_built':
              case 'mls_curr_days_on_market':
                const intValue = parseInt(String(value).replace(/[^0-9]/g, ''), 10); // Remove non-numeric chars before parsing
                if (!isNaN(intValue)) {
                  value = intValue;
                } else {
                  // console.warn(`[NormalizeLeads] Could not convert "${rawLead[rawKey]}" to integer for field "${normalizedKey}" (Raw ID: ${rawLead.id}). Setting to null.`);
                  value = null;
                }
                break;
              case 'wholesale_value':
              case 'assessed_total':
                 // Handle potential currency symbols, commas etc.
                const floatValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                if (!isNaN(floatValue)) {
                  value = floatValue;
                } else {
                  // console.warn(`[NormalizeLeads] Could not convert "${rawLead[rawKey]}" to float for field "${normalizedKey}" (Raw ID: ${rawLead.id}). Setting to null.`);
                  value = null;
                }
                break;
              // Add cases for Date/Timestamp fields if needed, using new Date(value) and checking validity
              // case 'some_date_field':
              //   const dateValue = new Date(value);
              //   if (!isNaN(dateValue.getTime())) {
              //     value = dateValue.toISOString();
              //   } else {
              //     value = null;
              //   }
              //   break;
              case 'contact_email':
                value = String(value).trim().toLowerCase();
                // Basic email format check (consider a more robust library if needed)
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    console.warn(`[NormalizeLeads] Invalid email format "${rawLead[rawKey]}" for field "${normalizedKey}" (Raw ID: ${rawLead.id}). Setting to null.`);
                    value = null; // Or potentially skip the lead if email is critical
                }
                break;
              default:
                // Default to string conversion and trimming for other fields
                value = String(value).trim();
            }
            (normalizedLead as any)[normalizedKey] = value;
          } catch (coercionError: any) {
              console.error(`[NormalizeLeads] Error during type coercion for field "${normalizedKey}" (Raw ID: ${rawLead.id}), value: "${rawLead[rawKey]}". Error: ${coercionError.message}. Setting to null.`);
              (normalizedLead as any)[normalizedKey] = null;
          }
          // --- End Type Coercion ---

        } else {
          // Raw key doesn't exist, is null/undefined, or empty string - set normalized field to null
          (normalizedLead as any)[normalizedKey] = null;
          // console.log(`[NormalizeLeads] Raw key "${rawKey}" missing or empty for normalized key "${normalizedKey}" (Raw ID: ${rawLead.id}). Setting to null.`);
        }
      }

      // --- Final Validation (after mapping and coercion) ---
      for (const field of requiredFields) {
          if (normalizedLead[field] === null || normalizedLead[field] === undefined || String(normalizedLead[field]).trim() === '') {
              console.warn(`[NormalizeLeads] Missing or empty required field "${field}" after normalization for raw lead ID ${rawLead.id}. Skipping insertion for this lead.`);
              skipLead = true;
              break; // Stop checking this lead
          }
      }
      // Add more complex cross-field validation if needed here

      if (!skipLead) {
          // Cast to the Omit type only if it passes validation
          allNormalizedLeads.push(normalizedLead as Omit<NormalizedLead, 'id' | 'created_at' | 'updated_at'>);
          processedRawLeadIds.push(rawLead.id); // Track raw lead ID only if it was successfully normalized and validated
      }
      // --- End Final Validation ---
    } // End loop through rawLeads

    if (allNormalizedLeads.length === 0) {
        console.log(`[NormalizeLeads] No valid leads to insert after normalization and validation for source ${sourceId}.`);
        // Decide whether to mark the originally fetched *invalid* leads as processed.
        // Option 1: Mark all fetched leads as processed regardless of validity
        // Option 2: Only mark leads that were successfully processed (already handled by processedRawLeadIds logic)
        // Current logic follows Option 2. If you want Option 1, update the raw leads *before* this check.
        // If you choose Option 1, you might still want to update the 'processed' status here for the invalid ones.
        // Example for Option 1 (if needed):
        /*
        if (rawLeads.length > 0) {
             console.log(`[NormalizeLeads] Marking ${rawLeads.length} fetched raw leads as processed (including invalid ones) in ${dynamicTableName}...`);
             const { error: updateError } = await admin
               .from(dynamicTableName)
               .update({ processed: true, updated_at: new Date().toISOString() })
               .in('id', rawLeads.map(l => l.id)); // Mark all fetched leads
             if (updateError) {
               console.error(`[NormalizeLeads] Error marking all fetched raw leads as processed in ${dynamicTableName}:`, updateError);
             }
        }
        */
        return { success: true, message: 'No valid leads to insert after normalization.', insertedCount: 0 };
    }

    console.log(`[NormalizeLeads] Normalized ${allNormalizedLeads.length} valid leads. Preparing batch insert into '${TARGET_NORMALIZED_TABLE}'.`);

    // 3. Batch insert validated normalized leads into the target table
    let totalInserted = 0;
    let batchInsertError: PostgrestError | null = null; // Track the first error

    for (let i = 0; i < allNormalizedLeads.length; i += BATCH_SIZE) {
      const batch = allNormalizedLeads.slice(i, i + BATCH_SIZE);
      console.log(`[NormalizeLeads] Attempting to insert batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allNormalizedLeads.length / BATCH_SIZE)} (${batch.length} rows) into ${TARGET_NORMALIZED_TABLE}...`);

      const { error: currentBatchError, count } = await admin
        .from(TARGET_NORMALIZED_TABLE)
        .insert(batch); // Insert the validated batch

      if (currentBatchError) {
        batchInsertError = currentBatchError; // Store the first error encountered
        console.error(`[NormalizeLeads] Batch insert error object (Batch ${Math.floor(i / BATCH_SIZE) + 1}):`, batchInsertError);
        console.error(`[NormalizeLeads] Batch insert error (JSON):`, JSON.stringify(batchInsertError, null, 2));
        console.error(`[NormalizeLeads] Batch insert error (toString):`, batchInsertError.toString());
        console.error('[NormalizeLeads] Batch Insert Error Details:', {
            message: batchInsertError.message,
            details: batchInsertError.details,
            hint: batchInsertError.hint,
            code: batchInsertError.code,
        });
        // Log first few records of the failing batch for debugging
        console.error('[NormalizeLeads] Failing Batch Data Sample (first 5 records):', JSON.stringify(batch.slice(0, 5), null, 2));
        // Stop processing further batches on error
        break;
      }

      // Supabase v2 insert used to return count, check if it still does or rely on batch.length
      const insertedInBatch = count ?? batch.length;
      totalInserted += insertedInBatch;
      console.log(`[NormalizeLeads] Successfully inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${insertedInBatch} rows) into ${TARGET_NORMALIZED_TABLE}. Total inserted: ${totalInserted}`);
    }

    // Check if any batch insert error occurred during the loop
    if (batchInsertError) {
      const errorMessage = batchInsertError.message || JSON.stringify(batchInsertError);
      console.error(`[NormalizeLeads] Batch insert failed into ${TARGET_NORMALIZED_TABLE}. Error: ${errorMessage}. Total inserted before failure: ${totalInserted}`);
      // Do NOT mark raw leads as processed if insert failed.
      return {
          success: false,
          message: `Failed to insert normalized leads batch into ${TARGET_NORMALIZED_TABLE}: ${errorMessage}`,
          error: batchInsertError,
          insertedCount: totalInserted // Report how many were inserted before the error
      };
    }

    // If loop completed without error
    console.log(`[NormalizeLeads] Successfully inserted all ${totalInserted} normalized leads into ${TARGET_NORMALIZED_TABLE}.`);

    // 4. Mark corresponding raw leads as processed in the dynamic source table *only if all inserts were successful*
    if (totalInserted > 0 && processedRawLeadIds.length > 0) {
        console.log(`[NormalizeLeads] Marking ${processedRawLeadIds.length} corresponding raw leads as processed=true in ${dynamicTableName}...`);
        const { error: updateError } = await admin
          .from(dynamicTableName)
          .update({ processed: true, updated_at: new Date().toISOString() })
          .in('id', processedRawLeadIds); // Use the list of successfully normalized raw lead IDs

        if (updateError) {
          console.error(`[NormalizeLeads] Error marking raw leads as processed in ${dynamicTableName} after successful insert:`, updateError);
          // Log the error but consider the overall operation successful as insertion worked.
          // The risk is reprocessing these leads next time if the update failed.
          return {
              success: true, // Still true because insert worked
              message: `Successfully inserted ${totalInserted} normalized leads into ${TARGET_NORMALIZED_TABLE}, but failed to mark all corresponding raw leads as processed in ${dynamicTableName}. Error: ${updateError.message}`,
              insertedCount: totalInserted
          };
        }
        console.log(`[NormalizeLeads] Successfully marked ${processedRawLeadIds.length} raw leads as processed in ${dynamicTableName}.`);
    } else if (totalInserted === 0) {
         console.log(`[NormalizeLeads] No leads were inserted, skipping marking raw leads as processed.`);
    }

    return { success: true, message: `Successfully normalized and inserted ${totalInserted} leads into ${TARGET_NORMALIZED_TABLE}.`, insertedCount: totalInserted };

  } catch (error: any) {
    console.error('[NormalizeLeads] Unexpected error during normalization process:', error);
    // Log the specific error details if available
    console.error('[NormalizeLeads] Error details:', JSON.stringify(error, null, 2));
    return { success: false, message: `An unexpected error occurred: ${error.message || String(error)}`, error };
  }
}


// --- Reminder ---
// The function/API route/server action that CALLS `normalizeLeadsForSource`
// MUST fetch the lead source metadata (tableName and columnMap) first
// and pass them as arguments. See the previous example `processLeadSourceFile`.
// --- End Reminder ---

// You might also need a function to create the central 'leads' table if it doesn't exist
// This could be part of your main setup script or a separate migration.
/*
async function ensureNormalizedLeadsTableExists() {
    // Logic to check if TARGET_NORMALIZED_TABLE exists and create it if not.
    // This is complex to do reliably via RPC due to permissions and potential race conditions.
    // It's generally better to ensure the table exists via migrations or setup scripts.
    console.log(`Ensure target table '${TARGET_NORMALIZED_TABLE}' exists (manual check recommended).`);
}
*/

// Example of how the calling function might look (e.g., in your API route or server action):
// This should replace the previous logic that might have called normalizeLeadsForSource directly
// without fetching metadata first.

async function processLeadSourceFile(sourceId: string /*, other params like userId */) {
    console.log(`[ProcessLeadSource] Starting processing for sourceId: ${sourceId}`);
    try {
        // 1. Fetch Lead Source details (including metadata)
        console.log(`[ProcessLeadSource] Fetching lead source details for ID: ${sourceId}`);
        const { data: leadSource, error: fetchSourceError } = await admin
            .from('lead_sources')
            .select('id, metadata, name') // Select id, metadata, and name for logging
            .eq('id', sourceId)
            .single();

        if (fetchSourceError) {
            console.error(`[ProcessLeadSource] Error fetching lead source ${sourceId}:`, fetchSourceError);
            // Update lead_source status to 'error' maybe?
            // await admin.from('lead_sources').update({ status: 'error', status_message: 'Failed to fetch source details' }).eq('id', sourceId);
            throw new Error(`Lead source ${sourceId} not found or error fetching: ${fetchSourceError.message}`);
        }
        if (!leadSource) {
             console.error(`[ProcessLeadSource] Lead source ${sourceId} not found.`);
             throw new Error(`Lead source ${sourceId} not found.`);
        }

        console.log(`[ProcessLeadSource] Found lead source: ${leadSource.name} (ID: ${sourceId})`);

        // 2. Extract tableName and columnMap from metadata
        const dynamicTableName = leadSource.metadata?.tableName;
        const columnMap = leadSource.metadata?.columnMap;

        if (!dynamicTableName || typeof dynamicTableName !== 'string' || dynamicTableName.trim() === '') {
            console.error(`[ProcessLeadSource] Missing or invalid tableName in metadata for source ${sourceId}`);
            // Update lead_source status to 'error'
            // await admin.from('lead_sources').update({ status: 'error', status_message: 'Missing table name in metadata' }).eq('id', sourceId);
            throw new Error(`Metadata incomplete (missing tableName) for source ${sourceId}. Cannot normalize.`);
        }
         if (!columnMap || typeof columnMap !== 'object' || Object.keys(columnMap).length === 0) {
            console.error(`[ProcessLeadSource] Missing or invalid columnMap in metadata for source ${sourceId}`);
             // Update lead_source status to 'error'
            // await admin.from('lead_sources').update({ status: 'error', status_message: 'Missing column map in metadata' }).eq('id', sourceId);
            throw new Error(`Metadata incomplete (missing columnMap) for source ${sourceId}. Cannot normalize.`);
        }

        console.log(`[ProcessLeadSource] Extracted dynamic table name: ${dynamicTableName}`);
        console.log(`[ProcessLeadSource] Extracted column map:`, columnMap);

        // Optional: Check if dynamic table actually exists before calling normalize
        // const { data: tableExists, error: checkError } = await admin.rpc('check_table_exists', { table_name: dynamicTableName });
        // if (checkError || !tableExists) {
        //     console.error(`[ProcessLeadSource] Dynamic table ${dynamicTableName} does not exist or check failed. Error:`, checkError);
        //     throw new Error(`Dynamic table ${dynamicTableName} not found.`);
        // }
        // console.log(`[ProcessLeadSource] Dynamic table ${dynamicTableName} confirmed to exist.`);


        // 3. Call normalizeLeadsForSource with the dynamic info
        console.log(`[ProcessLeadSource] Calling normalizeLeadsForSource for source ${sourceId}...`);
        // Potentially update lead_source status to 'processing'
        // await admin.from('lead_sources').update({ status: 'processing', status_message: 'Normalizing leads...' }).eq('id', sourceId);

        const normalizationResult = await normalizeLeadsForSource(
            sourceId,
            dynamicTableName,
            columnMap
        );

        if (!normalizationResult.success) {
            console.error(`[ProcessLeadSource] Normalization failed for source ${sourceId}:`, normalizationResult.message, normalizationResult.error);
            // Update lead_source status to 'error' with details
            // await admin.from('lead_sources').update({ status: 'error', status_message: `Normalization failed: ${normalizationResult.message}` }).eq('id', sourceId);
            // Handle failure (e.g., notify user, log detailed error)
        } else {
            console.log(`[ProcessLeadSource] Normalization successful for source ${sourceId}: ${normalizationResult.message}`);
            // Update lead_source status to 'completed' or similar
            // await admin.from('lead_sources').update({ status: 'completed', status_message: normalizationResult.message, last_normalized_at: new Date().toISOString() }).eq('id', sourceId);
            // Handle success
        }

        return normalizationResult; // Return result for further processing if needed

    } catch (error: any) {
        console.error(`[ProcessLeadSource] Error processing lead source file for ${sourceId}:`, error);
         // Update lead_source status to 'error'
         // await admin.from('lead_sources').update({ status: 'error', status_message: `Processing error: ${error.message}` }).eq('id', sourceId);
        // Re-throw or return error status
        return { success: false, message: `Failed to process lead source ${sourceId}: ${error.message}`, error };
    }
}

// Make sure to export processLeadSourceFile if it's intended to be called from elsewhere
export { processLeadSourceFile };