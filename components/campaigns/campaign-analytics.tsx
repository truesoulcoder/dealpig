"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Progress, Spinner, Tabs, Tab } from "@heroui/react";
import { FaEnvelope, FaEye, FaMousePointer, FaExclamationTriangle, FaCheckCircle, FaChartBar } from "react-icons/fa";
import { getEmailCampaignStats } from '@/lib/emailTrackingService';

interface CampaignAnalyticsProps {
  campaigns: any[];
}

interface EmailStats {
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
  uniqueOpens: number;
}

export default function CampaignAnalytics({ campaigns }: CampaignAnalyticsProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(
    campaigns && campaigns.length > 0 ? campaigns[0].id : null
  );
  const [trackingStats, setTrackingStats] = useState<Record<string, EmailStats>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Load initial stats for the first campaign
    if (selectedCampaign) {
      loadCampaignStats(selectedCampaign);
    }
  }, []);

  const loadCampaignStats = async (campaignId: string) => {
    if (trackingStats[campaignId] || loading[campaignId]) {
      return;
    }

    try {
      setLoading(prev => ({ ...prev, [campaignId]: true }));
      const stats = await getEmailCampaignStats(campaignId);
      setTrackingStats(prev => ({ ...prev, [campaignId]: stats }));
    } catch (error) {
      console.error('Error loading campaign stats:', error);
      // Set default empty stats on error
      setTrackingStats(prev => ({
        ...prev,
        [campaignId]: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          failed: 0,
          uniqueOpens: 0,
          uniqueClicks: 0
        }
      }));
    } finally {
      setLoading(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No campaign data available for analytics.</p>
      </div>
    );
  }

  const handleCampaignSelect = (campaignId: string) => {
    setSelectedCampaign(campaignId);
    if (!trackingStats[campaignId]) {
      loadCampaignStats(campaignId);
    }
  };

  // Find the selected campaign
  const campaign = campaigns.find(c => c.id === selectedCampaign) || campaigns[0];
  const stats = trackingStats[campaign.id] || {
    sent: 0,
    delivered: 0,
    opened: 0,
    bounced: 0,
    failed: 0,
    uniqueOpens: 0
  };

  // Calculate delivery rate, open rate
  const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
  const openRate = stats.delivered > 0 ? (stats.opened / stats.delivered) * 100 : 0;
  const bounceRate = stats.sent > 0 ? (stats.bounced / stats.sent) * 100 : 0;

  return (
    <div className="space-y-6">
      <Tabs 
        variant="underlined" 
        color="primary"
        selectedKey={selectedCampaign} 
        onSelectionChange={(key) => handleCampaignSelect(key as string)}
      >
        {campaigns.map((c) => (
          <Tab key={c.id} title={c.name} />
        ))}
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campaign Overview */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Campaign Overview</h3>
              <FaChartBar className="text-gray-400" />
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-sm font-medium">
                    {campaign.total_leads 
                      ? Math.round((campaign.leads_worked || 0) / campaign.total_leads * 100) 
                      : 0}%
                  </p>
                </div>
                <Progress 
                  value={campaign.leads_worked || 0} 
                  maxValue={campaign.total_leads || 0} 
                  color="primary"
                  className="h-2" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Total Leads</p>
                  <p className="font-medium">{campaign.total_leads || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Leads Worked</p>
                  <p className="font-medium">{campaign.leads_worked || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium">{new Date(campaign.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{campaign.status?.toLowerCase() || 'Unknown'}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Tracking Enabled</p>
                <p className="font-medium">{campaign.tracking_enabled !== false ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      
        {/* Email Tracking Stats */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Email Tracking</h3>
              <FaEnvelope className="text-gray-400" />
            </div>
          </CardHeader>
          <CardBody>
            {loading[campaign.id] ? (
              <div className="flex justify-center items-center h-40">
                <Spinner color="primary" />
              </div>
            ) : campaign.tracking_enabled === false ? (
              <div className="text-center py-6">
                <p className="text-gray-500">Tracking is disabled for this campaign.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Email Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <FaEnvelope className="text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Emails Sent</p>
                      <p className="font-medium">{stats.sent}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaCheckCircle className="text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Delivered</p>
                      <p className="font-medium">{stats.delivered} ({deliveryRate.toFixed(1)}%)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaEye className="text-purple-500" />
                    <div>
                      <p className="text-sm text-gray-500">Opens</p>
                      <p className="font-medium">
                        {stats.opened} ({openRate.toFixed(1)}%)
                        <span className="text-xs text-gray-500 ml-2">
                          {stats.uniqueOpens} unique
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Problem Metrics */}
                <div className="mt-6">
                  <div className="flex items-center space-x-2">
                    <FaExclamationTriangle className="text-red-500" />
                    <div>
                      <p className="text-sm text-gray-500">Bounces</p>
                      <p className="font-medium">
                        {stats.bounced} ({bounceRate.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Performance Bars */}
                <div className="space-y-2 mt-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Delivery Rate</span>
                      <span>{deliveryRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={deliveryRate} color="success" className="h-1" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Open Rate</span>
                      <span>{openRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={openRate} color="primary" className="h-1" />
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}