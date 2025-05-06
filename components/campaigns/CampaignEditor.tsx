'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Campaign, Template } from '@/helpers/types'; // Adjust path as needed
import { toast } from 'sonner';
import useSWR from 'swr';

interface CampaignEditorProps {
  campaign: Campaign | null;
  onSave: (campaign: Campaign) => void;
  onCancel: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
});

export function CampaignEditor({ campaign, onSave, onCancel }: CampaignEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [emailTemplateId, setEmailTemplateId] = useState<string | undefined>(undefined);
  const [loiTemplateId, setLoiTemplateId] = useState<string | undefined>(undefined);
  const [leadsPerDay, setLeadsPerDay] = useState(10);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [minIntervalMinutes, setMinIntervalMinutes] = useState(5);
  const [maxIntervalMinutes, setMaxIntervalMinutes] = useState(15);
  const [attachmentType, setAttachmentType] = useState('NONE'); // Or derive from LOI template?
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [companyLogoPath, setCompanyLogoPath] = useState(''); // How to handle uploads?
  const [emailSubject, setEmailSubject] = useState(''); // Override
  const [emailBody, setEmailBody] = useState(''); // Override

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates for dropdowns
  const { data: emailTemplates, error: emailTemplatesError } = useSWR<Template[]>('/api/templates?type=EMAIL', fetcher);
  const { data: loiTemplates, error: loiTemplatesError } = useSWR<Template[]>('/api/templates?type=LOI', fetcher);
  // TODO: Handle template loading errors

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || '');
      setDescription(campaign.description || '');
      setStatus(campaign.status || 'DRAFT');
      setEmailTemplateId(campaign.email_template_id || undefined);
      setLoiTemplateId(campaign.loi_template_id || undefined);
      setLeadsPerDay(campaign.leads_per_day || 10);
      setStartTime(campaign.start_time || '09:00');
      setEndTime(campaign.end_time || '17:00');
      setMinIntervalMinutes(campaign.min_interval_minutes || 5);
      setMaxIntervalMinutes(campaign.max_interval_minutes || 15);
      setAttachmentType(campaign.attachment_type || 'NONE');
      setTrackingEnabled(campaign.tracking_enabled || false);
      setCompanyLogoPath(campaign.company_logo_path || '');
      setEmailSubject(campaign.email_subject || '');
      setEmailBody(campaign.email_body || '');
    } else {
      // Reset form for new campaign
      setName('');
      setDescription('');
      setStatus('DRAFT');
      setEmailTemplateId(undefined);
      setLoiTemplateId(undefined);
      setLeadsPerDay(10);
      setStartTime('09:00');
      setEndTime('17:00');
      setMinIntervalMinutes(5);
      setMaxIntervalMinutes(15);
      setAttachmentType('NONE');
      setTrackingEnabled(false);
      setCompanyLogoPath('');
      setEmailSubject('');
      setEmailBody('');
    }
  }, [campaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!emailTemplateId) {
        setError('Email template is required.');
        setIsLoading(false);
        return;
    }

    const campaignData: Partial<Campaign> = {
      name,
      description,
      status,
      email_template_id: emailTemplateId,
      loi_template_id: loiTemplateId,
      leads_per_day: Number(leadsPerDay),
      start_time: startTime,
      end_time: endTime,
      min_interval_minutes: Number(minIntervalMinutes),
      max_interval_minutes: Number(maxIntervalMinutes),
      attachment_type: attachmentType,
      tracking_enabled: trackingEnabled,
      company_logo_path: companyLogoPath || null,
      email_subject: emailSubject || null,
      email_body: emailBody || null,
    };

    try {
      const url = campaign ? `/api/campaigns/${campaign.id}` : '/api/campaigns';
      const method = campaign ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${campaign ? 'update' : 'create'} campaign`);
      }

      const savedCampaign = await response.json();
      toast.success(`Campaign ${campaign ? 'updated' : 'created'} successfully!`);
      onSave(savedCampaign);
    } catch (err) {
      console.error('Save error:', err);
      setError((err as Error).message || 'An unexpected error occurred.');
      toast.error((err as Error).message || `An error occurred while ${campaign ? 'updating' : 'creating'} the campaign.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3">
      {error && <p className="text-red-500 text-sm">Error: {error}</p>}
      
      <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
            </Select>
         </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div>
            <Label htmlFor="emailTemplate">Email Template</Label>
            <Select value={emailTemplateId} onValueChange={setEmailTemplateId} required>
                <SelectTrigger id="emailTemplate">
                    <SelectValue placeholder="Select email template" />
                </SelectTrigger>
                <SelectContent>
                    {emailTemplatesError && <SelectItem value="error" disabled>Error loading templates</SelectItem>}
                    {!emailTemplates && !emailTemplatesError && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    {emailTemplates?.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
         </div>
          <div>
            <Label htmlFor="loiTemplate">LOI Template (Optional)</Label>
             <Select value={loiTemplateId} onValueChange={setLoiTemplateId}>
                <SelectTrigger id="loiTemplate">
                    <SelectValue placeholder="Select LOI template (optional)" />
                </SelectTrigger>
                <SelectContent>
                    {loiTemplatesError && <SelectItem value="error" disabled>Error loading templates</SelectItem>}
                    {!loiTemplates && !loiTemplatesError && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                    <SelectItem value="">None</SelectItem> {/* Option for no LOI */}
                    {loiTemplates?.map(template => (
                        <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
      </div>
      
       {/* Optional Overrides */}
      <details className="space-y-2 border rounded p-2">
          <summary className="cursor-pointer font-medium text-sm">Overrides (Optional)</summary>
          <div>
             <Label htmlFor="emailSubject">Override Email Subject</Label>
             <Input id="emailSubject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Uses template subject if blank" />
          </div>
          <div>
             <Label htmlFor="emailBody">Override Email Body</Label>
             <Textarea id="emailBody" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Uses template body if blank" className="min-h-[150px]"/>
          </div>
       </details>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="leadsPerDay">Leads Per Day</Label>
          <Input id="leadsPerDay" type="number" value={leadsPerDay} onChange={(e) => setLeadsPerDay(Number(e.target.value))} min="1" />
        </div>
        <div>
           <Label htmlFor="attachmentType">Attachment Type</Label>
            <Select value={attachmentType} onValueChange={setAttachmentType} disabled={!loiTemplateId}> {/* Disable if no LOI selected */}
                <SelectTrigger id="attachmentType">
                    <SelectValue placeholder="Attachment Type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="NONE" disabled={!!loiTemplateId}>None</SelectItem> {/* Disable if LOI selected */}
                    <SelectItem value="PDF" disabled={!loiTemplateId}>PDF</SelectItem>
                    {/* Add other types if needed */}
                </SelectContent>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startTime">Send Start Time (HH:MM)</Label>
          <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="endTime">Send End Time (HH:MM)</Label>
          <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="minInterval">Min Send Interval (minutes)</Label>
          <Input id="minInterval" type="number" value={minIntervalMinutes} onChange={(e) => setMinIntervalMinutes(Number(e.target.value))} min="1" />
        </div>
        <div>
          <Label htmlFor="maxInterval">Max Send Interval (minutes)</Label>
          <Input id="maxInterval" type="number" value={maxIntervalMinutes} onChange={(e) => setMaxIntervalMinutes(Number(e.target.value))} min="1" />
        </div>
      </div>

      {/* TODO: Add fields for company logo upload/selection */}
      {/* <div>
        <Label htmlFor="companyLogoPath">Company Logo Path</Label>
        <Input id="companyLogoPath" value={companyLogoPath} onChange={(e) => setCompanyLogoPath(e.target.value)} placeholder="e.g., /logos/company.png" />
      </div> */}

      <div className="flex items-center space-x-2">
        <Switch id="trackingEnabled" checked={trackingEnabled} onCheckedChange={setTrackingEnabled} />
        <Label htmlFor="trackingEnabled">Enable Open/Click Tracking</Label>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Campaign'}
        </Button>
      </div>
    </form>
  );
}
