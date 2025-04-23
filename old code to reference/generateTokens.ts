/**
 * Generate Fresh OAuth Tokens Script
 * 
 * This script generates a URL for OAuth authorization with Gmail
 * and then helps you save the resulting tokens to the database.
 * 
 * Usage: npx ts-node src/scripts/generateTokens.ts
 */
import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import * as readline from 'readline';

// Hardcoded values (replace with your actual values from .env if different)
const SUPABASE_URL = 'https://arzbdxqpuzgsdwfitkhc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJkeHFwdXpnc2R3Zml0a2hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE1Mjg1MywiZXhwIjoyMDYwNzI4ODUzfQ.z-4bcNdsxPljh-PeVNkQe2M8NMxRHIdBHW2rbQGJKBM';

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Interface for token data
interface TokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// Prompt for user input
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Save tokens to database
async function saveTokensToDB(email: string, tokens: TokenData): Promise<boolean> {
  try {
    console.log(`Saving tokens for ${email} to database...`);
    
    // Check if tokens already exist for this email
    const { data, error: fetchError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('email', email);
    
    if (fetchError) {
      console.error('Error checking for tokens:', fetchError);
      return false;
    }
    
    if (data && data.length > 0) {
      // Update existing tokens
      const { error } = await supabase
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
      
      if (error) {
        console.error('Error updating tokens:', error);
        return false;
      }
      
      console.log('Existing tokens updated successfully');
    } else {
      // Get the next available ID
      const { data: maxIdData } = await supabase
        .from('oauth_tokens')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);
      
      const nextId = maxIdData && maxIdData.length > 0 ? maxIdData[0].id + 1 : 1;
      
      // Insert new tokens
      const { error } = await supabase
        .from('oauth_tokens')
        .insert({
          id: nextId,
          email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          expiry_date: tokens.expiry_date
        });
      
      if (error) {
        console.error('Error inserting tokens:', error);
        return false;
      }
      
      console.log('New tokens inserted successfully');
    }
    
    // Also update the sender record if it exists
    const { data: senderData } = await supabase
      .from('senders')
      .select('*')
      .eq('email', email);
    
    if (senderData && senderData.length > 0) {
      await supabase
        .from('senders')
        .update({
          oauth_token: tokens.access_token,
          refresh_token: tokens.refresh_token
        })
        .eq('email', email);
      
      console.log('Sender record updated with new tokens');
    }
    
    return true;
  } catch (error) {
    console.error('Error saving tokens:', error);
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('=== Gmail OAuth Token Generator ===\n');
    
    // Get client ID and secret
    const clientId = await prompt('Enter your Google Client ID: ');
    const clientSecret = await prompt('Enter your Google Client Secret: ');
    const redirectUri = await prompt('Enter your redirect URI (default: http://localhost:3000/api/oauth/callback): ') || 
      'http://localhost:3000/api/oauth/callback';
    const email = await prompt('Enter the email address to generate tokens for: ');
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    // Generate URL for consent
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.send'],
      prompt: 'consent'
    });
    
    console.log('\n1. Open this URL in your browser to authorize access:');
    console.log('\x1b[36m%s\x1b[0m', authUrl); // Cyan colored URL
    console.log('\n2. After authorization, you will be redirected to your redirect URI with a "code" parameter.');
    
    const code = await prompt('\n3. Enter the authorization code from the URL: ');
    
    // Get tokens using the authorization code
    const { tokens } = await oauth2Client.getToken(code);
    
    console.log('\nOAuth tokens received successfully!');
    
    const tokenData: TokenData = {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token!,
      scope: tokens.scope!,
      token_type: tokens.token_type!,
      expiry_date: tokens.expiry_date!
    };
    
    // Save tokens to database
    const success = await saveTokensToDB(email, tokenData);
    
    if (success) {
      console.log('\n✅ Tokens saved successfully to the database!');
      console.log(`Email: ${email}`);
      console.log(`Access Token: ${tokenData.access_token.substring(0, 10)}...`);
      console.log(`Refresh Token: ${tokenData.refresh_token.substring(0, 10)}...`);
      console.log(`Expiry Date: ${new Date(tokenData.expiry_date).toLocaleString()}`);
    } else {
      console.error('\n❌ Failed to save tokens to the database.');
    }
  } catch (error) {
    console.error('Error generating tokens:');
    console.error(error);
  } finally {
    rl.close();
  }
}

main();