'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { normalizeLeads } from './leadIngestion.action';

export async function uploadLeads(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) throw new Error('No file provided');

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

  // Upload CSV to Supabase Storage
  const bucket = 'lead-uploads';
  const timestamp = Date.now();
  const storagePath = `${timestamp}_${file.name}`;
  const { error: uploadError } = await supabase
    .storage
    .from(bucket)
    .upload(storagePath, file);
  if (uploadError) throw uploadError;

  // Record lead source
  const { data: source, error: sourceError } = await supabase
    .from('lead_sources')
    .insert({ name: file.name, file_name: file.name, storage_path: storagePath })
    .select('id')
    .single();
  if (sourceError) throw sourceError;

  // Normalize and insert leads
  const { count } = await normalizeLeads(formData);

  // Update lead source record with import details
  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('lead_sources')
    .update({ record_count: count, last_imported: now })
    .eq('id', source.id);
  if (updateError) throw updateError;

  return { count };
}
