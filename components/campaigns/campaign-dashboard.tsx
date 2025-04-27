"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Select, SelectItem, Chip, CheckboxGroup, Checkbox, Badge } from "@heroui/react";
import { FaPlus, FaFilter, FaSyncAlt, FaClock } from "react-icons/fa";
import { Campaign } from '@/lib/database'; 
import { getCampaigns, triggerCampaignProcessorManually } from '@/actions/campaign.action';
import { useRouter } from 'next/navigation';
import CampaignCard from './campaign-card';
import EmailActivityMonitor from '../home/email-activity-monitor';
import { supabase } from '@/lib/supabaseClient';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { getEmailPerformance, EmailPerformanceData, TimeRange } from '@/actions/analytics/emailPerformance';
import { getLeadStatusDistribution, LeadStatusData } from '@/actions/analytics/leadStatus';
import { getSenderPerformance, SenderPerformanceData } from '@/actions/analytics/senderPerformance';
import { getWeeklyPerformance, WeeklyPerformanceData } from '@/actions/analytics/weeklyPerformance';
import { toast } from '@/components/ui/toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  const router = useRouter();
  
  // Chart data states
  const [emailPerformanceData, setEmailPerformanceData] = useState<EmailPerformanceData[]>([]);
  const [leadStatusData, setLeadStatusData] = useState<LeadStatusData[]>([]);
  const [senderPerformanceData, setSenderPerformanceData] = useState<SenderPerformanceData[]>([]);
  const [weeklyPerformanceData, setWeeklyPerformanceData] = useState<WeeklyPerformanceData[]>([]);
  
  // Loading states for individual charts
  const [loadingEmailChart, setLoadingEmailChart] = useState(false);
  const [loadingLeadChart, setLoadingLeadChart] = useState(false);
  const [loadingSenderChart, setLoadingSenderChart] = useState(false);
  const [loadingWeeklyChart, setLoadingWeeklyChart] = useState(false);
  
  // Auto-refresh interval
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(null);
  
  // Load campaign data
  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const allCampaigns = await getCampaigns();
      setCampaigns(allCampaigns);
      
      // Filter active campaigns
      const active = allCampaigns.filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED');
      setActiveCampaigns(active);
      
      // Pre-select active campaigns for monitoring if no selection yet
      if (selectedCampaignIds.length === 0 && active.length > 0) {
        const activeIds = active.map(c => c.id || '').filter(id => id !== '');
        setSelectedCampaignIds(activeIds);
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Real-time email performance subscription
  useEffect(() => {
    if (!realtimeEnabled || selectedCampaignIds.length === 0) return;
    
    const channel = supabase
      .channel('email-performance-updates')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'emails',
        filter: selectedCampaignIds.length > 0 
          ? `campaign_id=in.(${selectedCampaignIds.join(',')})` 
          : undefined
      }, (payload) => {
        console.log('Email performance update:', payload);
        // Update the emailPerformanceData on change
        loadEmailPerformance();
        
        // Also update sender performance data on new activity
        loadSenderPerformance();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [realtimeEnabled, selectedCampaignIds]);
  
  // Load email performance data with useCallback
  const loadEmailPerformance = useCallback(async () => {
    setLoadingEmailChart(true);
    try {
      const data = await getEmailPerformance(timeRange, selectedCampaignIds);
      setEmailPerformanceData(data);
    } catch (error) {
      console.error('Error loading email performance data:', error);
    } finally {
      setLoadingEmailChart(false);
    }
  }, [timeRange, selectedCampaignIds]);
  
  // Load lead status distribution with useCallback
  const loadLeadStatus = useCallback(async () => {
    setLoadingLeadChart(true);
    try {
      const data = await getLeadStatusDistribution();
      setLeadStatusData(data);
    } catch (error) {
      console.error('Error loading lead status data:', error);
    } finally {
      setLoadingLeadChart(false);
    }
  }, []);
  
  // Load sender performance data with useCallback
  const loadSenderPerformance = useCallback(async () => {
    setLoadingSenderChart(true);
    try {
      const data = await getSenderPerformance(timeRange, selectedCampaignIds);
      setSenderPerformanceData(data);
    } catch (error) {
      console.error('Error loading sender performance data:', error);
    } finally {
      setLoadingSenderChart(false);
    }
  }, [timeRange, selectedCampaignIds]);
  
  // Load weekly performance data with useCallback
  const loadWeeklyPerformance = useCallback(async () => {
    setLoadingWeeklyChart(true);
    try {
      const data = await getWeeklyPerformance(timeRange);
      setWeeklyPerformanceData(data);
    } catch (error) {
      console.error('Error loading weekly performance data:', error);
    } finally {
      setLoadingWeeklyChart(false);
    }
  }, [timeRange]);
  
  // Load all analytics data with useCallback
  const loadAllAnalytics = useCallback(() => {
    loadEmailPerformance();
    loadLeadStatus();
    loadSenderPerformance();
    loadWeeklyPerformance();
  }, [loadEmailPerformance, loadLeadStatus, loadSenderPerformance, loadWeeklyPerformance]);
  
  // Fetch campaigns and analytics data on component mount
  useEffect(() => {
    loadCampaignData();
    loadAllAnalytics();
  }, [loadAllAnalytics]);
  
  // Reload analytics when campaign selection changes
  useEffect(() => {
    loadAllAnalytics();
  }, [selectedCampaignIds, timeRange, loadAllAnalytics]);
  
  // Set up auto-refresh interval for real-time monitoring
  useEffect(() => {
    if (!realtimeEnabled) {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
      }
      return;
    }
    
    // Set 30-second refresh interval when real-time is enabled
    const interval = window.setInterval(() => {
      console.log('Auto-refreshing analytics...');
      loadAllAnalytics();
    }, 30000); // 30 seconds
    
    setAutoRefreshInterval(interval);
    
    // Clear interval on unmount or when real-time is disabled
    return () => {
      clearInterval(interval);
    };
  }, [realtimeEnabled, loadAllAnalytics]);
  
  // Handle campaign creation
  const handleCreateCampaign = () => {
    router.push('/campaigns/new');
  };
  
  // Handle campaign status change
  const handleCampaignStatusChange = async () => {
    await loadCampaignData();
    // Reload all analytics data since campaign status affects analytics
    loadAllAnalytics();
  };
  
  // Handle time range change
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
  };
  
  // Toggle real-time monitoring and control the lead distribution engine
  const toggleRealtime = async () => {
    try {
        // If turning on the engine
      if (!realtimeEnabled) {
        console.log('Starting campaign engine preflight checks...');
        
        // Only proceed if there are active campaigns
        if (activeCampaigns.length === 0) {
          toast.destructive({
            title: "No active campaigns",
            description: "Please activate at least one campaign before starting the engine.",
            variant: "destructive"
          });
          return;
        }
        
        // Check if any campaigns need sender validation
        // Use our server action to trigger the campaign processor
        const result = await triggerCampaignProcessorManually();
        if (result.success) {
          toast.default({
            title: "Campaign engine started",
            description: `Successfully started lead distribution engine. ${result.processed || 0} leads processed.`,
            variant: "default"
          });
          setRealtimeEnabled(true);
        } else {
          toast.destructive({
            title: "Engine start failed",
            description: result.message || "Failed to start lead distribution engine. Check console for details.",
            variant: "destructive"
          });
        }
      } else {
        // Simply turn off the real-time updates when toggling off
        setRealtimeEnabled(false);
        toast.default({
          title: "Campaign engine stopped",
          description: "Lead distribution engine has been paused. No new leads will be processed.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error toggling campaign engine:', error);
      toast.destructive({
        title: "Error",
        description: `Failed to toggle campaign engine: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    }
  };
  
  // Handle campaign selection change
  const handleCampaignSelectionChange = (selectedIds: string[]) => {
    setSelectedCampaignIds(selectedIds);
  };
  
  // Refresh all analytics data
  const refreshAnalytics = () => {
    loadAllAnalytics();
  };
  
  // Format for the chart tooltips
  const formatTooltipValue = (value: number) => {
    return value.toLocaleString();
  };
  
  // Format for percentage values
  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`;
  };
  
  return (
    <div>
      {/* Campaign Status Overview */}
      <section className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h1 className="text-2xl font-bold">Campaign Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              variant={realtimeEnabled ? "solid" : "bordered"}
              color={realtimeEnabled ? "success" : "default"}
              className={realtimeEnabled ? "animate-pulse" : ""}
              onPress={toggleRealtime}
              startContent={<FaClock />}
              size="sm"
            >
              {realtimeEnabled ? "Live" : "Static"}
            </Button>
            <Select 
              className="w-32" 
              size="sm"
              selectedKeys={[timeRange]}
              onChange={(event) => handleTimeRangeChange(event.target.value as TimeRange)}
            >
              <SelectItem key="7d">Last 7 days</SelectItem>
              <SelectItem key="30d">Last 30 days</SelectItem>
              <SelectItem key="90d">Last 90 days</SelectItem>
            </Select>
            <Button 
              variant="light" 
              onPress={refreshAnalytics}
              isIconOnly
              aria-label="Refresh analytics"
              className="bg-transparent"
            >
              <FaSyncAlt />
            </Button>
            <Button 
              color="primary" 
              onPress={handleCreateCampaign}
              startContent={<FaPlus />}
            >
              Create Campaign
            </Button>
          </div>
        </div>
        
        {/* Campaign Selection */}
        {activeCampaigns.length > 0 && (
          <Card className="mb-4">
            <CardBody className="py-2">
              <p className="text-sm font-medium mb-2">Select campaigns to monitor:</p>
              <div className="flex flex-wrap gap-2">
                <CheckboxGroup
                  orientation="horizontal"
                  value={selectedCampaignIds}
                  onChange={(value) => handleCampaignSelectionChange(value as string[])}
                >
                  {activeCampaigns.map((campaign) => (
                    <Checkbox 
                      key={campaign.id} 
                      value={campaign.id}
                      size="sm"
                    >
                      {campaign.name}
                    </Checkbox>
                  ))}
                </CheckboxGroup>
              </div>
            </CardBody>
          </Card>
        )}
        
        {/* Dashboard Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <Card className="p-4 text-center">
            <p className="text-sm text-default-500">Monitored Campaigns</p>
            <h3 className="text-2xl font-bold">{selectedCampaignIds.length}</h3>
            <p className="text-xs text-success-500 mt-1">
              {realtimeEnabled ? "live monitoring" : "static data"}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-default-500">Total Emails</p>
            <h3 className="text-2xl font-bold">
              {emailPerformanceData.reduce((sum, day) => sum + day.sent, 0).toLocaleString()}
            </h3>
            <p className="text-xs text-success-500 mt-1">
              {timeRange === '7d' ? 'past week' : timeRange === '30d' ? 'past month' : 'past 3 months'}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-default-500">Open Rate</p>
            <h3 className="text-2xl font-bold">
              {emailPerformanceData.length > 0 ? 
                formatPercent(
                  (emailPerformanceData.reduce((sum, day) => sum + day.opened, 0) / 
                   emailPerformanceData.reduce((sum, day) => sum + day.sent, 0)) * 100 || 0
                ) : '0.0%'}
            </h3>
            <p className="text-xs text-success-500 mt-1">
              {timeRange === '7d' ? 'past week' : timeRange === '30d' ? 'past month' : 'past 3 months'}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-default-500">Reply Rate</p>
            <h3 className="text-2xl font-bold">
              {emailPerformanceData.length > 0 ? 
                formatPercent(
                  (emailPerformanceData.reduce((sum, day) => sum + day.replied, 0) / 
                   emailPerformanceData.reduce((sum, day) => sum + day.sent, 0)) * 100 || 0
                ) : '0.0%'}
            </h3>
            <p className="text-xs text-success-500 mt-1">
              {timeRange === '7d' ? 'past week' : timeRange === '30d' ? 'past month' : 'past 3 months'}
            </p>
          </Card>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-4">
            <Spinner color="primary" />
          </div>
        ) : (
          <>
            {/* Analytics Dashboard - Focused on Real-time Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Email Performance Line Chart */}
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Email Performance</h2>
                    {realtimeEnabled && <Badge color="success" variant="flat" className="animate-pulse">Live</Badge>}
                  </div>
                  {loadingEmailChart && <Spinner size="sm" color="primary" />}
                </CardHeader>
                <CardBody>
                  {loadingEmailChart ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={emailPerformanceData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={formatTooltipValue} />
                        <Legend />
                        <Line type="monotone" dataKey="sent" stroke="#8884d8" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="opened" stroke="#82ca9d" />
                        <Line type="monotone" dataKey="replied" stroke="#ffc658" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>

              {/* Real-time Email Activity Monitor */}
              <EmailActivityMonitor selectedCampaignIds={selectedCampaignIds} />
              
              {/* Sender Performance Bar Chart */}
              <Card className="md:col-span-2">
                <CardHeader className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">Sender Performance</h2>
                    {realtimeEnabled && <Badge color="success" variant="flat" className="animate-pulse">Live</Badge>}
                  </div>
                  {loadingSenderChart && <Spinner size="sm" color="primary" />}
                </CardHeader>
                <CardBody>
                  {loadingSenderChart ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : senderPerformanceData.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-gray-500">No sender data available for selected campaigns.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={senderPerformanceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={formatTooltipValue} />
                        <Legend />
                        <Bar dataKey="sent" fill="#8884d8" />
                        <Bar dataKey="opened" fill="#82ca9d" />
                        <Bar dataKey="replied" fill="#ffc658" />
                        <Bar dataKey="converted" fill="#ff8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Active Campaigns Cards */}
            <Card className="mb-6">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Active Campaigns</h2>
                <Chip color="primary" variant="flat">
                  {activeCampaigns.length} active
                </Chip>
              </CardHeader>
              <CardBody>
                {activeCampaigns.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {activeCampaigns
                      .filter(campaign => campaign.id !== undefined)
                      .map(campaign => (
                        <CampaignCard 
                          key={campaign.id} 
                          campaign={campaign as any} 
                          onStatusChange={handleCampaignStatusChange} 
                          isSelected={selectedCampaignIds.includes(campaign.id!)}
                          onToggleSelect={() => {
                            if (selectedCampaignIds.includes(campaign.id!)) {
                              setSelectedCampaignIds(prev => prev.filter(id => id !== campaign.id));
                            } else {
                              setSelectedCampaignIds(prev => [...prev, campaign.id!]);
                            }
                          }}
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