import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/helpers/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton instance with proper typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Factory function for cases where a new instance is needed
export const createSupabaseClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Create authenticated admin client (for server-side operations)
export const createAdminClient = () => {
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceRoleKey) {
    console.error('Missing Supabase service role key!');
    throw new Error('Missing Supabase service role key');
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    }
  );
};