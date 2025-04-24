"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardBody, CardHeader, Button, Spinner, Select, SelectItem, Chip, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger } from "@heroui/react";
import { FaPlus, FaFilter, FaSyncAlt } from "react-icons/fa";
import { Campaign } from '@/lib/database'; 
import { getCampaigns } from '@/actions/campaign.action';
import { useRouter } from 'next/navigation';
import CampaignCard from './campaign-card';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

import { getEmailPerformance, EmailPerformanceData, TimeRange } from '@/actions/analytics/emailPerformance';
import { getLeadStatusDistribution, LeadStatusData } from '@/actions/analytics/leadStatus';
import { getSenderPerformance, SenderPerformanceData } from '@/actions/analytics/senderPerformance';
import { getCampaignComparison, CampaignComparisonData } from '@/actions/analytics/campaignPerformance';
import { getWeeklyPerformance, WeeklyPerformanceData } from '@/actions/analytics/weeklyPerformance';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const router = useRouter();
  
  // Chart data states
  const [emailPerformanceData, setEmailPerformanceData] = useState<EmailPerformanceData[]>([]);
  const [leadStatusData, setLeadStatusData] = useState<LeadStatusData[]>([]);
  const [senderPerformanceData, setSenderPerformanceData] = useState<SenderPerformanceData[]>([]);
  const [campaignComparisonData, setCampaignComparisonData] = useState<CampaignComparisonData[]>([]);
  const [weeklyPerformanceData, setWeeklyPerformanceData] = useState<WeeklyPerformanceData[]>([]);
  
  // Loading states for individual charts
  const [loadingEmailChart, setLoadingEmailChart] = useState(false);
  const [loadingLeadChart, setLoadingLeadChart] = useState(false);
  const [loadingSenderChart, setLoadingSenderChart] = useState(false);
  const [loadingCampaignChart, setLoadingCampaignChart] = useState(false);
  const [loadingWeeklyChart, setLoadingWeeklyChart] = useState(false);
  
  // Load campaign data
  const loadCampaignData = async () => {
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
  
  // Load email performance data with useCallback
  const loadEmailPerformance = useCallback(async () => {
    setLoadingEmailChart(true);
    try {
      const data = await getEmailPerformance(timeRange);
      setEmailPerformanceData(data);
    } catch (error) {
      console.error('Error loading email performance data:', error);
    } finally {
      setLoadingEmailChart(false);
    }
  }, [timeRange]);
  
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
      const data = await getSenderPerformance(timeRange);
      setSenderPerformanceData(data);
    } catch (error) {
      console.error('Error loading sender performance data:', error);
    } finally {
      setLoadingSenderChart(false);
    }
  }, [timeRange]);
  
  // Load campaign comparison data with useCallback
  const loadCampaignComparison = useCallback(async () => {
    setLoadingCampaignChart(true);
    try {
      const data = await getCampaignComparison(timeRange);
      setCampaignComparisonData(data);
    } catch (error) {
      console.error('Error loading campaign comparison data:', error);
    } finally {
      setLoadingCampaignChart(false);
    }
  }, [timeRange]);
  
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
    loadCampaignComparison();
    loadWeeklyPerformance();
  }, [loadEmailPerformance, loadLeadStatus, loadSenderPerformance, loadCampaignComparison, loadWeeklyPerformance]);
  
  // Fetch campaigns and analytics data on component mount
  useEffect(() => {
    loadCampaignData();
    loadAllAnalytics();
  }, [loadAllAnalytics]);
  
  // Reload analytics when time range changes
  useEffect(() => {
    loadAllAnalytics();
  }, [timeRange, loadAllAnalytics]);
  
  // Handle campaign creation
  const handleCreateCampaign = () => {
    router.push('/campaigns/new');
  };
  
  // Handle campaign status change
  const handleCampaignStatusChange = async () => {
    await loadCampaignData();
    // Also reload campaign comparison chart
    loadCampaignComparison();
  };
  
  // Handle time range change
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
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
              onClick={refreshAnalytics}
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
        
        {/* Dashboard Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <Card className="p-4 text-center">
            <p className="text-sm text-default-500">Total Campaigns</p>
            <h3 className="text-2xl font-bold">{campaigns.length}</h3>
            <p className="text-xs text-success-500 mt-1">
              {activeCampaigns.length} active
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
            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Email Performance Line Chart */}
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Email Performance</h2>
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

              {/* Lead Status Distribution Pie Chart */}
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Lead Status Distribution</h2>
                  {loadingLeadChart && <Spinner size="sm" color="primary" />}
                </CardHeader>
                <CardBody>
                  {loadingLeadChart ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {leadStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={formatTooltipValue} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>
              
              {/* Weekly Performance Area Chart */}
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Weekly Campaign Performance</h2>
                  {loadingWeeklyChart && <Spinner size="sm" color="primary" />}
                </CardHeader>
                <CardBody>
                  {loadingWeeklyChart ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart
                        data={weeklyPerformanceData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={formatTooltipValue} />
                        <Legend />
                        <Area type="monotone" dataKey="emails" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="leads" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                        <Area type="monotone" dataKey="replies" stackId="1" stroke="#ffc658" fill="#ffc658" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>

              {/* Campaign Comparison Radar Chart */}
              <Card>
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Campaign KPI Comparison</h2>
                  {loadingCampaignChart && <Spinner size="sm" color="primary" />}
                </CardHeader>
                <CardBody>
                  {loadingCampaignChart ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={campaignComparisonData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="name" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="Open Rate" dataKey="openRate" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Radar name="Reply Rate" dataKey="replyRate" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                        <Radar name="Conversion Rate" dataKey="conversionRate" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                        <Legend />
                        <Tooltip formatter={(value) => (typeof value === 'number' ? [`${value.toFixed(1)}%`, null] : [value, null])} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </CardBody>
              </Card>
              
              {/* Sender Performance Bar Chart */}
              <Card className="md:col-span-2">
                <CardHeader className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Sender Performance</h2>
                  {loadingSenderChart && <Spinner size="sm" color="primary" />}
                </CardHeader>
                <CardBody>
                  {loadingSenderChart ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <Spinner size="lg" color="primary" />
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

            {/* Active Campaigns */}
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