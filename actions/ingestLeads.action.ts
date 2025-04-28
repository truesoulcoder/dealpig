'use server';

import { createClient } from '@supabase/supabase-js';
import { parse as csvParse } from 'csv-parse/sync';
import { randomUUID } from 'crypto';
import { revalidateTag } from 'next/cache';
import { createDynamicLeadTable, createLeadSource, processLeadsFromDynamicTable } from '@/lib/database';
import { UUID, LeadStatus } from '@/helpers/types';

// Types for import process
type FileUploadResult = {
  success: boolean;
  message: string;
  fileId: string;
  fileName: string;
  storagePath?: string;
  error?: string;
};

type ParseResult = {
  success: boolean;
  message: string;
  fileId: string;
  totalRows: number;
  insertedLeads: number;
  contactsCreated?: number;
  errors?: string[];
  leadSourceId?: UUID;
  sourceTableName?: string;
};

type ImportProgress = {
  stage: 'uploading' | 'parsing' | 'creating_table' | 'inserting_records' | 'processing_leads' | 'complete' | 'error';
  percentage: number;
  message: string;
  error?: string;
};

// Maps to store state between requests since server actions are stateless
const importProgressMap = new Map<string, ImportProgress>();
const pendingParseMap = new Map<string, {
  storagePath: string;
  fileName: string;
}>();

/**
 * Initialize a Supabase client with admin privileges
 */
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );
}

/**
 * Update the progress of an import operation
 */
function updateImportProgress(fileId: string, progress: Partial<ImportProgress>): void {
  const currentProgress = importProgressMap.get(fileId) || {
    stage: 'uploading',
    percentage: 0,
    message: 'Starting upload...'
  };
  
  importProgressMap.set(fileId, {
    ...currentProgress,
    ...progress
  });
}

/**
 * Get the current progress of an import operation
 */
export async function getImportProgress(fileId: string): Promise<ImportProgress | null> {
  return importProgressMap.get(fileId) || null;
}

/**
 * STEP 1: Upload the CSV file to Supabase storage
 * This is the first step in our two-step process
 */
