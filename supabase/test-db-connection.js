// Database Connection Test Script
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Display URL (but mask credentials)
console.log('🔑 Environment Check:');
console.log(`Supabase URL: ${supabaseUrl ? '✅ Found' : '❌ Missing'}`);
console.log(`Anon Key: ${supabaseAnonKey ? '✅ Found (masked)' : '❌ Missing'}`);
console.log(`Service Role Key: ${supabaseServiceRoleKey ? '✅ Found (masked)' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function testDatabaseConnection() {
  console.log('\n🔍 Testing Supabase database connection...');
  
  try {
    // Test anonymous client connection
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log('\nTesting anonymous client connection...');
    
    const { data: anonData, error: anonError } = await anonClient.from('lead_sources').select('count').single();
    
    if (anonError) {
      console.log(`❌ Anonymous client - ERROR: ${anonError.message}`);
    } else {
      console.log('✅ Anonymous client - CONNECTED');
    }

    // Test admin client connection if service role key is available
    if (supabaseServiceRoleKey) {
      console.log('\nTesting admin client connection...');
      const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Test database access
      const { data: adminData, error: adminError } = await adminClient.from('lead_sources').select('count').single();
      
      if (adminError) {
        console.log(`❌ Admin client database access - ERROR: ${adminError.message}`);
      } else {
        console.log('✅ Admin client database access - CONNECTED');
      }

      // Test storage access
      console.log('\nTesting storage access...');
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

      // Test table access
      console.log('\nTesting table access...');
      const tables = ['leads', 'lead_sources', 'contacts', 'campaigns', 'campaign_leads'];
      
      for (const table of tables) {
        const { error: tableError } = await adminClient.from(table).select('count').single();
        if (tableError) {
          console.log(`❌ Table "${table}" access - ERROR: ${tableError.message}`);
        } else {
          console.log(`✅ Table "${table}" access - CONNECTED`);
        }
      }
    } else {
      console.log('\n⚠️ Skipping admin client tests - SUPABASE_SERVICE_ROLE_KEY not provided');
    }
    
    console.log('\n✨ Database connection tests complete!');
    
  } catch (error) {
    console.error('\n❌ ERROR testing database connection:');
    console.error(error);
    console.log('\nPossible issues:');
    console.log('1. Invalid Supabase URL or API keys');
    console.log('2. Network connectivity issues');
    console.log('3. Supabase project is not running or accessible');
    console.log('4. RLS policies might be blocking access');
    process.exit(1);
  }
}

// Run the tests
testDatabaseConnection();