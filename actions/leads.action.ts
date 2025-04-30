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

// Fetch all leads or only for a given source
export async function getLeads(sourceId?: string) {
  const admin = createAdminClient();
  let query = admin.from('leads').select('*');
  if (sourceId) {
    query = query.eq('source_id', sourceId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Update an existing lead by ID
export async function updateLead(lead: Partial<Database['public']['Tables']['leads']['Row']> & { id: string }): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('leads')
    .update({
      property_address: lead.property_address,
      property_city: lead.property_city,
      property_state: lead.property_state,
      property_zip: lead.property_zip,
      owner_name: lead.owner_name,
      mailing_address: lead.mailing_address,
      mailing_city: lead.mailing_city,
      mailing_state: lead.mailing_state,
      mailing_zip: lead.mailing_zip,
      wholesale_value: lead.wholesale_value,
      market_value: lead.market_value,
      days_on_market: lead.days_on_market,
      mls_status: lead.mls_status,
      mls_list_date: lead.mls_list_date,
      mls_list_price: lead.mls_list_price,
      status: lead.status,
      owner_type: lead.owner_type,
      property_type: lead.property_type,
      beds: lead.beds,
      baths: lead.baths,
      square_footage: lead.square_footage,
      year_built: lead.year_built,
      assessed_total: lead.assessed_total,
      last_contacted_at: lead.last_contacted_at,
      notes: lead.notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', lead.id);
  if (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
}

// Delete a lead by ID
export async function deleteLead(leadId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('leads')
    .delete()
    .eq('id', leadId);
  if (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}