'use server';

import { createAdminClient } from '@/lib/supabase';
import { Database } from '@/helpers/types';
// Server action to handle leads file upload
export async function uploadLeads(formData: FormData) {
  console.log('[uploadLeads] server action called');
  const file = formData.get('file');
  console.log('[uploadLeads] formData file entry:', file);
  if (!(file instanceof File)) {
    return { success: false, message: 'Invalid file.' };
  }
  const fileName = `${crypto.randomUUID()}_${file.name}`;
  console.log('[uploadLeads] generated fileName:', fileName);
  // Upload file to Supabase storage bucket 'lead-imports' using admin client
  const admin = createAdminClient();
  const { error: storageError } = await admin.storage
    .from('lead-imports')
    .upload(fileName, file, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });
  console.log('[uploadLeads] upload returned error:', storageError);
  if (storageError) {
    return { success: false, message: storageError.message };
  }
  console.log('[uploadLeads] storage upload succeeded');
  // Record the upload in lead_sources table
  const { error: dbError } = await admin
    .from('lead_sources')
    .insert({ name: fileName, file_name: file.name, record_count: 0, is_active: true });
  console.log('[uploadLeads] db insert returned error:', dbError);
  if (dbError) {
    return { success: false, message: dbError.message };
  }
  console.log('[uploadLeads] lead_sources insert succeeded');
  return { success: true };
}