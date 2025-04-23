import { createClient } from '@supabase/supabase-js';

// Hardcoded values from .env file
const SUPABASE_URL = 'https://arzbdxqpuzgsdwfitkhc.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyemJkeHFwdXpnc2R3Zml0a2hjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTE1Mjg1MywiZXhwIjoyMDYwNzI4ODUzfQ.z-4bcNdsxPljh-PeVNkQe2M8NMxRHIdBHW2rbQGJKBM';

// Gmail OAuth tokens
const MATT_OAUTH_TOKEN = 'ya29.a0AZYkNZjfgTICtSyiLG7DTHPqWDXjXXDZ_AyQII1DKSg00kNdkHSqLyQ66wQjkZNsV9uPo0e0UzfLJxQ7JoOXBF07lTNMxgCgElwcE8LGXlwdb7ugi1whnzmWT4sEQPL873JgKW76ZwuZRpvz8Q_12k8zbXcrHmC5ZkI0vb3xaCgYKAXQSARASFQHGX2MiJAb3wo9h3tWkugPLo-X_UA0175';
const MATT_REFRESH_TOKEN = '1//04zyEqO5bh5JuCgYIARAAGAQSNwF-L9IrOxy2d6YAFBTXrwylbHmF20K6In7dAGsbQ9-Oh8ERlGVl92JvTYdi9MBxuOOAdpgKO0U';
const LAUREN_OAUTH_TOKEN = 'ya29.a0AZYkNZi5lfALi0vEvNqnTtYQ2ry3s_1CRha3HNKrjm--vuySrcGrwIRl28PWNX1eVU29-4lqUNoOhGwFW-J0DMoTGjHFZBEW8gAHcKafOfwegFyruZV3nkPh_uDlg6UXvMygrl9IN1dwh6F_-CEk2JtEjf1U2c8lLNKMzb5LaCgYKASMSARQSFQHGX2MiqDWvGm3aLuLmKHitXDCzdg0175';
const LAUREN_REFRESH_TOKEN = '1//04fWfGpCutOBUCgYIARAAGAQSNwF-L9IrvhCLT0GN6bRdiBsIv1qgceYGYAz5k3OgnLS2zwlpUR7v_hwBhT74RbRlPK4VUC2evZ0';

// Create Supabase client
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Interface for token data
interface TokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

// Function to get the next available ID for a table
async function getNextId(tableName: string): Promise<number> {
  try {
    // Get the highest ID currently in the table
    const { data, error } = await supabase
      .from(tableName)
      .select('id')
      .order('id', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error(`Error getting next ID for ${tableName}:`, error);
      return 1; // Start with 1 if we can't determine the next ID
    }
    
    // Return the next available ID (highest + 1)
    if (data && data.length > 0) {
      return data[0].id + 1;
    }
    
    return 1; // Start with 1 if the table is empty
  } catch (err) {
    console.error(`Error in getNextId for ${tableName}:`, err);
    return 1;
  }
}

// Function to insert a sender if it doesn't exist
async function ensureSenderExists(email: string, name: string, title: string, oauthToken: string, refreshToken: string) {
  try {
    console.log(`Checking if sender ${email} exists...`);
    
    const { data, error: fetchError } = await supabase
      .from('senders')
      .select('*')
      .eq('email', email);
    
    if (fetchError) {
      console.error('Error checking for sender:', fetchError);
      return false;
    }
    
    if (!data || data.length === 0) {
      console.log(`Creating sender record for ${email}...`);
      
      // Get the next available ID
      const nextId = await getNextId('senders');
      console.log(`Using ID ${nextId} for new sender`);
      
      // Insert the sender with numeric ID
      const { error } = await supabase
        .from('senders')
        .insert({
          id: nextId, 
          name,
          email,
          title,
          oauth_token: oauthToken,
          refresh_token: refreshToken,
          emails_sent: 0,
          daily_quota: 100,
          last_sent_at: null
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
    console.log(`Checking if tokens for ${email} exist...`);
    
    // Check if tokens already exist
    const { data, error: fetchError } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('email', email);
    
    if (fetchError) {
      console.error('Error checking for tokens:', fetchError);
      return false;
    }
    
    if (data && data.length > 0) {
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
      
      // Get the next available ID
      const nextId = await getNextId('oauth_tokens');
      console.log(`Using ID ${nextId} for new token record`);
      
      // Insert new tokens with a numeric ID
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
    }
    
    console.log(`Tokens for ${email} saved successfully`);
    return true;
  } catch (error) {
    console.error(`Error processing tokens for ${email}:`, error);
    return false;
  }
}

// Main function to populate tokens
async function populateTokens() {
  console.log('Starting to populate tokens in the database...');
  
  // Matt's tokens
  await ensureSenderExists(
    'matt.jenkins@truesoulpartners.com',
    'Matt Jenkins',
    'Partner',
    MATT_OAUTH_TOKEN,
    MATT_REFRESH_TOKEN
  );
  
  await insertTokens('matt.jenkins@truesoulpartners.com', {
    access_token: MATT_OAUTH_TOKEN,
    refresh_token: MATT_REFRESH_TOKEN,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600000 // Set expiry 1 hour from now
  });
  
  // Lauren's tokens
  await ensureSenderExists(
    'lauren.reed@truesoulpartners.com',
    'Lauren Reed',
    'Partner',
    LAUREN_OAUTH_TOKEN,
    LAUREN_REFRESH_TOKEN
  );
  
  await insertTokens('lauren.reed@truesoulpartners.com', {
    access_token: LAUREN_OAUTH_TOKEN,
    refresh_token: LAUREN_REFRESH_TOKEN,
    scope: 'https://www.googleapis.com/auth/gmail.send',
    token_type: 'Bearer',
    expiry_date: Date.now() + 3600000 // Set expiry 1 hour from now
  });
  
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