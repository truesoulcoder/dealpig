"use client";

import { useState, useEffect, Suspense } from 'react';
import { Card, CardBody, Button, Spinner } from "@heroui/react"; // Correctly use heroui
import { FaPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getCampaigns } from '@/actions/campaign.action';

// Dynamically import the CampaignCard component with no SSR to prevent hydration issues
const CampaignCard = dynamic(() => import('@/components/home/campaign-card'), {
  ssr: false,
  loading: () => (
    <Card className="w-full h-48">
      <CardBody className="flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </CardBody>
    </Card>
  ),
});

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="flex justify-center items-center h-64">
      <Spinner size="lg" color="primary" />
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load campaign data
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        setLoading(true);
        const allCampaigns = await getCampaigns();
        setCampaigns(allCampaigns);
      } catch (error) {
        console.error('Error loading campaign data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, []);

  // Handle campaign creation
  const handleCreateCampaign = () => {
    router.push('/campaigns/new');
  };

  // Handle campaign status change
  const handleCampaignStatusChange = async () => {
    try {
      setLoading(true);
      const allCampaigns = await getCampaigns();
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error('Error reloading campaign data:', error);
    } finally {
      setLoading(false);
    }
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

      <Suspense fallback={<LoadingFallback />}>
        {loading ? (
          <LoadingFallback />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns && campaigns.length > 0 ? (
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
      </Suspense>
    </div>
  );
}