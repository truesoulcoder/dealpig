// Simple Supabase Connection Test
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Testing connection with:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key starts with: ${supabaseAnonKey.substring(0, 4)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 4)}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicConnection() {
  try {
    console.log('Running a simple health check query...');
    
    // Try a simple query that checks if we can access public schema
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('✅ Connection successful, but no access to profiles table yet');
        console.log('This is expected if the table has RLS enabled and you have no user logged in');
        return;
      }
      
      console.error('Connection failed with error:');
      console.error(error);
      
      if (error.message.includes('does not exist')) {
        console.log('\nTables might not be created yet. Have you run the setup script?');
      }
    } else {
      console.log('✅ Success! Connected to Supabase and verified access to profiles table');
      console.log(`Found ${data.length} profiles`);
    }
    
    // Try a system table that should be accessible (auth)
    console.log('\nVerifying auth schema access...');
    const { error: authError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (authError) {
      if (authError.message.includes('permission denied')) {
        console.log('✅ Connection successful, auth schema exists but requires service role');
        console.log('This is expected with anon key');
      } else {
        console.error('Error accessing auth schema:');
        console.error(authError);
      }
    } else {
      console.log('✅ Successfully accessed auth schema');
    }
    
  } catch (err) {
    console.error('Fatal error:');
    console.error(err);
  }
}

testBasicConnection();