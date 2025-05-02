const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFunction() {
  console.log('Testing the list_dynamic_lead_tables function...');
  
  // Call the RPC function
  const { data, error } = await supabase.rpc('list_dynamic_lead_tables');
  
  if (error) {
    console.error('Error calling function:', error);
  } else {
    console.log('Function returned:', data);
  }
}

checkFunction();