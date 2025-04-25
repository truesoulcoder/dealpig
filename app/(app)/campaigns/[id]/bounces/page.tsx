"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { Card, CardBody, CardHeader, Chip, Button, Spinner, Table } from "@heroui/react";
import { format } from 'date-fns';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Simple CardTitle component since it's not included in @heroui/react
const CardTitle = ({ className = "", children }: { className?: string, children: React.ReactNode }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
);

// Helper for responsive design
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  
  return matches;
};

interface BounceRecord {
  id: string;
  email: string;
  bounce_type: 'hard' | 'soft';
  bounce_code: string | null;
  description: string | null;
  timestamp: string;
  message_id: string | null;
  created_at: string;
}

interface CampaignDetails {
  id: string;
  name: string;
  stats: {
    bounced?: number;
    hard_bounces?: number;
    soft_bounces?: number;
    bounce_rate?: number;
  };
}

export default function CampaignBouncesPage() {
  const { id } = useParams();
  const campaignId = Array.isArray(id) ? id[0] : id;
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [bounces, setBounces] = useState<BounceRecord[]>([]);

  useEffect(() => {
    async function fetchBounceData() {
      setIsLoading(true);
      try {
        // Fetch campaign details
        const { data: campaignData, error: campaignError } = await supabaseClient
          .from('campaigns')
          .select('id, name, stats')
          .eq('id', campaignId)
          .single();
          
        if (campaignError) throw campaignError;
        setCampaign(campaignData);
        
        // Fetch bounce records
        const { data: bounceData, error: bounceError } = await supabaseClient
          .from('email_bounces')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('timestamp', { ascending: false });
          
        if (bounceError) throw bounceError;
        setBounces(bounceData);
      } catch (error) {
        console.error('Error fetching bounce data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (campaignId) {
      fetchBounceData();
    }
  }, [campaignId]);
  
  // Export bounce data as CSV
  const exportCsv = () => {
    if (!bounces.length) return;
    
    const headers = ['Email', 'Bounce Type', 'Bounce Code', 'Description', 'Timestamp'];
    const csvRows = [headers];
    
    bounces.forEach(bounce => {
      csvRows.push([
        bounce.email,
        bounce.bounce_type,
        bounce.bounce_code || '',
        bounce.description || '',
        bounce.timestamp
      ]);
    });
    
    const csvContent = csvRows.map(row => row.map(cell => 
      typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell
    ).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${campaign?.name}-bounces-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Spinner size="md" />
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-40 w-full bg-gray-200 rounded animate-pulse"></div>
        <div className="h-60 w-full bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button color="default" size="sm" as={Link} href={`/campaigns/${campaignId}`}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Bounce Report</h1>
          {campaign && <span className="text-gray-500">- {campaign.name}</span>}
        </div>
        {bounces.length > 0 && (
          <Button color="default" size="sm" onPress={exportCsv}>
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>
      
      {campaign && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Total Bounces</CardTitle>
            </CardHeader>
            <CardBody className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.bounced || 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Hard Bounces</CardTitle>
            </CardHeader>
            <CardBody className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.hard_bounces || 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Soft Bounces</CardTitle>
            </CardHeader>
            <CardBody className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.soft_bounces || 0}
              </p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Bounce Rate</CardTitle>
            </CardHeader>
            <CardBody className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.bounce_rate?.toFixed(1) || '0.0'}%
              </p>
            </CardBody>
          </Card>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Bounced Emails</CardTitle>
        </CardHeader>
        <CardBody>
          {bounces.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-gray-500">No bounce data available for this campaign</p>
            </div>
          ) : isMobile ? (
            // Mobile view - card list
            <div className="space-y-4">
              {bounces.map((bounce) => (
                <Card key={bounce.id}>
                  <CardBody className="py-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{bounce.email}</p>
                        <Chip color={bounce.bounce_type === 'hard' ? 'danger' : 'warning'}>
                          {bounce.bounce_type}
                        </Chip>
                      </div>
                      {bounce.description && (
                        <p className="text-xs text-gray-500">{bounce.description}</p>
                      )}
                      {bounce.bounce_code && (
                        <p className="text-xs">Code: {bounce.bounce_code}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {format(new Date(bounce.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop view - table
            <div className="rounded-md border">
              <Table aria-label="Bounced emails">
                <Table.Header>
                  <Table.Column>Email</Table.Column>
                  <Table.Column>Bounce Type</Table.Column>
                  <Table.Column>Reason</Table.Column>
                  <Table.Column>Code</Table.Column>
                  <Table.Column align="right">Date</Table.Column>
                </Table.Header>
                <Table.Body>
                  {bounces.map((bounce) => (
                    <Table.Row key={bounce.id}>
                      <Table.Cell className="font-medium">{bounce.email}</Table.Cell>
                      <Table.Cell>
                        <Chip color={bounce.bounce_type === 'hard' ? 'danger' : 'warning'}>
                          {bounce.bounce_type}
                        </Chip>
                      </Table.Cell>
                      <Table.Cell className="max-w-xs truncate">
                        {bounce.description || '-'}
                      </Table.Cell>
                      <Table.Cell>{bounce.bounce_code || '-'}</Table.Cell>
                      <Table.Cell className="text-right text-gray-500">
                        {format(new Date(bounce.timestamp), 'MMM d, yyyy HH:mm')}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}