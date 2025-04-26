"use server";

import { cookies } from "next/headers";
import { supabase } from '@/lib/supabaseClient';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Lead, LoginFormType } from '@/helpers/types';

export const createAuthCookie = async (session: any) => {
  if (!session || !session.access_token) {
    throw new Error("No valid session provided for authentication");
  }
  
  const cookieStore = await cookies();
  cookieStore.set("userAuth", session.access_token, { 
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    maxAge: session.expires_in || 3600 // Use session expiry or default to 1 hour
  });
};

export const deleteAuthCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete("userAuth");
};

// Login user authentication function
export async function loginUser(credentials: LoginFormType) {
  try {
    // Using supabase client for auth operations 
    // (we don't need admin privileges for this)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return { success: false, message: 'Invalid credentials' };
    }

    // If login is successful, create the auth cookie
    await createAuthCookie(data.session);

    return { success: true, message: 'Login successful', user: data.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Unexpected server error' };
  }
}

// Fetch all leads from the database using admin client
export async function fetchLeads(): Promise<Lead[]> {
  // Using supabaseAdmin for database queries in server actions
  const { data, error } = await supabaseAdmin.from('leads').select('*');

  if (error) {
    console.error('Error fetching leads:', error.message);
    throw new Error('Failed to fetch leads');
  }

  return data || [];
}

// Save OAuth tokens to the database using admin client
export async function saveToken(email: string, oauthToken: string, refreshToken: string): Promise<void> {
  // Using supabaseAdmin for database operations in server actions
  const { error } = await supabaseAdmin.from('tokens').insert({
    email,
    oauth_token: oauthToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('Error saving token:', error.message);
    throw new Error('Failed to save token');
  }
}

// Add a new user registration function
export async function registerUser(email: string, password: string, name: string) {
  try {
    console.log("Starting user registration process for:", email);
    
    // Use supabaseAdmin for creating users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email for now
      user_metadata: { full_name: name }
    });

    if (userError) {
      console.error("User creation error:", userError);
      return { success: false, message: userError.message };
    }

    console.log("User created successfully, creating profile");
    
    // Skip creating profile record for now as it might be causing the RLS issue
    // The auth hooks will handle this automatically on the first login
    
    return { success: true, message: 'User registered successfully', userId: userData.user.id };
  } catch (error) {
    console.error('Registration error:', error);
    return { success: false, message: 'Unexpected server error during registration' };
  }
}

// Generate OAuth URL for Gmail access
export async function getGmailAuthUrl(senderId: string): Promise<string> {
  // OAuth 2.0 configuration
  const clientId = process.env.GMAIL_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`;
  const scope = 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.profile';
  
  // Store the sender ID in the state parameter for retrieval after authorization
  const state = Buffer.from(JSON.stringify({ senderId })).toString('base64');
  
  // Generate and return the authorization URL
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;
  
  return authUrl;
}

// Save Gmail OAuth tokens and profile info for a sender
export async function saveGmailCredentials(
  senderId: string, 
  accessToken: string, 
  refreshToken: string,
  profileData: { email: string; picture?: string; name?: string }
): Promise<void> {
  try {
    // Update the sender with OAuth tokens and profile info
    const { error } = await supabaseAdmin
      .from('senders')
      .update({
        oauth_token: accessToken,
        refresh_token: refreshToken,
        profile_picture: profileData.picture || null,
        last_token_refresh: new Date().toISOString()
      })
      .eq('id', senderId);

    if (error) {
      console.error('Error saving Gmail credentials:', error);
      throw new Error('Failed to save Gmail credentials');
    }
  } catch (error) {
    console.error('Save Gmail credentials error:', error);
    throw error;
  }
}
