import { CreateNextContextOptions } from '@trpc/server/adapters/next';
import { getSupabase } from '@/lib/supabaseClient';

/**
 * Context for inner tRPC calls (used in tests and server code)
 */
export const createInnerTRPCContext = async (opts: { 
  req: Request | Record<string, unknown>; 
  res: Response | Record<string, unknown>;
}) => {
  // Create your context based on the request object
  const supabase = getSupabase();
  
  return {
    req: opts.req,
    res: opts.res,
    supabase,
  };
};

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = async (opts: CreateNextContextOptions) => {
  // Reuse the inner context logic for the outer context
  return createInnerTRPCContext({
    req: opts.req,
    res: opts.res
  });
};

export type Context = Awaited<ReturnType<typeof createContext>>;