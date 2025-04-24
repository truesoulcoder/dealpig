"use client";

import React from 'react';
import { Card, CardBody, CardHeader } from "@heroui/react";

interface CampaignAnalyticsProps {
  campaigns: any[];
}

export default function CampaignAnalytics({ campaigns }: CampaignAnalyticsProps) {
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No campaign data available for analytics.</p>
      </div>
    );
  }

  // For now, just showing a basic placeholder since the full implementation
  // would require recharts and other dependencies
  return (
    <div className="grid grid-cols-1 gap-4">
      {campaigns.map(campaign => (
        <Card key={campaign.id} className="shadow-sm">
          <CardHeader>
            <h3 className="text-lg font-medium">{campaign.name}</h3>
          </CardHeader>
          <CardBody>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Total Leads</p>
                <p className="font-medium">{campaign.total_leads || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Leads Worked</p>
                <p className="font-medium">{campaign.leads_worked || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="font-medium">
                  {campaign.total_leads 
                    ? Math.round((campaign.leads_worked / campaign.total_leads) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}