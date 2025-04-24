"use client";

import React, { useState, useEffect } from 'react';
import { useMediaQuery } from '@/components/hooks/use-media-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CampaignAnalytics } from './campaign-analytics';
import { CampaignCard } from './campaign-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  status: string;
  stats: any;
  created_at: string;
}

export function MobileCampaignDashboard({ campaigns = [] }: { campaigns: Campaign[] }) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(
    campaigns.length > 0 ? campaigns[0] : null
  );
  
  // Handle screen size changes
  useEffect(() => {
    if (campaigns.length > 0 && !activeCampaign) {
      setActiveCampaign(campaigns[0]);
    }
  }, [campaigns, activeCampaign]);

  // If desktop view, don't use mobile layout
  if (isDesktop) return null;
  
  // If no campaigns, show empty state
  if (campaigns.length === 0) {
    return (
      <Card className="w-full mx-auto my-4 p-6 flex flex-col items-center justify-center">
        <div className="text-center space-y-4">
          <h3 className="text-xl font-semibold">No campaigns yet</h3>
          <p className="text-muted-foreground">Create your first campaign to start reaching out to leads</p>
          <Button asChild>
            <Link href="/campaigns/new">
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Campaign
            </Link>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <ArrowPathIcon className="h-4 w-4" />
          </Button>
          <Button size="sm" asChild>
            <Link href="/campaigns/new">
              <PlusIcon className="h-4 w-4 mr-1" />
              New
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="list">Campaign List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-4">
          <ScrollArea className="h-[50vh]">
            <div className="grid grid-cols-1 gap-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  onClick={() => setActiveCampaign(campaign)}
                  className={`cursor-pointer ${
                    activeCampaign?.id === campaign.id
                      ? 'ring-2 ring-primary'
                      : ''
                  }`}
                >
                  <CampaignCard 
                    campaign={campaign}
                    compact={true}
                  />
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          {activeCampaign ? (
            <>
              <CampaignAnalytics
                stats={{
                  campaign_name: activeCampaign.name,
                  total_emails_sent: activeCampaign.stats?.total_emails_sent || 0,
                  delivered: activeCampaign.stats?.delivered || 0,
                  opened: activeCampaign.stats?.opened || 0,
                  clicked: activeCampaign.stats?.clicked || 0,
                  replied: activeCampaign.stats?.replied || 0,
                  bounced: activeCampaign.stats?.bounced || 0,
                  open_rate: activeCampaign.stats?.open_rate || 0,
                  click_rate: activeCampaign.stats?.click_rate || 0,
                  bounce_rate: activeCampaign.stats?.bounce_rate || 0,
                }}
                isMobile={true}
              />
              
              {/* Bounce Details Section */}
              {activeCampaign.stats?.bounced > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Bounce Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hard bounces:</span>
                        <span className="font-medium">{activeCampaign.stats?.hard_bounces || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Soft bounces:</span>
                        <span className="font-medium">{activeCampaign.stats?.soft_bounces || 0}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="text-xs h-8"
                        >
                          <Link href={`/campaigns/${activeCampaign.id}/bounces`}>
                            View Bounce Report
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => window.alert('Clean list feature will be available soon')}
                        >
                          Clean List
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Select a campaign to view analytics</p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Quick Actions for Selected Campaign */}
      {activeCampaign && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 flex gap-2 shadow-lg">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/campaigns/${activeCampaign.id}`}>
              Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link href={`/campaigns/${activeCampaign.id}/edit`}>
              Edit
            </Link>
          </Button>
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/campaigns/${activeCampaign.id}/send`}>
              Send
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}