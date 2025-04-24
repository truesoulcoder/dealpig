import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/root-router';
import { createContext } from '@/server/trpc/context';

// Create a tRPC API handler for Next.js App Router
export async function GET(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req, res: new Response() }),
  });
}

export async function POST(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext({ req, res: new Response() }),
  });
}