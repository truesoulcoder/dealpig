import { createClient } from '@supabase/supabase-js';

// Try to get the environment variables from all possible sources
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

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