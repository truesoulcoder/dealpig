"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface CampaignAnalyticsProps {
  stats: any;
  isMobile?: boolean;
}

export function CampaignAnalytics({ stats, isMobile = false }: CampaignAnalyticsProps) {
  if (!stats) return null;

  // Prepare data for email status chart
  const emailStatusData = [
    { name: 'Delivered', value: stats.delivered, fill: '#4ade80' },
    { name: 'Opened', value: stats.opened, fill: '#60a5fa' },
    { name: 'Clicked', value: stats.clicked, fill: '#a78bfa' },
    { name: 'Replied', value: stats.replied, fill: '#f59e0b' },
    { name: 'Bounced', value: stats.bounced, fill: '#ef4444' }
  ];

  // Prepare data for rates chart
  const ratesData = [
    { name: 'Open Rate', rate: stats.open_rate || 0 },
    { name: 'Click Rate', rate: stats.click_rate || 0 },
    { name: 'Bounce Rate', rate: stats.bounce_rate || 0 }
  ];

  // Custom colors
  const COLORS = ['#4ade80', '#60a5fa', '#a78bfa', '#f59e0b', '#ef4444'];

  return (
    <div className="w-full">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {stats.campaign_name}
          </CardTitle>
        </CardHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start px-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="status">Email Status</TabsTrigger>
            <TabsTrigger value="rates">Rates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="p-4">
            <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-5'} gap-4`}>
              <StatCard 
                title="Total Emails" 
                value={stats.total_emails_sent} 
                icon="📧"
                isMobile={isMobile} 
              />
              <StatCard 
                title="Opened" 
                value={stats.opened} 
                subValue={`${stats.open_rate}%`}
                icon="👁️"
                isMobile={isMobile}
              />
              <StatCard 
                title="Clicked" 
                value={stats.clicked} 
                subValue={`${stats.click_rate}%`}
                icon="👆"
                isMobile={isMobile}
              />
              <StatCard 
                title="Replied" 
                value={stats.replied} 
                subValue={`${(stats.replied / stats.total_emails_sent * 100).toFixed(2)}%`}
                icon="💬"
                isMobile={isMobile}
              />
              <StatCard 
                title="Bounced" 
                value={stats.bounced} 
                subValue={`${stats.bounce_rate}%`} 
                icon="↩️"
                isNegative={true}
                isMobile={isMobile}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="status" className={`${isMobile ? 'h-72' : 'h-96'} p-4`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emailStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 60}
                  outerRadius={isMobile ? 80 : 100}
                  fill="#8884d8"
                  paddingAngle={3}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {emailStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="rates" className={`${isMobile ? 'h-72' : 'h-96'} p-4`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ratesData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, 'Rate']} />
                <Bar dataKey="rate" name="Percentage" fill="#6366f1">
                  {
                    ratesData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.name === 'Bounce Rate' 
                            ? '#ef4444' 
                            : entry.name === 'Open Rate' 
                              ? '#4ade80' 
                              : '#60a5fa'
                        } 
                      />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  subValue?: string;
  icon?: string;
  isNegative?: boolean;
  isMobile?: boolean;
}

function StatCard({ 
  title, 
  value, 
  subValue, 
  icon, 
  isNegative = false,
  isMobile = false 
}: StatCardProps) {
  return (
    <Card className={`${isMobile ? '' : 'p-2'}`}>
      <CardContent className={`flex flex-col items-center justify-center ${isMobile ? 'p-2' : 'p-4'}`}>
        <div className="text-2xl mb-1">{icon}</div>
        <h4 className={`${isMobile ? 'text-sm' : 'text-base'} font-medium text-muted-foreground`}>
          {title}
        </h4>
        <p className={`text-xl font-bold ${isNegative ? 'text-red-500' : ''}`}>
          {value.toLocaleString()}
        </p>
        {subValue && (
          <p className={`text-sm ${isNegative ? 'text-red-400' : 'text-muted-foreground'}`}>
            {subValue}
          </p>
        )}
      </CardContent>
    </Card>
  );
}