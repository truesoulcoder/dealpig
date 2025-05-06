'use server';

import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { NormalizedLead } from '@/helpers/types'; // Use the new type

// Fetch all leads from the normalized_leads table
export async function getNormalizedLeads(): Promise<NormalizedLead[]> {
  const cookieStore = await cookies(); // Capture cookies outside the async get function
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // set/remove are not strictly needed for read-only operations here
        // set(name: string, value: string, options: any) {
        //   cookieStore.set(name, value, options);
        // },
        // remove(name: string, options: any) {
        //   cookieStore.delete(name, options);
        // },
      },
    }
  );

  // Fetch from 'normalized_leads' table
  const { data, error } = await supabase
    .from('normalized_leads') // Changed from 'leads'
    .select('*')
    .order('created_at', { ascending: false }); // Assuming created_at exists

  if (error) {
    console.error('Error fetching normalized leads:', error);
    // Consider how to handle errors - throw, return empty, etc.
    // Check RLS policies if data is unexpectedly empty
    throw error;
  }
  return data || [];
}

// Fetch all archived/normal tables (with prefix 'normal_')
export async function getNormalizedTables(): Promise<string[]> {
  const admin = createAdminClient();
  // Use RPC to list all tables, then filter for 'normal_' prefix
  const { data, error } = await admin.rpc('list_dynamic_lead_tables');
  if (error) {
    console.error('RPC list_dynamic_lead_tables failed:', error);
    return [];
  }
  // Rpc returns [{ table_name: string }]
  return (data || [])
    .map((row: any) => row.table_name)
    .filter((name: string) => name.startsWith('normal_'));
}
