import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single instance of the Supabase client
const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Export the single instance
export default supabase;

// Optional: Keep the factory function if needed elsewhere, but rename it
export const createNewClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};