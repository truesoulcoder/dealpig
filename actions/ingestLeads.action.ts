'use server';

import { createLeadSource, insertLeadsIntoDynamicTable, processLeadsFromDynamicTable } from '@/lib/database';
import { parse as csvParse } from 'csv-parse/sync';
import { UUID } from '@/helpers/types';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Import the cache and revalidate functions from Next.js
import { revalidateTag } from 'next/cache';

type UploadResult = {
  success: boolean;
  message?: string;
  totalRows: number;
  insertedLeads: number;
  contactsCount?: number; // Adding this field to track contacts created
  errors?: string[];
  leadSourceId?: UUID;
  storagePath?: string; // Adding field to track where the file is stored
};

// Add a new type for progress tracking
type ImportProgress = {
  stage: 'parsing' | 'creating_table' | 'inserting_records' | 'processing_leads' | 'complete';
  percentage: number;
  message: string;
};

// Map to store import progress by ID
const importProgressMap = new Map<string, ImportProgress>();

/**
 * Store the original CSV file in Supabase storage for backup purposes
 * @param file The uploaded CSV file
 * @returns The storage path where the file is stored or null if storage fails
 */
async function storeOriginalFile(file: File): Promise<string | null> {
  try {
    // Create a Supabase client for storage
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        },
        global: {
          headers: {
            'X-Supabase-Storage-Region': process.env.SUPABASE_STORAGE_REGION || 'us-east-1'
          }
        }
      }
    );
    
    // Generate a unique filename to avoid collisions
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = randomUUID().slice(0, 8);
    const fileName = `${timestamp}-${uniqueId}-${file.name}`;
    
    // Convert file to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    
    // Upload to the lead-imports bucket
    const { data, error } = await supabase
      .storage
      .from('lead-imports')
      .upload(fileName, arrayBuffer, {
        contentType: 'text/csv',
        cacheControl: '3600'
      });
    
    if (error) {
      console.error('Error storing CSV file:', error);
      return null;
    }
    
    // Construct the full storage URL to the file
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || 'https://fzvueuydzfwtbyiumbep.supabase.co/storage/v1/s3';
    const fullPath = `${storageUrl}/lead-imports/${data.path}`;
    
    return fullPath;
  } catch (error) {
    console.error('Failed to store original CSV file:', error);
    return null;
  }
}

/**
 * Get the current progress of an import operation
 * @param importId The ID of the import operation
 * @returns The current progress or null if not found
 */
export async function getImportProgress(importId: string): Promise<ImportProgress | null> {
  return importProgressMap.get(importId) || null;
}

/**
 * Update the progress of an import operation
 * @param importId The ID of the import operation
 * @param progress The progress data to update
 */
function updateImportProgress(importId: string, progress: Partial<ImportProgress>): void {
  const current = importProgressMap.get(importId) || {
    stage: 'parsing',
    percentage: 0,
    message: 'Starting import...'
  };
  
  importProgressMap.set(importId, {
    ...current,
    ...progress
  });
  
  // Progress should be automatically garbage collected after 1 hour
  setTimeout(() => {
    importProgressMap.delete(importId);
  }, 60 * 60 * 1000);
}

/**
 * Server action to upload and process a CSV file containing lead data
 * Handles multiple contacts per property according to the database schema
 * @param formData The form data containing the CSV file
 * @returns Result of the import operation with an importId for tracking progress
 */
