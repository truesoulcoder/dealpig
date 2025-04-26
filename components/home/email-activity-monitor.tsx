"use client";

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardBody, CardHeader, Avatar, Spinner, Badge, Button } from "@heroui/react";
import { MdClear } from "react-icons/md";

interface EmailActivity {
  id: string;
  timestamp: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  status: string;
  campaign_id?: string;
  campaign_name?: string;
  sender_name?: string;
  error?: string;
}

interface EmailActivityMonitorProps {
  selectedCampaignIds?: string[];
}

export default function EmailActivityMonitor({ selectedCampaignIds }: EmailActivityMonitorProps) {
  const [activities, setActivities] = useState<EmailActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Connect to Supabase realtime channel
  useEffect(() => {
    setLoading(true);
    
    // Subscribe to real-time updates on the emails table
    const channel = supabase
      .channel('email-activity')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'emails'
      }, (payload) => {
        console.log('New email activity:', payload);
        const { new: newRecord, eventType, old } = payload;
        
        // Skip if we have campaign filter and this email is not from selected campaigns
        if (selectedCampaignIds?.length && 
            'campaign_id' in newRecord && 
            newRecord.campaign_id && 
            !selectedCampaignIds.includes(newRecord.campaign_id)) {
          return;
        }
        
        const activity: EmailActivity = {
          id: newRecord.id,
          timestamp: new Date().toISOString(),
          sender_email: newRecord.sender_email || '',
          recipient_email: newRecord.recipient_email || '',
          subject: newRecord.subject || '',
          status: newRecord.status || '',
          campaign_id: newRecord.campaign_id,
          campaign_name: newRecord.campaign_name,
          sender_name: newRecord.sender_name
        };
        
        if (eventType === 'INSERT') {
          setActivities(prev => [activity, ...prev].slice(0, 50));
        } else if (eventType === 'UPDATE') {
          setActivities(prev => [
            activity,
            ...prev.filter(a => a.id !== activity.id)
          ].slice(0, 50));
        }
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
        setLoading(false);
      });
      
    // Get recent email activities to populate initially
    const fetchRecentActivities = async () => {
      try {
        let query = supabase
          .from('emails')
          .select('*, campaigns(name)')
          .order('created_at', { ascending: false });
          
        // Apply campaign filter if provided
        if (selectedCampaignIds?.length) {
          query = query.in('campaign_id', selectedCampaignIds);
        }
        
        const { data, error } = await query.limit(10);
          
        if (error) throw error;
        
        if (data) {
          const formattedActivities: EmailActivity[] = data.map(item => ({
            id: item.id,
            timestamp: item.created_at,
            sender_email: item.sender_email || '',
            recipient_email: item.recipient_email || '',
            subject: item.subject || '',
            status: item.status || '',
            campaign_id: item.campaign_id,
            campaign_name: item.campaigns?.name,
            sender_name: item.sender_name
          }));
          
          setActivities(formattedActivities);
        }
      } catch (error) {
        console.error('Error fetching recent email activities:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentActivities();
    
    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCampaignIds]);
  
  // Auto-scroll to the latest activity
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities]);
  
  // Clear activities
  const handleClearActivities = () => {
    setActivities([]);
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'success';
      case 'failed':
        return 'danger';
      case 'opened':
        return 'primary';
      case 'clicked':
        return 'secondary';
      case 'replied':
        return 'warning';
      case 'bounced':
        return 'error';
      case 'processing':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Live Email Activity</h2>
          {isConnected ? (
            <Badge color="success" variant="flat" className="animate-pulse">Live</Badge>
          ) : (
            <Badge color="default" variant="flat">Disconnected</Badge>
          )}
        </div>
        <Button 
          variant="light" 
          isIconOnly
          onPress={handleClearActivities}
          aria-label="Clear activities"
        >
          <MdClear />
        </Button>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Spinner size="lg" color="primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center flex-col gap-4 text-center">
            <p className="text-gray-500">No email activity detected yet.</p>
            <p className="text-sm text-gray-400">
              Email activity will appear here in real time while campaigns are running.
            </p>
          </div>
        ) : (
          <div 
            ref={scrollRef} 
            className="h-[300px] overflow-y-auto flex flex-col-reverse"
          >
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id + activity.timestamp}
                  className="p-2 border border-gray-200 rounded-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <Avatar 
                        name={activity.sender_name || activity.sender_email} 
                        size="sm"
                      />
                      <div>
                        <p className="text-sm font-medium">{activity.sender_name || activity.sender_email}</p>
                        <p className="text-xs text-gray-500">{activity.recipient_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={getStatusColor(activity.status)} variant="flat">
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mt-1 font-medium truncate">{activity.subject}</p>
                  {activity.campaign_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Campaign: {activity.campaign_name}
                    </p>
                  )}
                  {activity.error && (
                    <p className="text-xs text-red-500 mt-1">
                      Error: {activity.error}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}