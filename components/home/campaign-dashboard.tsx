"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Tabs, Tab } from "@heroui/react";
import { FaPlus, FaEnvelope, FaFileAlt, FaUpload, FaUser } from "react-icons/fa";
import { getCampaigns, Campaign, getCampaignStatsByDate } from '@/lib/database';
import { useRouter } from 'next/navigation';
import CampaignCard from './campaign-card';
import CampaignAnalytics from './campaign-analytics';
import SaveTokenForm from '@/components/auth/saveTokenForm';

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignStats, setCampaignStats] = useState<any>({
    totalSent: 0,
    totalOpened: 0,
    totalReplied: 0,
    totalBounced: 0
  });
  const router = useRouter();
  
  // Fetch campaigns and stats
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allCampaigns = await getCampaigns();
        setCampaigns(allCampaigns);
        
        // Filter active campaigns
        const active = allCampaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED');
        setActiveCampaigns(active);
        
        // Get campaign stats for the last 30 days
        if (active.length > 0) {
          const today = new Date();
          const thirtyDaysAgo = new Date(today);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          let totalSent = 0;
          let totalOpened = 0;
          let totalReplied = 0;
          let totalBounced = 0;
          
          for (const campaign of active) {
            if (!campaign.id) continue;
            
            const stats = await getCampaignStatsByDate(
              campaign.id,
              thirtyDaysAgo.toISOString().split('T')[0],
              today.toISOString().split('T')[0]
            );
            
            for (const stat of stats) {
              totalSent += stat.total_sent;
              totalOpened += stat.total_opened;
              totalReplied += stat.total_replied;
              totalBounced += stat.total_bounced;
            }
          }
          
          setCampaignStats({
            totalSent,
            totalOpened,
            totalReplied,
            totalBounced
          });
        }
      } catch (error) {
        console.error('Error loading campaign data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Calculate KPIs
  const openRate = campaignStats.totalSent > 0 
    ? Math.round((campaignStats.totalOpened / campaignStats.totalSent) * 100) 
    : 0;
    
  const replyRate = campaignStats.totalSent > 0 
    ? Math.round((campaignStats.totalReplied / campaignStats.totalSent) * 100) 
    : 0;
    
  const bounceRate = campaignStats.totalSent > 0 
    ? Math.round((campaignStats.totalBounced / campaignStats.totalSent) * 100) 
    : 0;
  
  // Handle campaign creation
  const handleCreateCampaign = () => {
    router.push('/campaigns/new');
  };
  
  // Handle campaign status change
  const handleCampaignStatusChange = async () => {
    // Reload campaigns
    const updatedCampaigns = await getCampaigns();
    setCampaigns(updatedCampaigns);
    
    // Update active campaigns
    const active = updatedCampaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED');
    setActiveCampaigns(active);
  };
  
  return (
    <div>
      {/* Campaign Status Overview */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h1 className="text-2xl font-bold">Campaign Dashboard</h1>
          <Button 
            color="primary" 
            onClick={handleCreateCampaign}
            startContent={<FaPlus />}
          >
            Create New Campaign
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Campaign KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardBody className="flex flex-col items-center p-4">
                  <p className="text-lg font-medium mb-2">Emails Sent</p>
                  <p className="text-3xl font-bold">{campaignStats.totalSent}</p>
                  <p className="text-sm text-gray-500">Last 30 days</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex flex-col items-center p-4">
                  <p className="text-lg font-medium mb-2">Open Rate</p>
                  <p className="text-3xl font-bold text-green-600">{openRate}%</p>
                  <p className="text-sm text-gray-500">{campaignStats.totalOpened} emails opened</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex flex-col items-center p-4">
                  <p className="text-lg font-medium mb-2">Reply Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{replyRate}%</p>
                  <p className="text-sm text-gray-500">{campaignStats.totalReplied} replies received</p>
                </CardBody>
              </Card>
              <Card>
                <CardBody className="flex flex-col items-center p-4">
                  <p className="text-lg font-medium mb-2">Bounce Rate</p>
                  <p className="text-3xl font-bold text-red-600">{bounceRate}%</p>
                  <p className="text-sm text-gray-500">{campaignStats.totalBounced} emails bounced</p>
                </CardBody>
              </Card>
            </div>
            
            {/* Active Campaigns */}
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold">Active Campaigns</h2>
              </CardHeader>
              <CardBody>
                {activeCampaigns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeCampaigns.map(campaign => (
                      <CampaignCard 
                        key={campaign.id} 
                        campaign={campaign} 
                        onStatusChange={handleCampaignStatusChange} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No active campaigns found.</p>
                    <Button 
                      color="primary" 
                      onClick={handleCreateCampaign}
                      startContent={<FaPlus />}
                    >
                      Create Your First Campaign
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
            
            {/* Campaign Analytics */}
            {activeCampaigns.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Campaign Analytics</h2>
                </CardHeader>
                <CardBody>
                  <CampaignAnalytics campaigns={activeCampaigns} />
                </CardBody>
              </Card>
            )}
            
            {/* Tools & Settings */}
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold">Campaign Tools</h2>
              </CardHeader>
              <CardBody>
                <Tabs aria-label="Campaign Tools" className="w-full">
                  <Tab key="senders" title="Sender Accounts">
                    <div className="p-2">
                      <SaveTokenForm />
                    </div>
                  </Tab>
                  <Tab key="import" title="Import Leads">
                    <div className="p-2">
                      <Button color="primary" onClick={() => router.push('/leads/upload')}>
                        Upload New Leads
                      </Button>
                    </div>
                  </Tab>
                  <Tab key="templates-email" title="Email Templates">
                    <div className="p-2">
                      <Button color="primary" onClick={() => router.push('/templates/email')}>
                        Manage Email Templates
                      </Button>
                    </div>
                  </Tab>
                  <Tab key="templates-loi" title="LOI Templates">
                    <div className="p-2">
                      <Button color="primary" onClick={() => router.push('/templates/loi')}>
                        Manage LOI Templates
                      </Button>
                    </div>
                  </Tab>
                </Tabs>
              </CardBody>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}