export async function uploadCsv(formData: FormData): Promise<UploadResult & { importId?: string }> {
  // Generate a unique ID for this import operation
  const importId = randomUUID();
  
  try {
    // Initialize progress
    updateImportProgress(importId, {
      stage: 'parsing',
      percentage: 0,
      message: 'Starting CSV import...'
    });

    // Get the file from the form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        message: 'No file provided',
        totalRows: 0,
        insertedLeads: 0,
        importId
      };
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return {
        success: false,
        message: 'File must be a CSV',
        totalRows: 0,
        insertedLeads: 0,
        importId
      };
    }

    // Store the original file in Supabase storage for backup
    const storagePath = await storeOriginalFile(file);
    if (!storagePath) {
      console.warn('Failed to store the original file, but continuing with import');
    }

    updateImportProgress(importId, {
      percentage: 10,
      message: 'Reading CSV file...'
    });

    // Read the file as text
    const fileContent = await file.text();
    
    // Parse CSV content
    const records = csvParse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    updateImportProgress(importId, {
      percentage: 20,
      message: 'CSV parsed successfully'
    });

    if (records.length === 0) {
      updateImportProgress(importId, {
        stage: 'complete',
        percentage: 100,
        message: 'Import completed. The CSV file was empty.'
      });
      
      return {
        success: false,
        message: 'The CSV file is empty',
        totalRows: 0,
        insertedLeads: 0,
        storagePath,
        importId
      };
    }

    // Extract filename without extension for table naming
    const fileName = file.name;
    const tableName = fileName.endsWith('.csv') ? 
      fileName.slice(0, -4).toLowerCase().replace(/[^a-z0-9]/g, '_') : 
      fileName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Detect column types from first record
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord).map(key => {
      let type = 'text';
      const value = firstRecord[key];
      
      // Try to determine the column type
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        // Check if it's an integer
        if (parseInt(value).toString() === value) {
          type = 'integer';
        } else {
          type = 'numeric';
        }
      } else if (
        /^\d{4}-\d{2}-\d{2}$/.test(value) || 
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
      ) {
        type = 'timestamp';
      }

      return { name: key, type };
    });

    updateImportProgress(importId, {
      stage: 'creating_table',
      percentage: 30,
      message: 'Creating database table...'
    });

    // Create a dynamic table for this import
    try {
      await createDynamicLeadTable(tableName, columns);
    } catch (error) {
      updateImportProgress(importId, {
        stage: 'complete',
        percentage: 100,
        message: `Import failed: ${(error as Error).message}`
      });
      
      return {
        success: false,
        message: 'Failed to create table for lead data',
        totalRows: records.length,
        insertedLeads: 0,
        errors: [(error as Error).message],
        importId
      };
    }
    
    updateImportProgress(importId, {
      stage: 'inserting_records',
      percentage: 40,
      message: `Inserting ${records.length} records into database...`
    });
    
    // Insert records into the dynamic table
    let insertedCount = 0;
    try {
      insertedCount = await insertLeadsIntoDynamicTable(tableName, records);
      
      updateImportProgress(importId, {
        percentage: 60,
        message: `${insertedCount} records inserted successfully`
      });
    } catch (error) {
      updateImportProgress(importId, {
        stage: 'complete',
        percentage: 100,
        message: `Import failed: ${(error as Error).message}`
      });
      
      return {
        success: false,
        message: 'Failed to insert lead data',
        totalRows: records.length,
        insertedLeads: insertedCount,
        errors: [(error as Error).message],
        importId
      };
    }
    
    // Map columns to standard field names for this lead source
    const columnMap: Record<string, string> = {};
    const knownFields = [
      'property_address', 'property_city', 'property_state', 'property_zip',
      'owner_name', 'mailing_address', 'mailing_city', 'mailing_state', 'mailing_zip',
      'wholesale_value', 'market_value', 'days_on_market', 'mls_status',
      'mls_list_date', 'mls_list_price', 'status', 'owner_type', 'property_type',
      'beds', 'baths', 'square_footage', 'year_built', 'assessed_total'
    ];
    
    // Add all contact fields
    for (let i = 1; i <= 5; i++) {
      knownFields.push(`contact${i}name`);
      knownFields.push(`contact${i}firstname`);
      knownFields.push(`contact${i}lastname`);
      for (let j = 1; j <= 3; j++) {
        knownFields.push(`contact${i}phone_${j}`);
        knownFields.push(`contact${i}email_${j}`);
      }
    }

    // Auto-map based on field names
    Object.keys(firstRecord).forEach(key => {
      const lowerKey = key.toLowerCase().replace(/\s+/g, '_');
      
      // Direct match
      if (knownFields.includes(lowerKey)) {
        columnMap[key] = lowerKey;
      }
      // Check for fuzzy matches
      else {
        if (lowerKey.includes('address') && !lowerKey.includes('mailing')) columnMap[key] = 'property_address';
        else if (lowerKey.includes('city') && !lowerKey.includes('mailing')) columnMap[key] = 'property_city';
        else if (lowerKey.includes('state') && !lowerKey.includes('mailing')) columnMap[key] = 'property_state';
        else if (lowerKey.includes('zip') && !lowerKey.includes('mailing')) columnMap[key] = 'property_zip';
        else if (lowerKey.includes('mailing') && lowerKey.includes('address')) columnMap[key] = 'mailing_address';
        else if (lowerKey.includes('mailing') && lowerKey.includes('city')) columnMap[key] = 'mailing_city';
        else if (lowerKey.includes('mailing') && lowerKey.includes('state')) columnMap[key] = 'mailing_state';
        else if (lowerKey.includes('mailing') && lowerKey.includes('zip')) columnMap[key] = 'mailing_zip';
        else if (lowerKey.includes('market') && lowerKey.includes('value')) columnMap[key] = 'market_value';
        else if (lowerKey.includes('wholesale') && lowerKey.includes('value')) columnMap[key] = 'wholesale_value';
        else if (lowerKey.includes('list') && lowerKey.includes('price')) columnMap[key] = 'mls_list_price';
        else if (lowerKey.includes('list') && lowerKey.includes('date')) columnMap[key] = 'mls_list_date';
        else if (lowerKey.includes('assessed')) columnMap[key] = 'assessed_total';
        else if (lowerKey.includes('year') && lowerKey.includes('built')) columnMap[key] = 'year_built';
        else if (lowerKey === 'beds' || lowerKey.includes('bedroom')) columnMap[key] = 'beds';
        else if (lowerKey === 'baths' || lowerKey.includes('bathroom')) columnMap[key] = 'baths';
        else if (lowerKey.includes('sqft') || lowerKey.includes('square_ft') || lowerKey.includes('sq_ft')) columnMap[key] = 'square_footage';
        
        // Handle contact fields with various formats
        for (let i = 1; i <= 5; i++) {
          if (lowerKey.includes(`contact${i}`) || lowerKey.includes(`owner${i}`)) {
            if (lowerKey.includes('name') && !lowerKey.includes('first') && !lowerKey.includes('last')) {
              columnMap[key] = `contact${i}name`;
            }
            else if (lowerKey.includes('first')) {
              columnMap[key] = `contact${i}firstname`;
            }
            else if (lowerKey.includes('last')) {
              columnMap[key] = `contact${i}lastname`;
            }
            else if (lowerKey.includes('phone') || lowerKey.includes('mobile') || lowerKey.includes('cell')) {
              // Check if there's a specific number indicated
              if (lowerKey.includes('1') || lowerKey.includes('primary')) {
                columnMap[key] = `contact${i}phone_1`;
              } else if (lowerKey.includes('2') || lowerKey.includes('secondary')) {
                columnMap[key] = `contact${i}phone_2`;
              } else if (lowerKey.includes('3')) {
                columnMap[key] = `contact${i}phone_3`;
              } else {
                columnMap[key] = `contact${i}phone_1`; // Default to first phone
              }
            }
            else if (lowerKey.includes('email')) {
              // Check if there's a specific number indicated
              if (lowerKey.includes('1') || lowerKey.includes('primary')) {
                columnMap[key] = `contact${i}email_1`;
              } else if (lowerKey.includes('2') || lowerKey.includes('secondary')) {
                columnMap[key] = `contact${i}email_2`;
              } else if (lowerKey.includes('3')) {
                columnMap[key] = `contact${i}email_3`;
              } else {
                columnMap[key] = `contact${i}email_1`; // Default to first email
              }
            }
          }
        }
      }
    });

    updateImportProgress(importId, {
      percentage: 70,
      message: 'Creating lead source record...'
    });

    // Create a lead source record
    let leadSourceId;
    try {
      leadSourceId = await createLeadSource({
        name: tableName.replace(/_/g, ' '),
        fileName: file.name,
        tableName,
        recordCount: records.length,
        columnMap,
        storagePath // Pass the storage path to track the original file
      });
    } catch (error) {
      updateImportProgress(importId, {
        stage: 'complete',
        percentage: 100,
        message: `Import partially completed: ${(error as Error).message}`
      });
      
      return {
        success: false,
        message: 'Failed to create lead source',
        totalRows: records.length,
        insertedLeads: insertedCount,
        errors: [(error as Error).message],
        importId
      };
    }
    
    updateImportProgress(importId, {
      stage: 'processing_leads',
      percentage: 80,
      message: 'Processing lead records...'
    });
    
    // Process the leads from the dynamic table into the main leads table with normalized contacts
    let processResult = { processed: 0, contactsCreated: 0 };
    try {
      processResult = await processLeadsFromDynamicTable(tableName, leadSourceId);
      
      updateImportProgress(importId, {
        stage: 'complete',
        percentage: 100,
        message: `Import completed successfully: ${processResult.processed} leads and ${processResult.contactsCreated} contacts created`
      });
    } catch (error) {
      updateImportProgress(importId, {
        stage: 'complete',
        percentage: 100,
        message: `Import partially completed: ${(error as Error).message}`
      });
      
      return {
        success: false,
        message: 'Successfully imported raw data, but failed to process all leads',
        totalRows: records.length,
        insertedLeads: processResult.processed,
        contactsCount: processResult.contactsCreated,
        leadSourceId,
        errors: [(error as Error).message],
        importId
      };
    }

    // Revalidate the leads cache tag to ensure updated data is shown
    revalidateTag('leads');

    return {
      success: true,
      message: 'Successfully imported lead data',
      totalRows: records.length,
      insertedLeads: processResult.processed,
      contactsCount: processResult.contactsCreated,
      leadSourceId,
      storagePath,
      importId
    };
  } catch (error) {
    updateImportProgress(importId, {
      stage: 'complete',
      percentage: 100,
      message: `Import failed: ${(error as Error).message}`
    });
    
    console.error('CSV upload error:', error);
    return {
      success: false,
      message: 'An unexpected error occurred during CSV processing',
      totalRows: 0,
      insertedLeads: 0,
      errors: [(error as Error).message],
      importId
    };
  }
}

/**
 * Helper function to create a dynamic table for lead data
 */
async function createDynamicLeadTable(tableName: string, columns: Array<{name: string, type: string}>): Promise<boolean> {
  return await import('@/lib/database').then(db => db.createDynamicLeadTable(tableName, columns));
}