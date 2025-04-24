"use client";

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Import the CampaignDashboard dynamically with client-side only rendering
// This helps avoid issues with server-side rendering of components that 
// use browser-specific APIs or libraries like Recharts
const CampaignDashboard = dynamic(
  () => import('@/components/home/campaign-dashboard'),
  { ssr: false }
);

// Loading state for when the component is being dynamically loaded
const DashboardLoading = () => (
  <div className="p-4 flex justify-center items-center h-[80vh]">
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="mt-4 text-gray-500">Loading dashboard...</p>
    </div>
  </div>
);

export default function DashboardPage() {
  return (
    <div className="p-4">
      <Suspense fallback={<DashboardLoading />}>
        <CampaignDashboard />
      </Suspense>
    </div>
  );
}
