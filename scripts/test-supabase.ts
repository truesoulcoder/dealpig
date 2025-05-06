import { createAdminClient } from '../lib/supabase';

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Create admin client
    const supabase = createAdminClient();
    
    // Test connection by listing tables
    console.log('Listing tables...');
    const { data: tables, error } = await supabase.rpc('get_tables');
    
    if (error) {
      console.error('Error listing tables:', error);
      return;
    }
    
    console.log('Tables in database:');
    console.table(tables);
    
    // Get count of leads and normalized_leads
    console.log('\nCounting records in key tables...');
    
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
      
    const { count: normalizedLeadsCount } = await supabase
      .from('normalized_leads')
      .select('*', { count: 'exact', head: true });
      
    console.log(`Leads count: ${leadsCount || 0}`);
    console.log(`Normalized leads count: ${normalizedLeadsCount || 0}`);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabaseConnection();
