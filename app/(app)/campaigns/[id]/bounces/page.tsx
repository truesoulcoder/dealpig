"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMediaQuery } from '@/components/hooks/use-media-query';
import { format } from 'date-fns';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

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
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/campaigns/${campaignId}`}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Bounce Report</h1>
          {campaign && <span className="text-muted-foreground">- {campaign.name}</span>}
        </div>
        {bounces.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportCsv}>
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
            <CardContent className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.bounced || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Hard Bounces</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.hard_bounces || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Soft Bounces</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.soft_bounces || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-2">
              <CardTitle className="text-sm">Bounce Rate</CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <p className="text-2xl font-semibold">
                {campaign.stats?.bounce_rate?.toFixed(1) || '0.0'}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Bounced Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {bounces.length === 0 ? (
            <div className="flex justify-center items-center py-10">
              <p className="text-muted-foreground">No bounce data available for this campaign</p>
            </div>
          ) : isMobile ? (
            // Mobile view - card list
            <div className="space-y-4">
              {bounces.map((bounce) => (
                <Card key={bounce.id}>
                  <CardContent className="py-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="font-medium">{bounce.email}</p>
                        <Badge variant={bounce.bounce_type === 'hard' ? 'destructive' : 'outline'}>
                          {bounce.bounce_type}
                        </Badge>
                      </div>
                      {bounce.description && (
                        <p className="text-xs text-muted-foreground">{bounce.description}</p>
                      )}
                      {bounce.bounce_code && (
                        <p className="text-xs">Code: {bounce.bounce_code}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(bounce.timestamp), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Desktop view - table
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Bounce Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bounces.map((bounce) => (
                    <TableRow key={bounce.id}>
                      <TableCell className="font-medium">{bounce.email}</TableCell>
                      <TableCell>
                        <Badge variant={bounce.bounce_type === 'hard' ? 'destructive' : 'outline'}>
                          {bounce.bounce_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {bounce.description || '-'}
                      </TableCell>
                      <TableCell>{bounce.bounce_code || '-'}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {format(new Date(bounce.timestamp), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}