// lib/supabase/index.ts

export { default as supabase, createNewClient as createBrowserClient } from './client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Creates a Supabase client with service_role key for admin operations.
 */
export function createAdminClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
