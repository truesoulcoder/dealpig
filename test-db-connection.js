// Database Connection Test Script
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Display URL (but mask credentials)
console.log('🔑 Environment Check:');
console.log(`Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`Anon Key: ${supabaseAnonKey ? '✅ Found (masked)' : '❌ Missing'}`);
console.log(`Service Role Key: ${supabaseServiceRoleKey ? '✅ Found (masked)' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ ERROR: Missing required Supabase environment variables!');
  console.log(`
Create a .env file in your project root with:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  `);
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Create admin client with service role for privileged operations
const adminClient = createClient(
  supabaseUrl,
  supabaseServiceRoleKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Supabase database connection...');
  
  try {
    // Test 1: Basic connection check
    console.log('Attempting connection...');
    const { data, error: connectionError } = await supabase.from('profiles').select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error(`❌ Connection failed: ${connectionError.message}`);
      console.error('Details:', connectionError);
      return;
    }
    
    console.log('✅ Connection test successful!');

    // Test 2: Check if tables created in setup script exist
    const tables = [
      'profiles', 'leads', 'contacts', 'lead_sources', 
      'senders', 'templates', 'campaigns', 
      'campaign_senders', 'campaign_leads', 'emails'
    ];
    
    console.log('\n📋 Checking tables...');
    
    for (const table of tables) {
      console.log(`Checking table "${table}"...`);
      const { error } = await supabase.from(table).select('count(*)', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table "${table}" - MISSING OR ERROR: ${error.message}`);
      } else {
        console.log(`✅ Table "${table}" - EXISTS`);
      }
    }
    
    // Test 3: Check if functions exist (using service role)
    console.log('\n🔧 Checking functions...');
    
    if (!supabaseServiceRoleKey) {
      console.log('⚠️ Skipping function test - SUPABASE_SERVICE_ROLE_KEY not provided');
    } else {
      console.log('Testing function "get_table_columns"...');
      const { data: functions, error: functionsError } = await adminClient.rpc('get_table_columns');
      
      if (functionsError) {
        console.log(`❌ Function "get_table_columns" - ERROR: ${functionsError.message}`);
      } else {
        console.log('✅ Function "get_table_columns" - EXISTS');
      }
    }
    
    // Test 4: Check storage buckets
    console.log('\n📁 Checking storage buckets...');
    
    if (!supabaseServiceRoleKey) {
      console.log('⚠️ Skipping storage test - SUPABASE_SERVICE_ROLE_KEY not provided');
    } else {
      console.log('Listing storage buckets...');
      const { data: buckets, error: bucketsError } = await adminClient.storage.listBuckets();
      
      if (bucketsError) {
        console.log(`❌ Storage access - ERROR: ${bucketsError.message}`);
      } else {
        const expectedBuckets = ['lead-imports', 'templates', 'generated-documents'];
        const foundBuckets = buckets.map(b => b.name);
        
        for (const bucket of expectedBuckets) {
          if (foundBuckets.includes(bucket)) {
            console.log(`✅ Bucket "${bucket}" - EXISTS`);
          } else {
            console.log(`❌ Bucket "${bucket}" - MISSING`);
          }
        }
      }
    }
    
    console.log('\n✨ Database connection tests complete!');
    
  } catch (error) {
    console.error('\n❌ ERROR testing database connection:');
    console.error(error);
    console.log('\nPossible issues:');
    console.log('1. Invalid Supabase URL or API keys');
    console.log('2. Network connectivity issues');
    console.log('3. Supabase project is not running or accessible');
  }
}

// Run the tests
testDatabaseConnection();