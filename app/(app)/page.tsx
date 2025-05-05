"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, Button, Spinner, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Badge, Chip } from "@heroui/react";
import { FaPlay, FaPause, FaChartLine, FaEnvelope, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { supabase } from "@/lib/supabase";
import { Campaign, Sender } from "@/helpers/types";

// Color palette for charts
const EMAIL_STATUS_COLORS = {
  sent: "#0088FE", // Blue for sent
  delivered: "#00C49F", // Green for delivered
  bounced: "#FF0042" // Red for bounced
};

export default function Dashboard() {
  // State management
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isActiveCampaign, setIsActiveCampaign] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [senders, setSenders] = useState<Sender[]>([]);
  const [dailyStats, setDailyStats] = useState<{
    sent: number;
    delivered: number;
    bounced: number;
    deliveryRate: number;
  }>({
    sent: 0,
    delivered: 0,
    bounced: 0,
    deliveryRate: 0
  });
  const [senderStats, setSenderStats] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch campaigns on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch campaigns
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (campaignError) throw campaignError;
        setCampaigns(campaignData || []);
        
        // Select the most recent campaign by default
        if (campaignData && campaignData.length > 0) {
          setSelectedCampaign(campaignData[0]);
          
          // Check if the campaign is active
          setIsActiveCampaign(campaignData[0].status === "ACTIVE");
          
          // Fetch today's stats for the selected campaign
          await fetchTodaysStats(campaignData[0].id);
        }
        
        // Fetch senders
        const { data: senderData, error: senderError } = await supabase
          .from("senders")
          .select("*");
          
        if (senderError) throw senderError;
        setSenders(senderData || []);
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription for stats updates
    const subscription = supabase
      .channel('dashboard_updates')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'emails' 
      }, payload => {
        console.log('New email event:', payload);
        // Refresh stats when new emails are processed
        if (selectedCampaign) {
          fetchTodaysStats(selectedCampaign.id);
        }
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Fetch today's campaign statistics only
  const fetchTodaysStats = async (campaignId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Use type assertion to bypass TypeScript error with group()
      const { data: stats, error: statsError } = await (supabase
        .from("emails")
        .select('status, count(*)')
        .eq("campaign_id", campaignId)
        .gte("created_at", today.toISOString()) as any)
        .group('status');
      
      if (statsError) throw statsError;
      
      // Process today's stats
      let sent = 0;
      let delivered = 0;
      let bounced = 0;
      
      if (stats) {
        stats.forEach((record: any) => {
          const status = record.status;
          const count = parseInt(record.count);
          
          if (status === 'SENT') sent = count;
          else if (status === 'DELIVERED') delivered = count;
          else if (status === 'BOUNCED') bounced = count;
        });
      }
      
      // Calculate delivery rate
      const deliveryRate = sent > 0 ? Math.round((delivered / sent) * 100) : 0;
      
      setDailyStats({
        sent,
        delivered,
        bounced,
        deliveryRate
      });
      
      // Use type assertion to bypass TypeScript error with group() for sender stats
      const { data: senderData, error: senderError } = await (supabase
        .from("emails")
        .select('sender_id, status, count(*)')
        .eq("campaign_id", campaignId)
        .gte("created_at", today.toISOString()) as any)
        .group('sender_id, status');
      
      if (senderError) throw senderError;
      
      // Process sender stats
      const senderStatsMap = new Map();
      
      if (senderData) {
        senderData.forEach((record: any) => {
          const senderId = record.sender_id;
          const status = record.status;
          const count = parseInt(record.count);
          
          if (!senderStatsMap.has(senderId)) {
            senderStatsMap.set(senderId, {
              senderId,
              senderName: senders.find(s => s.id === senderId)?.name || "Unknown Sender",
              sent: 0,
              delivered: 0,
              bounced: 0
            });
          }
          
          const currentSenderStats = senderStatsMap.get(senderId);
          if (status === 'SENT') currentSenderStats.sent = count;
          else if (status === 'DELIVERED') currentSenderStats.delivered = count;
          else if (status === 'BOUNCED') currentSenderStats.bounced = count;
        });
      }
      
      // Calculate delivery rates for each sender
      const processedSenderStats = Array.from(senderStatsMap.values()).map(sender => {
        const deliveryRate = sender.sent > 0 ? (sender.delivered / sender.sent * 100).toFixed(1) : '0';
        return {
          ...sender,
          deliveryRate
        };
      });
      
      setSenderStats(processedSenderStats);
      
    } catch (err) {
      console.error("Error fetching campaign stats:", err);
      setError("Failed to load campaign statistics");
    }
  };
  
  // Handle campaign selection change
  const handleCampaignChange = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
      setIsActiveCampaign(campaign.status === "ACTIVE");
      await fetchTodaysStats(campaignId);
    }
  };
  
  // Toggle campaign active status
  const toggleCampaignStatus = async () => {
    if (!selectedCampaign) return;
    
    try {
      const newStatus = isActiveCampaign ? "PAUSED" : "ACTIVE";
      
      const { error } = await supabase
        .from("campaigns")
        .update({ status: newStatus })
        .eq("id", selectedCampaign.id);
      
      if (error) throw error;
      
      // If pausing campaign, save the stats to a historical record
      if (isActiveCampaign) {
        await saveCampaignStats();
      }
      
      setIsActiveCampaign(!isActiveCampaign);
      
      // Update the campaign in state
      setCampaigns(campaigns.map(c => 
        c.id === selectedCampaign.id 
          ? { ...c, status: newStatus } 
          : c
      ));
      
      // Update selected campaign
      setSelectedCampaign({
        ...selectedCampaign,
        status: newStatus
      });
      
    } catch (err) {
      console.error("Error updating campaign status:", err);
      setError("Failed to update campaign status");
    }
  };
  
  // Save campaign stats to historical records when campaign is paused
  const saveCampaignStats = async () => {
    if (!selectedCampaign) return;
    
    try {
      // This function would save the current stats to a historical_campaign_stats table
      // Implementation depends on your specific requirements
      console.log("Saving campaign stats to historical records...");
      
      // Example implementation:
      /* 
      const { error } = await supabase
        .from("historical_campaign_stats")
        .insert({
          campaign_id: selectedCampaign.id,
          date: new Date().toISOString(),
          sent: dailyStats.sent,
          delivered: dailyStats.delivered,
          bounced: dailyStats.bounced,
          delivery_rate: dailyStats.deliveryRate,
          sender_stats: senderStats
        });
        
      if (error) throw error;
      */
      
    } catch (err) {
      console.error("Error saving historical stats:", err);
    }
  };
  
  // Calculate campaign progress
  const calculateProgress = () => {
    if (!selectedCampaign) return 0;
    
    const total = selectedCampaign.total_leads || 1; // Avoid division by zero
    return Math.round((dailyStats.sent / total) * 100);
  };
  
  // Format large numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner size="lg" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">Campaign Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Campaign Control Panel */}
      <Card className="mb-6">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-xl font-semibold">Campaign Control Panel</h2>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isActiveCampaign ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm">{isActiveCampaign ? "Active" : "Inactive"}</span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-2">Select Campaign</p>
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="flat"
                    className="w-full justify-between"
                  >
                    {selectedCampaign ? selectedCampaign.name : "Select a campaign"}
                    <span>▼</span>
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Campaign selection">
                  {campaigns.map((campaign) => (
                    <DropdownItem 
                      key={campaign.id}
                      onPress={() => handleCampaignChange(campaign.id)}
                    >
                      {campaign.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
            
            <div>
              {selectedCampaign && (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-2">Campaign Progress</p>
                  <div className="bg-gray-200 h-4 w-full rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                  <p className="text-sm mt-2">
                    {calculateProgress()}% Complete
                    {" "}
                    <span className="text-gray-500">
                      ({dailyStats.sent}/{selectedCampaign.total_leads || 0} emails)
                    </span>
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-3 w-full">
                <span className="text-sm font-medium text-gray-700">{isActiveCampaign ? "On" : "Off"}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={isActiveCampaign}
                    onChange={toggleCampaignStatus}
                    disabled={!selectedCampaign}
                  />
                  <div className={`w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer ${isActiveCampaign ? 'peer-checked:bg-green-600' : 'peer-checked:bg-red-600'} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all`}></div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {isActiveCampaign ? "Click to deactivate" : "Click to activate"}
              </p>
            </div>
          </div>
          
          {selectedCampaign && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
              <Card shadow="sm" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaEnvelope className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Emails Sent Today</p>
                    <p className="text-2xl font-bold">{formatNumber(dailyStats.sent)}</p>
                  </div>
                </div>
              </Card>
              
              <Card shadow="sm" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaCheckCircle className="text-green-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Delivered Today</p>
                    <p className="text-2xl font-bold">{formatNumber(dailyStats.delivered)}</p>
                  </div>
                </div>
              </Card>
              
              <Card shadow="sm" className="p-4">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-3 rounded-full">
                    <FaExclamationTriangle className="text-red-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bounced Today</p>
                    <p className="text-2xl font-bold">{formatNumber(dailyStats.bounced)}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {selectedCampaign && (
            <div className="mt-6">
              <Card shadow="sm" className="overflow-hidden">
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="text-md font-semibold">Today's Performance Metrics</h3>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-6 justify-around">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">{dailyStats.deliveryRate}%</div>
                      <p className="text-sm text-gray-500">Delivery Rate</p>
                    </div>
                    
                    <div className="h-16 w-px bg-gray-200 hidden sm:block"></div>
                    
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        {formatNumber(dailyStats.sent - dailyStats.delivered - dailyStats.bounced)}
                      </div>
                      <p className="text-sm text-gray-500">Pending</p>
                    </div>
                    
                    <div className="h-16 w-px bg-gray-200 hidden sm:block"></div>
                    
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        {senderStats.length}
                      </div>
                      <p className="text-sm text-gray-500">Active Senders</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Add visual breakdown of today's stats */}
      {selectedCampaign && (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Today's Email Status</h3>
          </CardHeader>
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: "Sent", value: dailyStats.sent, color: EMAIL_STATUS_COLORS.sent },
                      { name: "Delivered", value: dailyStats.delivered, color: EMAIL_STATUS_COLORS.delivered },
                      { name: "Bounced", value: dailyStats.bounced, color: EMAIL_STATUS_COLORS.bounced }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: "Sent", value: dailyStats.sent, color: EMAIL_STATUS_COLORS.sent },
                      { name: "Delivered", value: dailyStats.delivered, color: EMAIL_STATUS_COLORS.delivered },
                      { name: "Bounced", value: dailyStats.bounced, color: EMAIL_STATUS_COLORS.bounced }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Sender Performance Section */}
      {selectedCampaign && senderStats.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <h3 className="text-lg font-semibold">Sender Performance Today</h3>
          </CardHeader>
          <CardBody>
            {/* Bar chart visualization of sender performance */}
            <div className="h-80 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={senderStats}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="senderName" 
                    angle={-45} 
                    textAnchor="end"
                    height={70}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sent" name="Sent" fill={EMAIL_STATUS_COLORS.sent} />
                  <Bar dataKey="delivered" name="Delivered" fill={EMAIL_STATUS_COLORS.delivered} />
                  <Bar dataKey="bounced" name="Bounced" fill={EMAIL_STATUS_COLORS.bounced} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sender
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="text-blue-500">Sent</span>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="text-green-500">Delivered</span>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <span className="text-red-500">Bounced</span>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {senderStats.map((sender) => (
                    <tr key={sender.senderId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{sender.senderName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-blue-600 font-medium">{sender.sent}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">{sender.delivered}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-red-600 font-medium">{sender.bounced}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{sender.deliveryRate}%</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Additional Trend Charts */}
      <Card className="mb-6">
        <CardHeader>
          <h3 className="text-lg font-semibold">Campaign Trends</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Line Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Area Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[]} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#82ca9d" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Real-time Activity Feed */}
      {isActiveCampaign && selectedCampaign && (
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Real-time Campaign Activity</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-sm text-gray-500">Live updates</p>
            </div>
          </CardHeader>
          <CardBody>
            <p className="text-center py-8 text-gray-500">
              Real-time activity feed will appear here as emails are processed.
            </p>
            {/* This would be connected to a real-time feed from your backend */}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
