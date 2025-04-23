"use server";

import { cookies } from "next/headers";
import { supabase } from '@/lib/supabaseClient';
import { Lead } from '@/helpers/types';

export const createAuthCookie = async () => {
  const cookieStore = cookies();
  cookieStore.set("userAuth", "myToken", { secure: true });
};

export const deleteAuthCookie = async () => {
  const cookieStore = cookies();
  cookieStore.delete("userAuth");
};

// Fetch all leads from the database
export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase.from('leads').select('*');

  if (error) {
    console.error('Error fetching leads:', error.message);
    throw new Error('Failed to fetch leads');
  }

  return data || [];
}

// Save OAuth tokens to the database
export async function saveToken(email: string, oauthToken: string, refreshToken: string): Promise<void> {
  const { error } = await supabase.from('tokens').insert({
    email,
    oauth_token: oauthToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('Error saving token:', error.message);
    throw new Error('Failed to save token');
  }
}
