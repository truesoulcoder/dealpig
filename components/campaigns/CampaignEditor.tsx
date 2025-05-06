'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@heroui/react';
import { Textarea } from '@heroui/react';
import { Select, SelectItem } from '@heroui/select';
import { Switch } from '@heroui/react';
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
            <Input id="name" label="Campaign Name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Select
                id="status"
                label="Status"
                aria-label="Status"
                placeholder="Select status"
                selectedKeys={status ? [status] : []}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys as Set<string>)[0];
                    setStatus(selectedKey || 'DRAFT'); 
                }}
            >
                <SelectItem key="DRAFT">Draft</SelectItem>
                <SelectItem key="ACTIVE">Active</SelectItem>
                <SelectItem key="PAUSED">Paused</SelectItem>
                <SelectItem key="COMPLETED">Completed</SelectItem>
            </Select>
         </div>
      </div>

      <div>
        <Textarea id="description" label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div>
            <Select 
                id="emailTemplate"
                label="Email Template"
                aria-label="Email Template"
                placeholder="Select email template"
                selectedKeys={emailTemplateId ? [emailTemplateId] : []}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys as Set<string>)[0];
                    setEmailTemplateId(selectedKey);
                }}
                required
            >
                {emailTemplatesError && <SelectItem key="error-loading-email" isDisabled>Error loading templates</SelectItem>}
                {!emailTemplates && !emailTemplatesError && <SelectItem key="loading-email" isDisabled>Loading...</SelectItem>}
                {emailTemplates?.map(template => (
                    <SelectItem key={template.id}>{template.name}</SelectItem>
                ))}
            </Select>
         </div>
          <div>
            <Select 
                id="loiTemplate"
                label="LOI Template (Optional)"
                aria-label="LOI Template"
                placeholder="Select LOI template (optional)"
                selectedKeys={loiTemplateId ? [loiTemplateId] : []}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys as Set<string>)[0];
                    setLoiTemplateId(selectedKey === undefined ? '' : selectedKey);
                }}
            >
                {loiTemplatesError && <SelectItem key="error-loading-loi" isDisabled>Error loading templates</SelectItem>}
                {!loiTemplates && !loiTemplatesError && <SelectItem key="loading-loi" isDisabled>Loading...</SelectItem>}
                <SelectItem key="">None</SelectItem>
                {loiTemplates?.map(template => (
                    <SelectItem key={template.id}>{template.name}</SelectItem>
                ))}
            </Select>
          </div>
      </div>
      
       {/* Optional Overrides */}
      <details className="space-y-2 border rounded p-2">
          <summary className="cursor-pointer font-medium text-sm">Overrides (Optional)</summary>
          <div>
             <Input id="emailSubject" label="Override Email Subject" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} placeholder="Uses template subject if blank" />
          </div>
          <div>
             <Textarea id="emailBody" label="Override Email Body" value={emailBody} onChange={(e) => setEmailBody(e.target.value)} placeholder="Uses template body if blank" className="min-h-[150px]"/>
          </div>
       </details>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input id="leadsPerDay" label="Leads Per Day" type="number" value={String(leadsPerDay)} onChange={(e) => setLeadsPerDay(Number(e.target.value))} min="1" />
        </div>
        <div>
           <Select 
                id="attachmentType"
                label="Attachment Type"
                aria-label="Attachment Type"
                placeholder="Attachment Type"
                selectedKeys={attachmentType ? [attachmentType] : []}
                onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys as Set<string>)[0];
                    setAttachmentType(selectedKey || 'NONE');
                }}
                disabled={!loiTemplateId}
            >
                <SelectItem key="NONE" isDisabled={!!loiTemplateId}>None</SelectItem>
                <SelectItem key="PDF" isDisabled={!loiTemplateId}>PDF</SelectItem>
            </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input id="startTime" label="Send Start Time (HH:MM)" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Input id="endTime" label="Send End Time (HH:MM)" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input id="minInterval" label="Min Send Interval (minutes)" type="number" value={String(minIntervalMinutes)} onChange={(e) => setMinIntervalMinutes(Number(e.target.value))} min="1" />
        </div>
        <div>
          <Input id="maxInterval" label="Max Send Interval (minutes)" type="number" value={String(maxIntervalMinutes)} onChange={(e) => setMaxIntervalMinutes(Number(e.target.value))} min="1" />
        </div>
      </div>

      {/* <div>
        <Input id="companyLogoPath" label="Company Logo Path" value={companyLogoPath} onChange={(e) => setCompanyLogoPath(e.target.value)} placeholder="e.g., /logos/company.png" />
      </div> */}

      <div className="flex items-center space-x-2">
        <Switch 
            id="trackingEnabled" 
            isSelected={trackingEnabled} 
            onValueChange={setTrackingEnabled} 
            aria-label="Enable Open/Click Tracking"
        />
        <span>Enable Open/Click Tracking</span>
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
