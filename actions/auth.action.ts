"use server";

import { cookies } from "next/headers";
import { supabase } from '@/lib/supabaseClient';
import { Lead, LoginFormType } from '@/helpers/types';

export const createAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set("userAuth", "myToken", { secure: true });
};

export const deleteAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("userAuth");
};

// Login user authentication function
export async function loginUser(credentials: LoginFormType) {
  try {
    // In a real app, you would validate against your auth provider
    // For now, just mock success/failure for testing
    
    // This is a mock implementation that would be replaced with actual auth logic
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { success: false, message: 'Invalid credentials' };
    }

    return { success: true, message: 'Login successful' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Unexpected server error' };
  }
}

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
