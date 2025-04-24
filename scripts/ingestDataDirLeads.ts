#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { ingestLeadsFromCsvCore } from '../actions/ingestLeads.action';
import { 
  createLead, 
  createContact, 
  createLeadSource, 
  createCampaign,
  addLeadsToCampaign 
} from '../lib/database';

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Map CSV columns from the data directory format to the expected format for the lead ingestion function
 */
function transformCsvData(fileContent: string): string {
  try {
    // Parse original CSV
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    // Map to the expected format
    const transformedRows = rows.map((row: any) => ({
      property_address: row.PropertyAddress || '',
      property_city: row.PropertyCity || '',
      property_state: row.PropertyState || '',
      property_zip: row.PropertyPostalCode || '',
      wholesale_value: row.WholesaleValue?.replace(/[^0-9.]/g, '') || '',
      market_value: row.MarketValue?.replace(/[^0-9.]/g, '') || '',
      days_on_market: row.MLS_Curr_DaysOnMarket || '',
      mls_status: row.MLS_Curr_Status || '',
      mls_list_date: row.MLS_Curr_ListDate || '',
      mls_list_price: row.MLS_Curr_ListPrice?.replace(/[^0-9.]/g, '') || '',
      contact_name: row.Contact1Name || '',
      contact_email: row.Contact1Email_1 || '',
      // Additional useful fields from the CSV
      owner_type: row.OwnerType || '',
      property_type: row.PropertyType || '',
      last_sales_date: row.LastSalesDate || '',
      last_sales_price: row.LastSalesPrice || '',
      beds: row.Beds || '',
      baths: row.Baths || '',
      square_footage: row.SquareFootage || '',
      year_built: row.YearBuilt || '',
      assessed_total: row.AssessedTotal?.replace(/[^0-9.]/g, '') || '',
      county: row.County || ''
    }));

    // Convert back to CSV string
    const header = Object.keys(transformedRows[0]).join(',');
    const rows_csv = transformedRows.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    ).join('\n');

    return `${header}\n${rows_csv}`;
  } catch (error) {
    console.error('Error transforming CSV data:', error);
    return fileContent; // Return original content if transformation fails
  }
}

/**
 * Process a single CSV file for ingestion
 */
async function processFile(filePath: string) {
  try {
    console.log(`Processing ${filePath}...`);
    
    const fileName = path.basename(filePath);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Transform the CSV data to match expected format
    const transformedContent = transformCsvData(fileContent);
    
    // Use the core ingest function with transformed data
    const result = await ingestLeadsFromCsvCore(
      transformedContent, 
      fileName,
      createLeadSource,
      createLead,
      createContact,
      createCampaign,
      addLeadsToCampaign
    );
    
    console.log(`Results for ${fileName}:`);
    console.log(`- Success: ${result.success}`);
    console.log(`- Total rows: ${result.totalRows}`);
    console.log(`- Inserted leads: ${result.insertedLeads}`);
    console.log(`- Inserted contacts: ${result.insertedContacts}`);
    console.log(`- Source ID: ${result.sourceId}`);
    console.log(`- Campaign ID: ${result.campaignId}`);
    
    if (result.errors.length > 0) {
      console.log('Errors:');
      result.errors.forEach((error, i) => {
        if (i < 10) {  // Limit error output to avoid console flooding
          console.log(`  ${i + 1}. ${error}`);
        } else if (i === 10) {
          console.log(`  ... and ${result.errors.length - 10} more errors`);
        }
      });
    }
    
    return result;
  } catch (error) {
    console.error(`Failed to process file ${filePath}:`, error);
    return null;
  }
}

/**
 * Main function to process all CSV files in the data directory
 */
async function main() {
  try {
    // Get all CSV files in the data directory
    const files = fs.readdirSync(DATA_DIR)
      .filter(file => file.toLowerCase().endsWith('.csv'))
      .map(file => path.join(DATA_DIR, file));
    
    if (files.length === 0) {
      console.log('No CSV files found in the data directory.');
      return;
    }
    
    console.log(`Found ${files.length} CSV files to process.`);
    
    // Process each file
    let totalLeads = 0;
    let totalContacts = 0;
    
    for (const file of files) {
      const result = await processFile(file);
      if (result) {
        totalLeads += result.insertedLeads;
        totalContacts += result.insertedContacts;
      }
      console.log('-----------------------------------');
    }
    
    console.log('All files processed.');
    console.log(`Total leads inserted: ${totalLeads}`);
    console.log(`Total contacts inserted: ${totalContacts}`);
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

// Execute the main function
main().catch(console.error);