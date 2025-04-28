"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Checkbox,
  Divider,
  Spinner,
} from "@heroui/react";
import { supabase } from "@/lib/supabase";
import { createCampaign, addSendersToCampaign } from "@/lib/database";
import { useTheme } from 'next-themes';

// Types for our form
type LeadSource = {
  id: string;
  name: string;
  file_name: string;
  record_count: number;
  tableName?: string;
};

type Sender = {
  id: string;
  name: string;
  email: string;
  title?: string;
  daily_quota: number;
};

type Template = {
  id: string;
  name: string;
  type: "email" | "document";
  subject?: string;
  content: string;
};

type SenderWithQuota = Sender & {
  isSelected: boolean;
  emailsToSend: number;
};

export default function CampaignForm() {
  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [selectedLeadSource, setSelectedLeadSource] = useState<string>("");
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState<string>("");
  const [selectedDocTemplate, setSelectedDocTemplate] = useState<string>("");
  const [senders, setSenders] = useState<SenderWithQuota[]>([]);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data loading state
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<Template[]>([]);
  const [docTemplates, setDocTemplates] = useState<Template[]>([]);
  const [isLoadingLeadSources, setIsLoadingLeadSources] = useState(true);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingSenders, setIsLoadingSenders] = useState(true);

  // Campaign settings
  const [sendingRate, setSendingRate] = useState<number>(15); // Emails per hour
  const [attachDocument, setAttachDocument] = useState<boolean>(true);
  const { theme } = useTheme();
  const isLeet = theme === 'leet';

  // Fetch lead sources
  const fetchLeadSources = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_sources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeadSources(data || []);
    } catch (error) {
      console.error("Error fetching lead sources:", error);
      setError("Failed to load lead sources. Please try again.");
    } finally {
      setIsLoadingLeadSources(false);
    }
  };

  // Fetch templates (both email and document)
  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const emails = data?.filter((template) => template.type === "email") || [];
      const documents = data?.filter((template) => template.type === "document") || [];

      setEmailTemplates(emails);
      setDocTemplates(documents);
    } catch (error) {
      console.error("Error fetching templates:", error);
      setError("Failed to load templates. Please try again.");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Fetch senders (Gmail accounts)
  const fetchSenders = async () => {
    try {
      const { data, error } = await supabase
        .from("senders")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      // Initialize senders with selection state and quota
      const sendersWithQuota = data?.map((sender) => ({
        ...sender,
        isSelected: false,
        emailsToSend: Math.min(10, sender.daily_quota || 10), // Default to 10 or their daily quota if lower
      })) || [];

      setSenders(sendersWithQuota);
    } catch (error) {
      console.error("Error fetching senders:", error);
      setError("Failed to load senders. Please try again.");
    } finally {
      setIsLoadingSenders(false);
    }
  };

  // Fetch initial data on component mount
  useEffect(() => {
    fetchLeadSources();
    fetchTemplates();
    fetchSenders();
  }, []);

  // Auto-populate campaign name when a lead source is selected
  const handleLeadSourceChange = useCallback(
    (sourceId: string) => {
      setSelectedLeadSource(sourceId);
      const source = leadSources.find((source) => source.id === sourceId);
      if (source) {
        setCampaignName(`${source.name} Campaign`);
      }
    },
    [leadSources]
  );

  // Toggle sender selection
  const toggleSenderSelection = (senderId: string) => {
    setSenders((prevSenders) =>
      prevSenders.map((sender) =>
        sender.id === senderId
          ? { ...sender, isSelected: !sender.isSelected }
          : sender
      )
    );
  };

  // Update emails to send for a specific sender
  const updateSenderEmails = (senderId: string, count: number) => {
    setSenders((prevSenders) =>
      prevSenders.map((sender) =>
        sender.id === senderId
          ? { ...sender, emailsToSend: Math.min(count, sender.daily_quota) }
          : sender
      )
    );
  };

  // Calculate total emails that will be sent in this campaign
  const totalEmails = senders
    .filter((sender) => sender.isSelected)
    .reduce((sum, sender) => sum + sender.emailsToSend, 0);

  // Create campaign
  const handleCreateCampaign = async () => {
    setIsWorking(true);
    setError(null);
    setSuccess(null);

    // Validate form
    if (!campaignName) {
      setError("Campaign name is required");
      setIsWorking(false);
      return;
    }
    
    if (!selectedLeadSource) {
      setError("Please select a lead source");
      setIsWorking(false);
      return;
    }
    
    if (!selectedEmailTemplate) {
      setError("Please select an email template");
      setIsWorking(false);
      return;
    }
    
    if (attachDocument && !selectedDocTemplate) {
      setError("Please select a document template or disable document attachments");
      setIsWorking(false);
      return;
    }

    const selectedSenders = senders.filter((sender) => sender.isSelected);
    if (selectedSenders.length === 0) {
      setError("Please select at least one sender");
      setIsWorking(false);
      return;
    }

    try {
      // 1. Create campaign record
      const campaignData = {
        name: campaignName,
        status: "DRAFT",
        lead_source_id: selectedLeadSource,
        email_template_id: selectedEmailTemplate,
        document_template_id: attachDocument ? selectedDocTemplate : undefined,
        attachment_type: attachDocument ? "PDF" : undefined,
        sending_rate_per_hour: sendingRate,
        tracking_enabled: true, // Default to true
        min_interval_minutes: 5,
        max_interval_minutes: 15,
      };

      const campaignId = await createCampaign(campaignData);

      // 2. Add selected senders to the campaign
      const senderIdsToAdd = selectedSenders.map((sender) => sender.id);
      await addSendersToCampaign(campaignId, senderIdsToAdd);

      // 3. Add leads from the selected source to the campaign
      // This would typically involve fetching the leads first and then adding them
      // For now, we'll set this up in a way that the backend can handle this later
      const source = leadSources.find((source) => source.id === selectedLeadSource);
      if (source && source.tableName) {
        // In a real implementation, you would:
        // 1. Fetch leads from the dynamic table
        // 2. Add them to campaign_leads table
        // For now, we'll show a successful creation message
      }

      setSuccess(`Campaign "${campaignName}" created successfully!`);
      
      // Reset form for next campaign
      setCampaignName("");
      setSelectedLeadSource("");
      setSelectedEmailTemplate("");
      setSelectedDocTemplate("");
      setSenders((prevSenders) => 
        prevSenders.map(sender => ({
          ...sender,
          isSelected: false,
          emailsToSend: Math.min(10, sender.daily_quota || 10)
        }))
      );
      setAttachDocument(true);
      
    } catch (error) {
      console.error("Error creating campaign:", error);
      setError("Failed to create campaign. Please try again.");
    } finally {
      setIsWorking(false);
    }
  };

  // Check if form is ready to submit
  const isFormValid =
    campaignName &&
    selectedLeadSource &&
    selectedEmailTemplate &&
    (!attachDocument || selectedDocTemplate) &&
    senders.some((sender) => sender.isSelected) &&
    !isWorking;

  const isLoading = isLoadingLeadSources || isLoadingTemplates || isLoadingSenders;

  return (
    <div className="max-w-4xl mx-auto bg-green-400/10">
      <Card className={isLeet ? 'bg-black text-green-400 border border-green-400 rounded-none font-mono' : ''}>
        <CardHeader className={`${isLeet ? 'bg-black border-b border-green-400 font-mono text-green-400' : ''} flex flex-col gap-1`}>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold">Create New Campaign</h2>
            <p className="text-sm text-gray-500">
              Configure your campaign settings to target specific leads and manage sender quotas.
            </p>
          </div>
        </CardHeader>

        <CardBody className={`${isLeet ? 'bg-black font-mono text-green-400' : ''} gap-6`}>
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {error && (
                <div className={`${isLeet ? 'bg-black text-red-500 border border-red-500 font-mono' : 'bg-red-50 text-red-700'} p-3 rounded-md mb-4`}>
                  {error}
                </div>
              )}

              {success && (
                <div className={`${isLeet ? 'bg-black text-green-400 border border-green-400 font-mono' : 'bg-green-50 text-green-700'} p-3 rounded-md mb-4`}>
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campaign name */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Campaign Name
                  </label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="w-full"
                  />
                </div>

                {/* Lead Source */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Lead Source
                  </label>
                  <Select
                    placeholder="Select lead source"
                    onChange={(e) => handleLeadSourceChange(e.target.value)}
                    value={selectedLeadSource}
                  >
                    {leadSources.map((source) => (
                      <SelectItem key={source.id}>
                        {source.name} ({source.record_count} leads)
                      </SelectItem>
                    ))}
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leads from this source will be targeted in your campaign
                  </p>
                </div>

                {/* Email Template */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Email Template
                  </label>
                  <Select
                    placeholder="Select email template"
                    onChange={(e) => setSelectedEmailTemplate(e.target.value)}
                    value={selectedEmailTemplate}
                  >
                    {emailTemplates.map((template) => (
                      <SelectItem key={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Document Template */}
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center mb-2">
                    <Checkbox
                      isSelected={attachDocument}
                      onValueChange={setAttachDocument}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium">
                      Attach Purchase Offer Document
                    </label>
                  </div>

                  {attachDocument && (
                    <Select
                      placeholder="Select document template"
                      onChange={(e) => setSelectedDocTemplate(e.target.value)}
                      value={selectedDocTemplate}
                      className="mt-2"
                    >
                      {docTemplates.map((template) => (
                        <SelectItem key={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </Select>
                  )}
                </div>
              </div>

              <Divider className={isLeet ? 'border-green-400' : 'my-6'} />

              {/* Sender Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3">Select Senders</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Choose which email accounts to use for this campaign and set their quotas.
                  Total emails to be sent: <strong>{totalEmails}</strong>
                </p>

                <div className="space-y-4">
                  {senders.map((sender) => (
                    <div
                      key={sender.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex items-center flex-1">
                        <Checkbox
                          isSelected={sender.isSelected}
                          onValueChange={() => toggleSenderSelection(sender.id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{sender.name}</div>
                          <div className="text-sm text-gray-500">{sender.email}</div>
                          {sender.title && (
                            <div className="text-xs text-gray-400">{sender.title}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={sender.daily_quota}
                          value={sender.emailsToSend.toString()}
                          onChange={(e) => updateSenderEmails(sender.id, parseInt(e.target.value) || 0)}
                          disabled={!sender.isSelected}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          of {sender.daily_quota} available
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Divider className="my-6" />

              {/* Campaign Settings */}
              <div>
                <h3 className="text-lg font-medium mb-3">Sending Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Sending Rate (emails per hour)
                    </label>
                    <Select
                      value={sendingRate.toString()}
                      onChange={(e) => setSendingRate(parseInt(e.target.value))}
                    >
                      <SelectItem key="5">5 emails per hour (safest)</SelectItem>
                      <SelectItem key="10">10 emails per hour</SelectItem>
                      <SelectItem key="15">15 emails per hour (recommended)</SelectItem>
                      <SelectItem key="20">20 emails per hour</SelectItem>
                      <SelectItem key="30">30 emails per hour (aggressive)</SelectItem>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Controls how many emails are sent per hour to avoid spam filters
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardBody>

        <CardFooter className={`${isLeet ? 'bg-black border-t border-green-400 font-mono text-green-400' : 'justify-end'} `}>
          <div className="flex gap-2">
            <Button variant="bordered" className={isLeet ? 'border-green-400 text-green-400 font-mono rounded-none' : ''}>
              Cancel
            </Button>
            <Button
              className={isLeet ? 'bg-black text-green-400 border border-green-400 font-mono rounded-none hover:bg-green-400 hover:text-black' : ''}
              isLoading={isWorking}
              isDisabled={!isFormValid}
              onPress={handleCreateCampaign}
            >
              Create Campaign
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}