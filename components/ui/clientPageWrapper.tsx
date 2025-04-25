"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// This component allows using client-side hooks like useRouter inside server components
export default function ClientPageWrapper({
  children
}: {
  children: (router: ReturnType<typeof useRouter>) => ReactNode
}) {
  const router = useRouter();
  return <>{children(router)}</>;
}