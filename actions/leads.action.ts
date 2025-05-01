'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Lead } from '@/helpers/types';

// Fetch all leads from Supabase
export async function getLeads(): Promise<Lead[]> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const all = await cookies();
          return all.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // implement cookie set if needed
        },
        remove(name: string, options: any) {
          // implement cookie removal if needed
        },
      },
    }
  );
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
  return data || [];
}
