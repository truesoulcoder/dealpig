'use server';

import { createAdminClient } from '@/lib/supabase';
import { Sender } from '@/helpers/types';

// Fetch all senders from Supabase
export async function getSenders(): Promise<Sender[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('senders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching senders:', error);
    throw error;
  }
  return data || [];
}

// Update a sender record (e.g. to modify title, quota, etc.)
export async function updateSender(updated: Partial<Sender> & { id: string }): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('senders')
    .update({
      name: updated.name,
      email: updated.email,
      title: updated.title,
      daily_quota: updated.daily_quota,
      oauth_token: updated.oauth_token,
      refresh_token: updated.refresh_token,
      updated_at: new Date().toISOString(),
    })
    .eq('id', updated.id);
  if (error) {
    console.error('Error updating sender:', error);
    throw error;
  }
}

// Delete a sender by ID
export async function deleteSender(senderId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from('senders')
    .delete()
    .eq('id', senderId);
  if (error) {
    console.error('Error deleting sender:', error);
    throw error;
  }
}