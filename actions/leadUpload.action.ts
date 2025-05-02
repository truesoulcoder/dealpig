'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Papa from 'papaparse';
import { Database } from '@/types/supabase'; // Import generated types

// Helper function to convert header keys to snake_case
const toSnakeCase = (str: string): string => {
  return str
    .replace(/[\s-]+/g, '_') // Replace spaces and hyphens with underscores
    .replace(/([A-Z])/g, (match) => `_${match.toLowerCase()}`) // Convert camelCase to snake_case
    .replace(/^_/, '') // Remove leading underscore if any
    .toLowerCase(); // Ensure everything is lowercase
};

// Define the expected shape of a row after header transformation
// This should align with the columns added in the migration
// 20250502023012_add_all_csv_columns_to_leads.sql
type LeadStagingRow = Database['public']['Tables']['leads']['Insert'];

export async function uploadLeads(formData: FormData) {
  const file = formData.get('leadCsv') as File;

  if (!file) {
    return { success: false, error: 'No file provided.' };
  }

  const supabase = createServerActionClient<Database>({ cookies });

  try {
    const fileContent = await file.text();

    // Parse CSV using papaparse
    const parseResult = Papa.parse<Record<string, any>>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => toSnakeCase(header.trim()), // Transform headers to snake_case
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV Parsing Errors:', parseResult.errors);
      return { success: false, error: 'Failed to parse CSV file.', details: parseResult.errors };
    }

    const leadsData = parseResult.data as LeadStagingRow[];

    if (leadsData.length === 0) {
      return { success: false, error: 'CSV file is empty or contains no valid data.' };
    }

    console.log(`Parsed ${leadsData.length} rows from CSV.`);
    // console.log('Sample transformed row:', leadsData[0]); // Optional: Log first row for verification

    // Insert data into the 'leads' staging table
    const { data, error } = await supabase
      .from('leads')
      .insert(leadsData)
      .select(); // Select to get the inserted data back if needed

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: 'Failed to insert leads into database.', details: error.message };
    }

    console.log(`Successfully inserted ${data?.length ?? 0} leads.`);

    // TODO: Trigger the normalization function after successful insert
    // const { error: rpcError } = await supabase.rpc('normalize_staged_leads');
    // if (rpcError) {
    //   console.error('Error calling normalize_staged_leads:', rpcError);
    //   // Decide how to handle this - maybe return success but with a warning?
    //   return { success: true, warning: 'Leads inserted, but normalization failed.', details: rpcError.message };
    // }
    // console.log('Normalization function triggered successfully.');

    return { success: true, count: data?.length ?? 0 };

  } catch (err) {
    console.error('Error processing file upload:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
    return { success: false, error: 'Failed to process file upload.', details: errorMessage };
  }
}