export async function uploadLeadFile(formData: FormData): Promise<FileUploadResult> {
  // Generate a unique ID for the file upload operation
  const fileId = randomUUID();
  
  try {
    // Initialize progress
    updateImportProgress(fileId, {
      stage: 'uploading',
      percentage: 0,
      message: 'Starting file upload...'
    });

    // Get the file from the form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        fileId,
        fileName: '',
        message: 'No file provided',
        error: 'No file was provided in the form data'
      };
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return {
        success: false,
        fileId,
        fileName: file.name,
        message: 'File must be a CSV',
        error: 'Invalid file format. Only CSV files are supported'
      };
    }

    updateImportProgress(fileId, {
      percentage: 30,
      message: 'Uploading file to secure storage...'
    });

    // Initialize Supabase client
    const supabase = getSupabaseAdmin();

    // Generate a unique filename to avoid collisions
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uniqueId = fileId.slice(0, 8);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${timestamp}-${uniqueId}-${safeFileName}`;

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
      updateImportProgress(fileId, {
        stage: 'error',
        percentage: 100,
        message: 'File upload failed',
        error: error.message
      });
      
      return {
        success: false,
        fileId,
        fileName: file.name,
        message: 'Failed to upload file to storage',
        error: error.message
      };
    }

    // Construct the full storage URL to the file
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || 
                       'https://fzvueuydzfwtbyiumbep.supabase.co/storage/v1/object/public';
    const storagePath = `${storageUrl}/lead-imports/${data.path}`;

    // Store path for later processing
    pendingParseMap.set(fileId, {
      storagePath,
      fileName: file.name
    });
    
    updateImportProgress(fileId, {
      stage: 'complete',
      percentage: 100,
      message: 'File uploaded successfully. Ready for processing.'
    });

    return {
      success: true,
      fileId,
      fileName: file.name,
      storagePath,
      message: 'File uploaded successfully. Click "Process File" to continue.'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    updateImportProgress(fileId, {
      stage: 'error',
      percentage: 100,
      message: 'File upload failed',
      error: errorMessage
    });

    return {
      success: false,
      fileId,
      fileName: '',
      message: 'Failed to upload file',
      error: errorMessage
    };
  }
}

/**
 * STEP 2: Parse the CSV file and import the leads into the database
 * This is the second step in our two-step process
 */
export async function parseLeadFile(fileId: string): Promise<ParseResult> {
  try {
    // Check if this file has been uploaded
    const pendingFile = pendingParseMap.get(fileId);
    if (!pendingFile) {
      return {
        success: false,
        fileId,
        totalRows: 0,
        insertedLeads: 0,
        message: 'No uploaded file found with this ID'
      };
    }

    const { storagePath, fileName } = pendingFile;
    
    // Update progress for parsing
    updateImportProgress(fileId, {
      stage: 'parsing',
      percentage: 10,
      message: 'Downloading and parsing CSV file...'
    });

    // Download the file from storage
    const supabase = getSupabaseAdmin();
    const response = await fetch(storagePath);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // Parse the CSV content
    const fileContent = await response.text();
    const records = csvParse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    updateImportProgress(fileId, {
      percentage: 20,
      message: 'CSV parsed successfully'
    });

    // Validate we have data to process
    if (records.length === 0) {
      updateImportProgress(fileId, {
        stage: 'error',
        percentage: 100,
        message: 'The CSV file is empty'
      });
      
      return {
        success: false,
        message: 'The CSV file is empty',
        totalRows: 0,
        insertedLeads: 0,
        fileId
      };
    }

    // Create a sanitized table name from the filename
    const baseName = fileName.endsWith('.csv') ? 
      fileName.slice(0, -4).toLowerCase().replace(/[^a-z0-9]/g, '_') : 
      fileName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Add a unique suffix to avoid collisions
    const uniqueTableName = `${baseName}_${fileId.slice(0, 8)}`;
    
    // Detect column types from records
    const firstRecord = records[0];
    const columns = Object.keys(firstRecord).map(key => {
      let type = 'text';
      const value = firstRecord[key];
      
      if (value !== null && value !== undefined) {
        // Try to determine the column type
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
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
      }
      
      return { name: key, type };
    });

    // Create SQL column definitions
    const columnDefinitions = columns
      .map(col => `"${col.name.toLowerCase()}" ${col.type}`)
      .join(', ');

    updateImportProgress(fileId, {
      stage: 'creating_table',
      percentage: 30,
      message: 'Creating temporary storage table...'
    });

    // Create a dynamic table for this import
    try {
      await createDynamicLeadTable(uniqueTableName, columnDefinitions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateImportProgress(fileId, {
        stage: 'error',
        percentage: 100,
        message: `Failed to create table: ${errorMessage}`
      });
      
      return {
        success: false,
        message: `Failed to create table: ${errorMessage}`,
        totalRows: records.length,
        insertedLeads: 0,
        fileId
      };
    }

    updateImportProgress(fileId, {
      stage: 'inserting_records',
      percentage: 40,
      message: `Inserting ${records.length} records into temporary table...`
    });

    // Insert records into the temporary table
    let insertedCount = 0;
    try {
      // Batch the records to avoid overloading the database
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < records.length; i += batchSize) {
        batches.push(records.slice(i, i + batchSize));
      }
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from(`${uniqueTableName}_leads`).insert(batch);
        
        if (error) throw new Error(`Batch insert error: ${error.message}`);
        
        insertedCount += batch.length;
        
        updateImportProgress(fileId, {
          percentage: 40 + Math.floor((i + 1) / batches.length * 20),
          message: `Inserted ${insertedCount} of ${records.length} records...`
        });
      }
      
      updateImportProgress(fileId, {
        percentage: 60,
        message: `${insertedCount} records inserted successfully. Processing leads...`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateImportProgress(fileId, {
        stage: 'error',
        percentage: 100,
        message: `Failed to insert records: ${errorMessage}`
      });
      
      return {
        success: false,
        message: `Failed to insert records: ${errorMessage}`,
        totalRows: records.length,
        insertedLeads: 0,
        fileId
      };
    }

    // Create a lead source record
    let leadSourceId: UUID;
    try {
      leadSourceId = await createLeadSource({
        name: baseName,
        fileName,
        tableName: uniqueTableName,
        recordCount: records.length,
        columnMap: Object.fromEntries(columns.map(c => [c.name, c.name])),
        storagePath
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateImportProgress(fileId, {
        stage: 'error',
        percentage: 100,
        message: `Failed to create lead source: ${errorMessage}`
      });
      
      return {
        success: false,
        message: `Failed to create lead source: ${errorMessage}`,
        totalRows: records.length,
        insertedLeads: 0,
        fileId
      };
    }

    updateImportProgress(fileId, {
      stage: 'processing_leads',
      percentage: 70,
      message: 'Processing records into leads database...'
    });

    // Process leads from the temporary table into the main leads table
    try {
      const result = await processLeadsFromDynamicTable(uniqueTableName, leadSourceId);
      
      // Clean up - remove from pending map
      pendingParseMap.delete(fileId);
      
      // Update progress to complete
      updateImportProgress(fileId, {
        stage: 'complete',
        percentage: 100,
        message: `Import completed. ${result.processed} leads processed with ${result.contactsCreated} contacts.`
      });
      
      // Revalidate any cached data
      revalidateTag('leads');
      
      return {
        success: true,
        message: `Import completed successfully. Added ${result.processed} leads with ${result.contactsCreated} contacts.`,
        totalRows: records.length,
        insertedLeads: result.processed,
        contactsCreated: result.contactsCreated,
        leadSourceId,
        sourceTableName: uniqueTableName,
        fileId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateImportProgress(fileId, {
        stage: 'error',
        percentage: 100,
        message: `Failed to process leads: ${errorMessage}`
      });
      
      return {
        success: false,
        message: `Failed to process leads: ${errorMessage}`,
        totalRows: records.length,
        insertedLeads: 0,
        fileId
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    updateImportProgress(fileId, {
      stage: 'error',
      percentage: 100,
      message: `Process failed: ${errorMessage}`
    });
    
    return {
      success: false,
      message: `An unexpected error occurred: ${errorMessage}`,
      totalRows: 0,
      insertedLeads: 0,
      fileId
    };
  }
}