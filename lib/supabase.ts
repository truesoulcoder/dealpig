import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/helpers/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton instance with proper typing
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    // Custom branding for auth UI
    ui: {
      theme: 'dark',
      attributes: {
        provider: {
          google: {
            background: '#10B981',
            iconUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/dealpig.svg`,
            buttonText: 'Continue with Google'
          }
        }
      }
    }
  }
});

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