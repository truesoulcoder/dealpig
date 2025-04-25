"use client";

import dynamic from 'next/dynamic';

// Create client-side-only components with ssr: false
export const ImportButton = dynamic(() => import('./importButton'), { ssr: false });
export const LeadsTableClient = dynamic(() => import('@/components/table/leadsTable'), { ssr: false });