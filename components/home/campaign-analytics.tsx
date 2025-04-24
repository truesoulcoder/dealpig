"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Spinner, Select, SelectItem } from "@heroui/react";
import { Campaign, getCampaignStatsByDate } from '@/lib/database';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

interface CampaignAnalyticsProps {
  campaigns: Campaign[];
}

export default function CampaignAnalytics({ campaigns }: CampaignAnalyticsProps) {
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaigns[0]?.id || '');
  const [dateRange, setDateRange] = useState<string>('30');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [dailyActivity, setDailyActivity] = useState<any[]>([]);
  
  // Fetch campaign stats
  useEffect(() => {
    const loadStats = async () => {
      if (!selectedCampaign) return;
      
      try {
        setLoading(true);
        
        // Calculate date range
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - parseInt(dateRange));
        
        // Get campaign stats
        const campaignStats = await getCampaignStatsByDate(
          selectedCampaign,
          startDate.toISOString().split('T')[0],
          today.toISOString().split('T')[0]
        );
        
        setStats(campaignStats);
        
        // Process daily activity data
        const dailyData: any[] = [];
        let cumulativeSent = 0;
        let cumulativeOpened = 0;
        let cumulativeReplied = 0;
        
        campaignStats.forEach(stat => {
          cumulativeSent += stat.total_sent;
          cumulativeOpened += stat.total_opened;
          cumulativeReplied += stat.total_replied;
          
          dailyData.push({
            date: stat.date,
            sent: stat.total_sent,
            opened: stat.total_opened,
            replied: stat.total_replied,
            bounced: stat.total_bounced,
            cumulativeSent,
            cumulativeOpened,
            cumulativeReplied
          });
        });
        
        setDailyActivity(dailyData);
        
      } catch (error) {
        console.error('Error loading campaign stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStats();
  }, [selectedCampaign, dateRange]);
  
  // Handle campaign selection change
  const handleCampaignChange = (value: string) => {
    setSelectedCampaign(value);
  };
  
  // Handle date range selection change
  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
  };
  
  // Find the selected campaign object
  const campaign = campaigns.find(c => c.id === selectedCampaign);
  
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div className="w-full sm:w-1/3">
          <Select
            label="Campaign"
            placeholder="Select a campaign"
            value={selectedCampaign}
            onChange={(e) => handleCampaignChange(e.target.value)}
          >
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id || ''}>
                {campaign.name}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="w-full sm:w-1/4">
          <Select
            label="Time Period"
            value={dateRange}
            onChange={(e) => handleDateRangeChange(e.target.value)}
          >
            <SelectItem key="7" value="7">Last 7 Days</SelectItem>
            <SelectItem key="30" value="30">Last 30 Days</SelectItem>
            <SelectItem key="90" value="90">Last 90 Days</SelectItem>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {campaign && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Activity Chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Daily Email Activity</h3>
                </CardHeader>
                <CardBody>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={dailyActivity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [value, '']} 
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="sent" stroke="#8884d8" activeDot={{ r: 8 }} name="Sent" />
                        <Line type="monotone" dataKey="opened" stroke="#82ca9d" name="Opened" />
                        <Line type="monotone" dataKey="replied" stroke="#ffc658" name="Replied" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
              
              {/* Cumulative Performance */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Cumulative Performance</h3>
                </CardHeader>
                <CardBody>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <LineChart
                        data={dailyActivity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [value, '']} 
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="cumulativeSent" stroke="#8884d8" name="Total Sent" />
                        <Line type="monotone" dataKey="cumulativeOpened" stroke="#82ca9d" name="Total Opened" />
                        <Line type="monotone" dataKey="cumulativeReplied" stroke="#ffc658" name="Total Replied" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
              
              {/* Daily Email Metrics */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Email Response Metrics</h3>
                </CardHeader>
                <CardBody>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <BarChart
                        data={dailyActivity}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: any) => [value, '']} 
                          labelFormatter={(value) => {
                            const date = new Date(value);
                            return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                          }}
                        />
                        <Legend />
                        <Bar dataKey="opened" fill="#82ca9d" name="Opened" />
                        <Bar dataKey="replied" fill="#ffc658" name="Replied" />
                        <Bar dataKey="bounced" fill="#ff8042" name="Bounced" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
              
              {/* Campaign Progress */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-medium">Campaign Progress</h3>
                </CardHeader>
                <CardBody>
                  <div className="flex flex-col space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Leads</p>
                        <p className="text-2xl font-bold">{campaign.total_leads}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Leads Processed</p>
                        <p className="text-2xl font-bold">{campaign.leads_worked}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Completion Rate</p>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${campaign.total_leads > 0 ? (campaign.leads_worked / campaign.total_leads) * 100 : 0}%` }}
                        />
                      </div>
                      <p className="text-right text-sm mt-1">
                        {campaign.total_leads > 0 
                          ? Math.round((campaign.leads_worked / campaign.total_leads) * 100) 
                          : 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <p className="text-lg font-medium">{campaign.status}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
          
          {!campaign && (
            <div className="text-center py-8">
              <p className="text-gray-500">Please select a campaign to view analytics.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}