"use client";

import { useState, useEffect, Suspense } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Chip } from "@heroui/react";
import { FaPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import CampaignCard from '@/components/home/campaign-card';
import { getCampaigns } from '@/actions/campaign.action';

// Component that uses useRouter wrapped in Suspense
function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load campaign data
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const allCampaigns = await getCampaigns();
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle campaign creation
  const handleCreateCampaign = () => {
    router.push('/campaigns/new');
  };

  // Handle campaign status change
  const handleCampaignStatusChange = async () => {
    await loadCampaigns();
  };

  return (
    <div className="container p-4 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button 
          color="primary" 
          onPress={handleCreateCampaign}
          startContent={<FaPlus />}
        >
          Create Campaign
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.length > 0 ? (
            campaigns.map(campaign => (
              <CampaignCard 
                key={campaign.id} 
                campaign={campaign} 
                onStatusChange={handleCampaignStatusChange} 
              />
            ))
          ) : (
            <Card className="col-span-1 md:col-span-2 xl:col-span-3">
              <CardBody className="text-center py-12">
                <p className="text-gray-500 mb-4">No campaigns found.</p>
                <Button 
                  color="primary" 
                  onPress={handleCreateCampaign}
                  startContent={<FaPlus />}
                >
                  Create Your First Campaign
                </Button>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Fallback component for Suspense
function CampaignsFallback() {
  return (
    <div className="container p-4 mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <div className="w-40 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function CampaignsPage() {
  return (
    <Suspense fallback={<CampaignsFallback />}>
      <CampaignsContent />
    </Suspense>
  );
}