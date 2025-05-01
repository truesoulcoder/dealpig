import React from 'react';
import LeadUploader from '@/components/leads/LeadUploader';
import { getLeads } from '@/actions/leads.action';
import LeadsTable from '@/components/leads/LeadsTable';

export default async function LeadsPage() {
  const leads = await getLeads();
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Leads</h1>
      <LeadUploader />
      <LeadsTable leads={leads} />
    </div>
  );