// Database Connection Test Script
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Missing required Supabase environment variables!');
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
  console.log('🔍 Testing Supabase database connection...');
  
  try {
    // Test 1: Basic connection check
    const { data: connectionTest, error: connectionError } = await supabase.from('profiles').select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) throw connectionError;
    console.log('✅ Connection test successful!');

    // Test 2: Check if tables created in setup script exist
    const tables = [
      'profiles', 'leads', 'contacts', 'lead_sources', 
      'senders', 'templates', 'campaigns', 
      'campaign_senders', 'campaign_leads', 'emails'
    ];
    
    console.log('\n📋 Checking tables...');
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count(*)', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Table "${table}" - MISSING OR ERROR: ${error.message}`);
      } else {
        console.log(`✅ Table "${table}" - EXISTS`);
      }
    }
    
    // Test 3: Check if functions exist (using service role)
    console.log('\n🔧 Checking functions...');
    const { data: functions, error: functionsError } = await adminClient.rpc('get_table_columns');
    
    if (functionsError) {
      console.log(`❌ Function "get_table_columns" - ERROR: ${functionsError.message}`);
    } else {
      console.log('✅ Function "get_table_columns" - EXISTS');
    }
    
    // Test 4: Check storage buckets
    console.log('\n📁 Checking storage buckets...');
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
    
    console.log('\n✨ Database connection tests complete!');
    
  } catch (error: any) {
    console.error('❌ ERROR testing database connection:', error.message || error);
  }
}

// Run the tests
testDatabaseConnection();