// This file should only be used on the server
// DO NOT IMPORT THIS IN CLIENT COMPONENTS

import { createClient } from '@supabase/supabase-js';

// This file should only be imported in server-side code
// It provides admin access to Supabase using the service role key

// Validate environment variables
const supabaseUrl = process.env.supabase_url;
const supabaseServiceRoleKey = process.env.supabase_service_role_key;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase admin environment variables');
}

// Create an admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export { supabaseAdmin };