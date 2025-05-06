import React from 'react';
import { CampaignsTable } from '@/components/campaigns/CampaignsTable'; // Ensure path is correct

export default function CampaignsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h3 className="text-lg font-medium">Campaign Management</h3>
        <p className="text-sm text-muted-foreground">
          Create, manage, and monitor your email outreach campaigns.
        </p>
      </div>
      <hr />
      <CampaignsTable />
    </div>
  );
}