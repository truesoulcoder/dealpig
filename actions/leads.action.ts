'use server';

import { supabase } from '@/lib/supabase';
import { Database } from '@/helpers/types';

// Server action to handle leads file upload
export async function uploadLeads(formData: FormData) {
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, message: 'Invalid file.' };
  }
  const fileName = `${crypto.randomUUID()}_${file.name}`;
  // Upload file to Supabase storage bucket 'leads'
  const { error: storageError } = await supabase.storage
    .from('lead-imports')
    .upload(fileName, file);
  if (storageError) {
    return { success: false, message: storageError.message };
  }
  // Record the upload in lead_sources table
  const { error: dbError } = await supabase
    .from('lead_sources')
    .insert({ name: fileName, file_name: file.name, record_count: 0, is_active: true });
  if (dbError) {
    return { success: false, message: dbError.message };
  }
  return { success: true };
}