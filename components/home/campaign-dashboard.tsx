"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner } from "@heroui/react";
import { FaPlus } from "react-icons/fa";
import { getCampaigns, Campaign } from '@/lib/database';
import { useRouter } from 'next/navigation';
import CampaignCard from './campaign-card';

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Fetch campaigns
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allCampaigns = await getCampaigns();
        setCampaigns(allCampaigns);
        
        // Filter active campaigns
        const active = allCampaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED');
        setActiveCampaigns(active);
      } catch (error) {
        console.error('Error loading campaign data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
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
            onPress={handleCreateCampaign}
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
                      onPress={handleCreateCampaign}
                      startContent={<FaPlus />}
                    >
                      Create Your First Campaign
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </section>
    </div>
  );
}