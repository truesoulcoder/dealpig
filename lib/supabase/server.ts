// lib/supabase/server.ts
import { createServerClient as _createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/helpers/database.types'; // Assuming your generated types are here

// Define a function that creates a Supabase client for Server Components and Route Handlers
export function createServerClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            // Or log the error if it's unexpected in a Route Handler context.
            console.warn(`[SupabaseClient] Failed to set cookie '${name}' from a server context.`, error);
          }
        },
        async remove(name: string, options: CookieOptions) {
          try {
            const cookieStore = await cookies();
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
            // Or log the error if it's unexpected in a Route Handler context.
            console.warn(`[SupabaseClient] Failed to remove cookie '${name}' from a server context.`, error);
          }
        },
      },
    }
  );
}

// Optional: If you need an admin client (uses service role key)
// Be very careful where you use this, as it bypasses RLS.
import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL for admin client');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Ensure this env var is set in your deployment environment ONLY
    // DO NOT commit it to your repository or expose it client-side
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY for admin client');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
