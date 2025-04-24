'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import type { AppRouter } from '@/server/trpc/root-router';

// Create tRPC React client
export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  // Create a query client for React Query
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000, // 5 seconds
        refetchOnWindowFocus: false,
      },
    },
  }));
  
  // Create a tRPC client with batch link
  const [trpcClient] = useState(() => 
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          // Optional: headers, fetch implementation, etc.
        }),
      ],
    })
  );

  // Return the provider with the client
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}