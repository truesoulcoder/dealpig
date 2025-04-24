import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { Context } from './context';

export const t = initTRPC.context<Context>().create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Create a middleware for protected routes that require authentication
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  const session = await ctx.supabase.auth.getSession();
  
  if (!session?.data.session) {
    throw new Error('Not authenticated');
  }
  
  return next({
    ctx: {
      ...ctx,
      // Add user information to the context
      user: session.data.session.user,
    },
  });
});

// Protected procedure - only accessible to authenticated users
export const protectedProcedure = t.procedure.use(isAuthenticated);