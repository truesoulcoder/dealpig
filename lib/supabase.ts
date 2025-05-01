// Single Supabase client file for both browser and admin usage
import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Browser Supabase client for public operations
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin Supabase client with service role key for elevated operations
 */
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}

export default supabase;