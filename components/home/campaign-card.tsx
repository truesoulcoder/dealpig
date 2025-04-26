"use client";

import { useState } from 'react';
import { Card, CardBody, CardHeader, CardFooter, Button, Chip, Tooltip, Progress } from "@nextui-org/react";
import { FaPlay, FaPause, FaStop, FaEdit, FaChartLine } from "react-icons/fa";
import { startCampaign, pauseCampaign, completeCampaign } from '@/lib/database';
import { useRouter } from 'next/navigation';

export interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    description?: string;
    status: string;
    total_leads: number;
    leads_worked: number;
    email_template?: { name: string };
    loi_template?: { name: string };
  };
  onStatusChange?: () => void;
}

export default function CampaignCard({ campaign, onStatusChange }: CampaignCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  
  // Calculate progress percentage
  const progress = campaign.total_leads > 0 
    ? Math.round((campaign.leads_worked / campaign.total_leads) * 100)
    : 0;
    
  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return 'success';
      case 'PAUSED':
        return 'warning';
      case 'COMPLETED':
        return 'secondary';
      case 'DRAFT':
        return 'primary';
      default:
        return 'default';
    }
  };
  
  // Handle campaign actions
  const handleStart = async () => {
    setIsUpdating(true);
    try {
      await startCampaign(campaign.id);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Error starting campaign:', error);
      alert('Failed to start campaign');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handlePause = async () => {
    setIsUpdating(true);
    try {
      await pauseCampaign(campaign.id);
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Error pausing campaign:', error);
      alert('Failed to pause campaign');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleStop = async () => {
    if (confirm('Are you sure you want to complete this campaign? This action cannot be undone.')) {
      setIsUpdating(true);
      try {
        await completeCampaign(campaign.id);
        if (onStatusChange) onStatusChange();
      } catch (error) {
        console.error('Error stopping campaign:', error);
        alert('Failed to stop campaign');
      } finally {
        setIsUpdating(false);
      }
    }
  };
  
  const handleEdit = () => {
    router.push(`/campaigns/${campaign.id}/edit`);
  };
  
  const handleViewAnalytics = () => {
    router.push(`/campaigns/${campaign.id}/analytics`);
  };
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">{campaign.name}</h3>
          <div className="flex gap-2 items-center mt-1">
            <Chip 
              size="sm" 
              color={getStatusColor(campaign.status)}
              variant="flat"
            >
              {campaign.status}
            </Chip>
            
            {campaign.email_template && (
              <Tooltip content="Email Template">
                <Chip size="sm" variant="flat">Email: {campaign.email_template.name}</Chip>
              </Tooltip>
            )}
            
            {campaign.loi_template && (
              <Tooltip content="LOI Template">
                <Chip size="sm" variant="flat">LOI: {campaign.loi_template.name}</Chip>
              </Tooltip>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardBody>
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-1">{campaign.description || 'No description provided'}</p>
        </div>
        
        <div className="mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-sm">Progress</span>
            <span className="text-sm font-medium">{campaign.leads_worked} / {campaign.total_leads} leads</span>
          </div>
          <Progress value={progress} color="primary" />
        </div>
      </CardBody>
      
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          {campaign.status === 'DRAFT' && (
            <Button 
              color="success" 
              size="sm"
              startContent={<FaPlay size={14} />}
              onPress={handleStart}
              isLoading={isUpdating}
            >
              Start
            </Button>
          )}
          
          {campaign.status === 'ACTIVE' && (
            <Button 
              color="warning" 
              size="sm"
              startContent={<FaPause size={14} />}
              onPress={handlePause}
              isLoading={isUpdating}
            >
              Pause
            </Button>
          )}
          
          {campaign.status === 'PAUSED' && (
            <Button 
              color="success" 
              size="sm"
              startContent={<FaPlay size={14} />}
              onPress={handleStart}
              isLoading={isUpdating}
            >
              Resume
            </Button>
          )}
          
          {(campaign.status === 'ACTIVE' || campaign.status === 'PAUSED') && (
            <Button 
              color="danger" 
              size="sm"
              startContent={<FaStop size={14} />}
              onPress={handleStop}
              isLoading={isUpdating}
            >
              Complete
            </Button>
          )}
          
          {campaign.status === 'DRAFT' && (
            <Button 
              variant="flat" 
              size="sm"
              startContent={<FaEdit size={14} />}
              onPress={handleEdit}
            >
              Edit
            </Button>
          )}
        </div>
        
        <Button 
          variant="light" 
          size="sm"
          startContent={<FaChartLine size={14} />}
          onPress={handleViewAnalytics}
        >
          Analytics
        </Button>
      </CardFooter>
    </Card>
  );
}