'use server';

import { createAdminClient } from '@/lib/supabase';
import { Database } from '@/helpers/types';
// Server action to handle leads file upload
export async function uploadLeads(formData: FormData) {
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return { success: false, message: 'Invalid file.' };
  }
  const fileName = `${crypto.randomUUID()}_${file.name}`;
  // Upload file to Supabase storage bucket 'lead-imports' using admin client
  const admin = createAdminClient();
  const { error: storageError } = await admin.storage
    .from('lead-imports')
    .upload(fileName, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  if (storageError) {
    return { success: false, message: storageError.message };
  }
  // Record the upload in lead_sources table
  const { error: dbError } = await admin
    .from('lead_sources')
    .insert({ name: fileName, file_name: file.name, record_count: 0, is_active: true });
  if (dbError) {
    return { success: false, message: dbError.message };
  }
  return { success: true };
}