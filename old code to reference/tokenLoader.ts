import supabase from '../lib/supabase';
import { SENDERS } from '../config/environment';

interface TokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

/**
 * Load tokens for the specified email, prioritizing database storage
 * @param email Email address of the sender
 * @returns Token data or null if not found
 */
export async function loadTokensForEmail(email: string): Promise<TokenData | null> {
  try {
    // First attempt to fetch tokens from Supabase
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('email', email)
      .single();
    
    if (!error && data) {
      console.log(`Retrieved tokens for ${email} from database`);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        scope: data.scope,
        token_type: data.token_type,
        expiry_date: data.expiry_date,
      };
    }
    
    // As fallback, check sender configurations for predefined senders
    // This helps during development or if database is not yet populated
    for (const sender of SENDERS) {
      if (sender.email === email && sender.oauthToken) {
        console.log(`Using configuration tokens for ${email}`);
        return {
          access_token: sender.oauthToken,
          refresh_token: sender.refreshToken,
          scope: 'https://www.googleapis.com/auth/gmail.send',
          token_type: 'Bearer',
          expiry_date: Date.now() + 3600000, // Set expiry 1 hour from now
        };
      }
    }
    
    console.error(`No tokens found for ${email} in database or configuration`);
    return null;
  } catch (error) {
    console.error(`Error loading tokens for ${email}:`, error);
    return null;
  }
}

/**
 * Save tokens for the specified email to database
 * @param email Email address of the sender
 * @param tokens Token data to save
 */
export async function saveTokensForEmail(email: string, tokens: TokenData): Promise<void> {
  try {
    // Check if tokens already exist for this email
    const { data } = await supabase
      .from('oauth_tokens')
      .select('id')
      .eq('email', email)
      .single();
    
    if (data) {
      // Update existing tokens
      await supabase
        .from('oauth_tokens')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date,
          updated_at: new Date()
        })
        .eq('email', email);
    } else {
      // Insert new tokens
      await supabase
        .from('oauth_tokens')
        .insert({
          email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date
        });
    }
    
    // Update sender authentication status
    await supabase
      .from('senders')
      .update({
        is_authenticated: true,
        last_authenticated_at: new Date()
      })
      .eq('email', email);
      
    console.log(`Tokens saved successfully for ${email}`);
  } catch (error) {
    console.error(`Error saving tokens for ${email}:`, error);
    throw error;
  }
}