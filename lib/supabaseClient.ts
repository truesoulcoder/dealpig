import { createClient } from '@supabase/supabase-js';

// Client-side Supabase initialization - only use the public URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Log availability without exposing actual values
console.log(`Client: Supabase URL available: ${Boolean(supabaseUrl)}`);
console.log(`Client: Supabase anon key available: ${Boolean(supabaseAnonKey)}`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase client environment variables');
  throw new Error('Missing Supabase environment variables');
}

// Create the Supabase client with the anon key (never use service role key on client)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export as named export too for components that import it as supabaseClient
export const supabaseClient = supabase;

// Add the missing getSupabase function
export function getSupabase() {
  return supabase;
}