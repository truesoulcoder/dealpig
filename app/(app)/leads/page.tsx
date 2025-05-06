'use client';

export const dynamic = 'force-dynamic';

import LeadsPageInner from '@/components/leads/LeadsPageInner';

export default function LeadsPage() {
  // All state management, data fetching, and core component rendering
  // are now delegated to LeadsPageInner
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Leads Management Dashboard</h1>
      <LeadsPageInner />
    </div>
  );
}
