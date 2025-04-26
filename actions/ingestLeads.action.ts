"use server";

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { 
  createLead, 
  createContact, 
  createLeadSource, 
  createCampaign,
  addLeadsToCampaign,
  Lead, 
  Contact, 
  LeadSource,
  Campaign
} from '@/lib/database';
import { uploadToStorage, getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Bucket name for lead imports
const LEADS_BUCKET = 'lead-imports';

// Maximum file size 50MB to match Supabase storage bucket limit
const MAX_FILE_SIZE = 50 * 1024 * 1024;

interface CsvLead {
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  wholesale_value?: string;
  market_value?: string;
  days_on_market?: string;
  mls_status?: string;
  mls_list_date?: string;
  mls_list_price?: string;
  owner_type?: string;
  property_type?: string;
  beds?: string;
  baths?: string;
  square_footage?: string;
  year_built?: string;
  assessed_total?: string;
  contact1name?: string;
  contact1phone_1?: string;
  contact1email_1?: string;
  contact2name?: string;
  contact2phone_1?: string;
  contact2email_1?: string;
  contact3name?: string;
  contact3phone_1?: string;
  contact3email_1?: string;
  [key: string]: string | undefined;
}

interface IngestResult {
  success: boolean;
  message: string;
  totalRows: number;
  insertedLeads: number;
  insertedContacts: number;
  errors: string[];
  sourceId?: string;
  campaignId?: string;
  fileUrl?: string;
}

// Core logic extracted to be testable
export async function ingestLeadsFromCsvCore(
  fileContent: string, 
  fileName: string,
  fileBuffer?: Buffer,
  dbCreateLeadSource = createLeadSource,
  dbCreateLead = createLead,
  dbCreateContact = createContact,
  dbCreateCampaign = createCampaign,
  dbAddLeadsToCampaign = addLeadsToCampaign
): Promise<IngestResult> {
  try {
    // Parse CSV content
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CsvLead[];

    if (!rows.length) {
      return {
        success: false,
        message: 'No data found in CSV file',
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['Empty CSV file']
      };
    }

    // Extract base filename without extension to use as name
    const baseFileName = path.basename(fileName, '.csv');
    
    // Upload the original CSV file to Supabase storage for reference
    let fileUrl: string | null = null;
    if (fileBuffer) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const storagePath = `${baseFileName}_${timestamp}.csv`;
      fileUrl = await uploadToStorage(LEADS_BUCKET, storagePath, fileBuffer, 'text/csv');
    }
    
    // Create a lead source record using the filename as the name
    const leadSource: LeadSource = {
      name: baseFileName, // Use the CSV filename (without extension) as the lead source name
      file_name: fileName,
      last_imported: new Date().toISOString(),
      record_count: rows.length,
      file_url: fileUrl || undefined,
    };

    const source = await dbCreateLeadSource(leadSource);
    const sourceId = source?.id;

    let insertedLeads = 0;
    let insertedContacts = 0;
    const errors: string[] = [];
    const leadIds: string[] = [];

    // Process each row in the CSV
    for (const row of rows) {
      try {
        // Check for required fields
        if (!row.property_address || !row.property_city || !row.property_state || !row.property_zip) {
          errors.push(`Missing required property information: ${JSON.stringify(row)}`);
          continue;
        }

        // Convert numeric values and prepare lead with contact information
        const lead: Lead = {
          property_address: row.property_address,
          property_city: row.property_city,
          property_state: row.property_state,
          property_zip: row.property_zip,
          wholesale_value: row.wholesale_value ? parseFloat(row.wholesale_value) : undefined,
          market_value: row.market_value ? parseFloat(row.market_value) : undefined,
          days_on_market: row.days_on_market ? parseInt(row.days_on_market, 10) : undefined,
          mls_status: row.mls_status,
          mls_list_date: row.mls_list_date,
          mls_list_price: row.mls_list_price ? parseFloat(row.mls_list_price) : undefined,
          owner_type: row.owner_type,
          property_type: row.property_type,
          beds: row.beds,
          baths: row.baths,
          square_footage: row.square_footage,
          year_built: row.year_built,
          assessed_total: row.assessed_total ? parseFloat(row.assessed_total) : undefined,
          // Add contact fields directly to the lead
          contact1name: row.contact1name,
          contact1phone_1: row.contact1phone_1,
          contact1email_1: row.contact1email_1,
          contact2name: row.contact2name,
          contact2phone_1: row.contact2phone_1,
          contact2email_1: row.contact2email_1,
          contact3name: row.contact3name,
          contact3phone_1: row.contact3phone_1,
          contact3email_1: row.contact3email_1,
          source_id: sourceId,
          status: 'NEW'
        };

        // Insert the lead
        const newLead = await dbCreateLead(lead);
        
        if (newLead && newLead.id) {
          insertedLeads++;
          leadIds.push(newLead.id);

          // Create contacts from the lead's contact fields
          let contactsCreated = 0;
          
          // Create Contact 1 if name and email exist
          if (row.contact1name && row.contact1email_1 && newLead.id) {
            const contact1: Contact = {
              name: row.contact1name,
              email: row.contact1email_1,
              lead_id: newLead.id,
              is_primary: true
            };

            const newContact = await dbCreateContact(contact1);
            if (newContact) {
              contactsCreated++;
            }
          }
          
          // Create Contact 2 if name and email exist
          if (row.contact2name && row.contact2email_1 && newLead.id) {
            const contact2: Contact = {
              name: row.contact2name,
              email: row.contact2email_1,
              lead_id: newLead.id,
              is_primary: false
            };

            const newContact = await dbCreateContact(contact2);
            if (newContact) {
              contactsCreated++;
            }
          }
          
          // Create Contact 3 if name and email exist
          if (row.contact3name && row.contact3email_1 && newLead.id) {
            const contact3: Contact = {
              name: row.contact3name,
              email: row.contact3email_1,
              lead_id: newLead.id,
              is_primary: false
            };

            const newContact = await dbCreateContact(contact3);
            if (newContact) {
              contactsCreated++;
            }
          }
          
          insertedContacts += contactsCreated;
          
          if (contactsCreated === 0) {
            errors.push(`No valid contacts found for lead: ${newLead.id}`);
          }
        } else {
          errors.push(`Failed to insert lead: ${row.property_address}`);
        }
      } catch (error) {
        errors.push(`Error processing row: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Automatically create a campaign for this lead list
    let campaignId: string | undefined;
    if (leadIds.length > 0 && sourceId) {
      try {
        // Create a new campaign with default settings
        const campaign: Campaign = {
          name: `${baseFileName} Campaign`,
          description: `Auto-generated campaign for ${baseFileName} lead list`,
          status: 'DRAFT',
          leads_per_day: 10, // Default value
          start_time: '09:00',  // Default value
          end_time: '17:00',    // Default value
          min_interval_minutes: 15,  // Default value
          max_interval_minutes: 45,  // Default value
          attachment_type: 'PDF',    // Default value
          total_leads: leadIds.length
        };

        const newCampaign = await dbCreateCampaign(campaign);
        
        if (newCampaign && newCampaign.id) {
          campaignId = newCampaign.id;
          
          // Add the leads to the campaign
          await dbAddLeadsToCampaign(campaignId, leadIds);
        }
      } catch (error) {
        errors.push(`Error creating campaign: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: insertedLeads > 0,
      message: `Processed ${rows.length} rows, inserted ${insertedLeads} leads and ${insertedContacts} contacts${campaignId ? ', and created a campaign' : ''}`,
      totalRows: rows.length,
      insertedLeads,
      insertedContacts,
      errors,
      sourceId,
      campaignId,
      fileUrl: fileUrl || undefined
    };
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return {
      success: false,
      message: `Failed to process CSV: ${error instanceof Error ? error.message : String(error)}`,
      totalRows: 0,
      insertedLeads: 0,
      insertedContacts: 0,
      errors: [String(error)]
    };
  }
}

// Server action that uses the core logic
export async function ingestLeadsFromCsv(fileContent: string, fileName: string): Promise<IngestResult> {
  // Convert string to Buffer for storage
  const fileBuffer = Buffer.from(fileContent);
  return ingestLeadsFromCsvCore(fileContent, fileName, fileBuffer);
}

export async function uploadCsv(formData: FormData): Promise<IngestResult> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('CSV Upload Error: No file provided in form data');
      return {
        success: false,
        message: 'No file uploaded',
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['No file provided']
      };
    }

    // Check file type
    if (!file.name.endsWith('.csv')) {
      console.error('CSV Upload Error: Invalid file type', file.name);
      return {
        success: false,
        message: 'Invalid file type. Please upload a CSV file.',
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['Invalid file type']
      };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('CSV Upload Error: File too large', { size: file.size, maxSize: MAX_FILE_SIZE });
      return {
        success: false,
        message: `File size exceeds the 50MB limit (${Math.round(file.size / (1024 * 1024))}MB)`,
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['File too large']
      };
    }

    // Read file content
    let fileContent;
    try {
      fileContent = await file.text();
      console.log(`CSV file read successfully: ${file.name}, ${fileContent.length} bytes`);
    } catch (error) {
      console.error('CSV Upload Error: Failed to read file content', error);
      return {
        success: false,
        message: `Error reading file: ${error instanceof Error ? error.message : String(error)}`,
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['File reading error']
      };
    }
    
    // If file is empty or invalid
    if (!fileContent || fileContent.trim().length === 0) {
      console.error('CSV Upload Error: Empty file');
      return {
        success: false,
        message: 'The uploaded file is empty',
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['Empty file']
      };
    }
    
    // Convert file to buffer for storage
    let fileBuffer: Buffer;
    try {
      fileBuffer = Buffer.from(await file.arrayBuffer());
      console.log(`CSV file converted to buffer: ${fileBuffer.length} bytes`);
    } catch (error) {
      console.error('CSV Upload Error: Failed to convert file to buffer', error);
      return {
        success: false,
        message: `Error processing file: ${error instanceof Error ? error.message : String(error)}`,
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['File processing error']
      };
    }
    
    try {
      // Process the CSV file
      console.log(`Starting CSV processing for file: ${file.name}`);
      const result = await ingestLeadsFromCsvCore(fileContent, file.name, fileBuffer);
      console.log(`CSV processing complete: ${result.insertedLeads} leads inserted`);
      return result;
    } catch (error) {
      console.error('CSV Upload Error: Failed during CSV processing', error);
      // Provide detailed error information
      return {
        success: false,
        message: `Error processing CSV: ${error instanceof Error ? error.message : String(error)}`,
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: [error instanceof Error ? error.stack || error.message : String(error)]
      };
    }
  } catch (error) {
    console.error('CSV Upload: Unexpected error', error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      totalRows: 0,
      insertedLeads: 0,
      insertedContacts: 0,
      errors: [String(error)]
    };
  }
}

// Export getLeads function that uses the database implementation
export async function getLeads() {
  try {
    const { getLeads: databaseGetLeads } = await import('@/lib/database');
    return databaseGetLeads();
  } catch (error) {
    console.error('Error in getLeads action:', error);
    return [];
  }
}

// Add updateLead function
export async function updateLead(lead: Partial<Lead> & { id: string }) {
  try {
    const { updateLead: databaseUpdateLead } = await import('@/lib/database');
    const { id, ...updateData } = lead;
    return databaseUpdateLead(id, updateData); // Adjusted to pass the id and update data separately
  } catch (error) {
    console.error('Error in updateLead action:', error);
    throw new Error(`Failed to update lead: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Add deleteLead function
export async function deleteLead(leadId: string) {
  try {
    const { deleteLead: databaseDeleteLead } = await import('@/lib/database');
    return databaseDeleteLead(leadId);
  } catch (error) {
    console.error('Error in deleteLead action:', error);
    throw new Error(`Failed to delete lead: ${error instanceof Error ? error.message : String(error)}`);
  }
}