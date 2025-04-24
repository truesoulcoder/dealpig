import { createClient } from '@supabase/supabase-js';

// Try to get the environment variables from all possible sources
const supabaseUrl = process.env.next_public_supabase_url || process.env.supabase_url;
const supabaseKey = process.env.next_public_supabase_anon_key || process.env.supabase_anon_key || process.env.supabase_service_role_key;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Export as named export too for components that import it as supabaseClient
export const supabaseClient = supabase;

// Add the missing getSupabase function
export function getSupabase() {
  return supabase;
}