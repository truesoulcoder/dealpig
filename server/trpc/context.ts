import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getSupabase } from '@/lib/supabaseClient';

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async ({ req, res }: CreateNextContextOptions) => {
  // Create your context based on the request object
  // Will be available as `ctx` in all your resolvers
  
  // Get the user session from Supabase (assuming you're using Supabase auth)
  const supabase = getSupabase();

  return {
    req,
    res,
    supabase,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;