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
  contact_name?: string;
  contact_email?: string;
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
}

// Core logic extracted to be testable
export async function ingestLeadsFromCsvCore(
  fileContent: string, 
  fileName: string,
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
    
    // Create a lead source record using the filename as the name
    const leadSource: LeadSource = {
      name: baseFileName, // Use the CSV filename (without extension) as the lead source name
      file_name: fileName,
      last_imported: new Date().toISOString(),
      record_count: rows.length,
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

        // Convert numeric values
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
          source_id: sourceId,
          status: 'NEW'
        };

        // Insert the lead
        const newLead = await dbCreateLead(lead);
        
        if (newLead && newLead.id) {
          insertedLeads++;
          leadIds.push(newLead.id);

          // If contact information is provided, create a contact record
          if (row.contact_name && row.contact_email && newLead.id) {
            const contact: Contact = {
              name: row.contact_name,
              email: row.contact_email,
              lead_id: newLead.id,
              is_primary: true
            };

            const newContact = await dbCreateContact(contact);
            if (newContact) {
              insertedContacts++;
            } else {
              errors.push(`Failed to insert contact for lead: ${newLead.id}`);
            }
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
      campaignId
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
  return ingestLeadsFromCsvCore(fileContent, fileName);
}

export async function uploadCsv(formData: FormData): Promise<IngestResult> {
  try {
    const file = formData.get('file') as File;
    
    if (!file) {
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
      return {
        success: false,
        message: 'Invalid file type. Please upload a CSV file.',
        totalRows: 0,
        insertedLeads: 0,
        insertedContacts: 0,
        errors: ['Invalid file type']
      };
    }

    // Read file content
    const fileContent = await file.text();
    return ingestLeadsFromCsv(fileContent, file.name);
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return {
      success: false,
      message: `Error uploading file: ${error instanceof Error ? error.message : String(error)}`,
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