import supabase from '../lib/supabase';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables directly from the .env file
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

// Interface for token data
interface TokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// Function to insert a sender if it doesn't exist
async function ensureSenderExists(email: string, name: string, title: string) {
  try {
    const { data, error: fetchError } = await supabase
      .from('senders')
      .select('*')
      .eq('email', email)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for sender:', fetchError);
      return false;
    }
    
    if (!data) {
      console.log(`Creating sender record for ${email}...`);
      
      const oauthToken = email.includes('matt') ? envConfig.MATT_OAUTH_TOKEN : envConfig.LAUREN_OAUTH_TOKEN;
      const refreshToken = email.includes('matt') ? envConfig.MATT_REFRESH_TOKEN : envConfig.LAUREN_REFRESH_TOKEN;
      
      // Insert the sender
      const { error } = await supabase
        .from('senders')
        .insert({
          name,
          email,
          title,
          oauth_token: oauthToken,
          refresh_token: refreshToken,
          emails_sent: 0,
          daily_quota: 100,
          is_authenticated: true,
          last_authenticated_at: new Date()
        });
      
      if (error) {
        console.error('Error creating sender:', error);
        return false;
      }
      
      console.log(`Sender ${email} created successfully`);
      return true;
    }
    
    console.log(`Sender ${email} already exists`);
    return true;
  } catch (err) {
    console.error('Unexpected error in ensureSenderExists:', err);
    return false;
  }
}

// Function to insert tokens for an email
async function insertTokens(email: string, tokens: TokenData) {
  try {
    // Check if tokens already exist
    const { data, error: fetchError } = await supabase
      .from('oauth_tokens')
      .select('id')
      .eq('email', email)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error checking for tokens:', fetchError);
      return false;
    }
    
    if (data) {
      console.log(`Updating tokens for ${email}...`);
      
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
    } else {
      console.log(`Inserting tokens for ${email}...`);
      
      // Insert new tokens
      const { error } = await supabase
        .from('oauth_tokens')
        .insert({
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
    }
    
    console.log(`Tokens for ${email} saved successfully`);
    return true;
  } catch (error) {
    console.error(`Error processing tokens for ${email}:`, error);
    return false;
  }
}

// Set up Supabase client directly
const supabaseClient = createSupabaseClient();

// Create Supabase client directly from env variables
function createSupabaseClient() {
  const { createClient } = require('@supabase/supabase-js');
  
  return createClient(
    envConfig.SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}

// Main function to populate tokens
async function populateTokens() {
  console.log('Starting to populate tokens in the database...');
  
  // Matt's tokens
  const mattOauthToken = envConfig.MATT_OAUTH_TOKEN;
  const mattRefreshToken = envConfig.MATT_REFRESH_TOKEN;
  
  if (mattOauthToken && mattRefreshToken) {
    await ensureSenderExists(
      'matt.jenkins@truesoulpartners.com',
      'Matt Jenkins',
      'Partner'
    );
    
    await insertTokens('matt.jenkins@truesoulpartners.com', {
      access_token: mattOauthToken,
      refresh_token: mattRefreshToken,
      scope: 'https://www.googleapis.com/auth/gmail.send',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000 // Set expiry 1 hour from now
    });
  } else {
    console.error('Matt tokens not found in .env file');
  }
  
  // Lauren's tokens
  const laurenOauthToken = envConfig.LAUREN_OAUTH_TOKEN;
  const laurenRefreshToken = envConfig.LAUREN_REFRESH_TOKEN;
  
  if (laurenOauthToken && laurenRefreshToken) {
    await ensureSenderExists(
      'lauren.reed@truesoulpartners.com',
      'Lauren Reed',
      'Partner'
    );
    
    await insertTokens('lauren.reed@truesoulpartners.com', {
      access_token: laurenOauthToken,
      refresh_token: laurenRefreshToken,
      scope: 'https://www.googleapis.com/auth/gmail.send',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000 // Set expiry 1 hour from now
    });
  } else {
    console.error('Lauren tokens not found in .env file');
  }
  
  console.log('Token population completed');
}

// Run the population function
populateTokens()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });