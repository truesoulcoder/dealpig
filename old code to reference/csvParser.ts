import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createLeadSource, createLead, createContact } from '../services/databaseService';
import supabase from '../lib/supabase';

interface LeadCSVRecord {
  PropertyAddress: string;
  PropertyCity: string;
  PropertyState: string;
  PropertyPostalCode: string;
  WholesaleValue: string;
  MarketValue: string;
  MLS_Curr_DaysOnMarket: string;
  MLS_Curr_Status: string;
  MLS_Curr_ListDate: string;
  MLS_Curr_ListPrice: string;
  Contact1Name: string;
  Contact1Email_1: string;
  Contact1Email_2?: string;
  Contact1Email_3?: string;
  Contact2Name?: string;
  Contact2Email_1?: string;
  Contact2Email_2?: string;
  Contact2Email_3?: string;
  Contact3Name?: string;
  Contact3Email_1?: string;
  Contact3Email_2?: string;
  Contact3Email_3?: string;
}

export async function importLeadsFromCSV(filePath: string) {
  const records: LeadCSVRecord[] = [];
  
  const parser = createReadStream(filePath).pipe(
    parse({
      columns: true,
      skip_empty_lines: true
    })
  );

  for await (const record of parser) {
    records.push(record);
  }

  // Create a new lead source with Supabase-compatible fields (snake_case)
  const leadSource = await createLeadSource({
    name: path.basename(filePath, '.csv'),
    file_name: path.basename(filePath),
    last_imported: new Date(),
    record_count: records.length,
    is_active: false,
  });

  if (global.logHandlers) {
    for (const sendLog of global.logHandlers.values()) {
      sendLog('info', `Created new lead source: ${leadSource.name} with ${records.length} records`);
    }
  }

  for (const record of records) {
    // Parse numeric values and clean up the data
    const wholesaleValue = parseFloat(record.WholesaleValue.replace(/[$,]/g, '')) || 0;
    const marketValue = parseFloat(record.MarketValue.replace(/[$,]/g, '')) || 0;
    const daysOnMarket = parseInt(record.MLS_Curr_DaysOnMarket) || 0;
    const listPrice = parseFloat(record.MLS_Curr_ListPrice.replace(/[$,]/g, '')) || 0;
    
    // Only process leads that have been on market for minimum days specified in env
    const minDays = parseInt(process.env.MIN_DAYS_ON_MARKET || '30');

    if (daysOnMarket < minDays) continue;

    try {
      // Create the lead record with source reference using Supabase-compatible fields
      const lead = await createLead({
        id: uuidv4(),
        source_id: leadSource.id,
        property_address: record.PropertyAddress,
        property_city: record.PropertyCity,
        property_state: record.PropertyState,
        property_zip: record.PropertyPostalCode,
        wholesale_value: wholesaleValue,
        market_value: marketValue,
        days_on_market: daysOnMarket,
        mls_status: record.MLS_Curr_Status,
        mls_list_date: record.MLS_Curr_ListDate ? new Date(record.MLS_Curr_ListDate) : undefined,
        mls_list_price: listPrice,
        status: 'NEW',
        created_at: new Date(),
        updated_at: new Date()
      });

      // Process contacts and their primary emails
      const contacts = [
        {
          name: record.Contact1Name,
          email: record.Contact1Email_1,
          isPrimary: true
        },
        {
          name: record.Contact2Name,
          email: record.Contact2Email_1,
          isPrimary: false
        },
        {
          name: record.Contact3Name,
          email: record.Contact3Email_1,
          isPrimary: false
        }
      ].filter(contact => contact.name && contact.email);

      // Create contact records with their primary email
      for (const contact of contacts) {
        const createdContact = await createContact({
          id: uuidv4(),
          name: contact.name,
          email: contact.email,
          lead_id: lead.id,
          is_primary: contact.isPrimary,
          created_at: new Date(),
          updated_at: new Date()
        });

        // Additional emails would be handled by a separate table in Supabase
        // This implementation may need adjustment based on your Supabase schema
        const additionalEmails = [
          contact === contacts[0] ? record.Contact1Email_2 : null,
          contact === contacts[0] ? record.Contact1Email_3 : null,
          contact === contacts[1] ? record.Contact2Email_2 : null,
          contact === contacts[1] ? record.Contact2Email_3 : null,
          contact === contacts[2] ? record.Contact3Email_2 : null,
          contact === contacts[2] ? record.Contact3Email_3 : null,
        ].filter((email): email is string => typeof email === 'string' && email.length > 0);

        for (const email of additionalEmails) {
          // You might need to create a function for contact emails in databaseService.ts
          await supabase.from('contact_emails').insert({
            id: uuidv4(),
            contact_id: createdContact.id,
            email,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }

    } catch (error: unknown) {
      if (global.logHandlers) {
        for (const sendLog of global.logHandlers.values()) {
          sendLog('error', `Error processing lead for ${record.PropertyAddress}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }

  if (global.logHandlers) {
    for (const sendLog of global.logHandlers.values()) {
      sendLog('info', `Finished importing leads from ${leadSource.name}`);
    }
  }
}

export async function processLeadsFile(filePath: string) {
  try {
    await importLeadsFromCSV(filePath);
    console.log('Leads import completed successfully');
  } catch (error) {
    console.error('Error processing leads file:', error);
    throw error;
  }
}