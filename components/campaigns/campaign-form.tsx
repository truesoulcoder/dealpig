"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardFooter, Input, Button, Select, Textarea, Checkbox, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react";
import { FaPlus, FaSave, FaTimes, FaUsers, FaList } from "react-icons/fa";
import { createCampaign, getTemplates, getCampaigns, getSenders, addSendersToCampaign, addLeadsToCampaign, getLeads } from '@/lib/database';
import { useRouter } from 'next/navigation';

// Custom SelectItem as a workaround for @heroui/react component
const SelectItem = (props: any) => (
  <option value={props.value}>{props.children}</option>
);

interface CampaignFormProps {
  campaignId?: string;
  isEdit?: boolean;
}

export default function CampaignForm({ campaignId, isEdit = false }: CampaignFormProps) {
  const router = useRouter();
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emailTemplateId, setEmailTemplateId] = useState('');
  const [loiTemplateId, setLoiTemplateId] = useState('');
  const [leadsPerDay, setLeadsPerDay] = useState(20);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [minInterval, setMinInterval] = useState(15);
  const [maxInterval, setMaxInterval] = useState(60);
  const [attachmentType, setAttachmentType] = useState('PDF');
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  
  // Data for selectors
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [loiTemplates, setLoiTemplates] = useState<any[]>([]);
  const [senders, setSenders] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  // Selections
  const [selectedSenders, setSelectedSenders] = useState<string[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Modal states
  const [showSendersModal, setShowSendersModal] = useState(false);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  
  // Validation
  const [errors, setErrors] = useState<any>({});
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        // Load templates
        const emailTemplatesData = await getTemplates('email');
        setEmailTemplates(emailTemplatesData);
        
        const loiTemplatesData = await getTemplates('document');
        setLoiTemplates(loiTemplatesData);
        
        // Load senders
        const sendersData = await getSenders();
        setSenders(sendersData);
        
        // Load leads
        const leadsData = await getLeads();
        setLeads(leadsData);
        
        // If editing, load campaign data
        if (isEdit && campaignId) {
          const campaigns = await getCampaigns();
          const campaign = campaigns.find(c => c.id === campaignId);
          
          if (campaign) {
            setName(campaign.name);
            setDescription(campaign.description || '');
            setEmailTemplateId(campaign.email_template_id || '');
            setLoiTemplateId(campaign.loi_template_id || '');
            setLeadsPerDay(campaign.leads_per_day || 20);
            setStartTime(campaign.start_time?.substring(0, 5) || '09:00');
            setEndTime(campaign.end_time?.substring(0, 5) || '17:00');
            setMinInterval(campaign.min_interval_minutes || 15);
            setMaxInterval(campaign.max_interval_minutes || 60);
            setAttachmentType(campaign.attachment_type || 'PDF');
            // Use optional chaining for potentially missing property
            setTrackingEnabled(campaign.tracking_enabled ?? true); 
            
            // TODO: Load campaign senders and leads
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, [campaignId, isEdit]);
  
  // Validate form
  const validateForm = () => {
    const newErrors: any = {};
    
    if (!name) newErrors.name = 'Campaign name is required';
    if (!emailTemplateId) newErrors.emailTemplateId = 'Email template is required';
    if (!loiTemplateId) newErrors.loiTemplateId = 'LOI template is required';
    if (leadsPerDay < 1) newErrors.leadsPerDay = 'Must be at least 1';
    if (minInterval < 1) newErrors.minInterval = 'Must be at least 1 minute';
    if (maxInterval <= minInterval) newErrors.maxInterval = 'Max interval must be greater than min interval';
    if (!startTime) newErrors.startTime = 'Start time is required';
    if (!endTime) newErrors.endTime = 'End time is required';
    if (selectedSenders.length === 0) newErrors.senders = 'At least one sender is required';
    if (selectedLeadIds.length === 0) newErrors.leads = 'At least one lead is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const campaignData: any = {
        name,
        description,
        email_template_id: emailTemplateId,
        loi_template_id: loiTemplateId,
        leads_per_day: leadsPerDay,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        min_interval_minutes: minInterval,
        max_interval_minutes: maxInterval,
        attachment_type: attachmentType,
        status: 'DRAFT'
      };
      
      // Add tracking_enabled if your API supports it
      campaignData.tracking_enabled = trackingEnabled;
      
      const newCampaign = await createCampaign(campaignData);
      
      if (newCampaign?.id) {
        // Add senders to campaign
        await addSendersToCampaign(newCampaign.id, selectedSenders);
        
        // Add leads to campaign
        await addLeadsToCampaign(newCampaign.id, selectedLeadIds);
        
        // Navigate to campaign dashboard
        router.push('/');
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle lead selection
  const toggleLead = (leadId: string) => {
    setSelectedLeadIds(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };
  
  // Toggle sender selection
  const toggleSender = (senderId: string) => {
    setSelectedSenders(prev => {
      if (prev.includes(senderId)) {
        return prev.filter(id => id !== senderId);
      } else {
        return [...prev, senderId];
      }
    });
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <h1 className="text-xl font-bold">{isEdit ? 'Edit Campaign' : 'Create New Campaign'}</h1>
          </CardHeader>
          <CardBody className="space-y-6">
            {/* Campaign Details */}
            <div>
              <h2 className="text-lg font-medium mb-3">Campaign Details</h2>
              <div className="space-y-4">
                <Input
                  label="Campaign Name"
                  placeholder="Enter a name for this campaign"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  isRequired
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                />
                <Textarea
                  label="Description (optional)"
                  placeholder="Enter a description for this campaign"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            
            {/* Templates */}
            <div>
              <h2 className="text-lg font-medium mb-3">Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Email Template"
                  placeholder="Select an email template"
                  value={emailTemplateId}
                  onChange={(e) => setEmailTemplateId(e.target.value)}
                  isRequired
                  isInvalid={!!errors.emailTemplateId}
                  errorMessage={errors.emailTemplateId}
                >
                  {emailTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  label="LOI Template"
                  placeholder="Select an LOI template"
                  value={loiTemplateId}
                  onChange={(e) => setLoiTemplateId(e.target.value)}
                  isRequired
                  isInvalid={!!errors.loiTemplateId}
                  errorMessage={errors.loiTemplateId}
                >
                  {loiTemplates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>
            
            {/* Schedule Settings */}
            <div>
              <h2 className="text-lg font-medium mb-3">Schedule Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  type="number"
                  label="Leads Per Day"
                  placeholder="20"
                  value={leadsPerDay.toString()}
                  onChange={(e) => setLeadsPerDay(parseInt(e.target.value) || 0)}
                  isRequired
                  min={1}
                  max={500}
                  isInvalid={!!errors.leadsPerDay}
                  errorMessage={errors.leadsPerDay}
                />
                <Select
                  label="Attachment Type"
                  value={attachmentType}
                  onChange={(e) => setAttachmentType(e.target.value)}
                >
                  <SelectItem key="PDF" value="PDF">
                    PDF
                  </SelectItem>
                  <SelectItem key="DOCX" value="DOCX">
                    DOCX
                  </SelectItem>
                </Select>
                <Input
                  type="time"
                  label="Start Time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  isRequired
                  isInvalid={!!errors.startTime}
                  errorMessage={errors.startTime}
                />
                <Input
                  type="time"
                  label="End Time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  isRequired
                  isInvalid={!!errors.endTime}
                  errorMessage={errors.endTime}
                />
                <Input
                  type="number"
                  label="Minimum Interval (minutes)"
                  placeholder="15"
                  value={minInterval.toString()}
                  onChange={(e) => setMinInterval(parseInt(e.target.value) || 0)}
                  isRequired
                  min={1}
                  max={120}
                  isInvalid={!!errors.minInterval}
                  errorMessage={errors.minInterval}
                />
                <Input
                  type="number"
                  label="Maximum Interval (minutes)"
                  placeholder="60"
                  value={maxInterval.toString()}
                  onChange={(e) => setMaxInterval(parseInt(e.target.value) || 0)}
                  isRequired
                  min={1}
                  max={240}
                  isInvalid={!!errors.maxInterval}
                  errorMessage={errors.maxInterval}
                />
              </div>
            </div>
            
            {/* Email Tracking Settings */}
            <div>
              <h2 className="text-lg font-medium mb-3">Email Tracking Settings</h2>
              <div className="flex items-start space-x-4">
                <Checkbox
                  isSelected={trackingEnabled}
                  onValueChange={setTrackingEnabled}
                  size="lg"
                >
                  Enable Email Tracking
                </Checkbox>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                When enabled, emails will include tracking for opens, clicks, and replies. 
                This helps measure campaign performance.
              </p>
            </div>
            
            {/* Senders and Leads */}
            <div>
              <h2 className="text-lg font-medium mb-3">Senders and Leads</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Select email senders for this campaign</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSenders.map((senderId) => {
                      const sender = senders.find(s => s.id === senderId);
                      return sender ? (
                        <Chip 
                          key={sender.id} 
                          onClose={() => toggleSender(sender.id)}
                          variant="flat"
                        >
                          {sender.name || sender.email}
                        </Chip>
                      ) : null;
                    })}
                  </div>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<FaUsers />}
                    onPress={() => setShowSendersModal(true)}
                    className="w-full"
                  >
                    Select Senders
                  </Button>
                  {errors.senders && <p className="text-red-500 text-sm mt-1">{errors.senders}</p>}
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">Select leads for this campaign</p>
                  <div className="flex mb-2">
                    <span className="text-sm font-medium">{selectedLeadIds.length} leads selected</span>
                  </div>
                  <Button
                    color="primary"
                    variant="flat"
                    startContent={<FaList />}
                    onPress={() => setShowLeadsModal(true)}
                    className="w-full"
                  >
                    Select Leads
                  </Button>
                  {errors.leads && <p className="text-red-500 text-sm mt-1">{errors.leads}</p>}
                </div>
              </div>
            </div>
          </CardBody>
          
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="flat"
              onPress={() => router.back()}
              startContent={<FaTimes />}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              type="submit"
              isLoading={isLoading}
              startContent={<FaSave />}
            >
              {isEdit ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </CardFooter>
        </Card>
      </form>
      
      {/* Senders Selection Modal */}
      <Modal isOpen={showSendersModal} onOpenChange={(open) => setShowSendersModal(open)}>
        <ModalContent>
          <ModalHeader>Select Senders</ModalHeader>
          <ModalBody>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {senders.map(sender => (
                <div key={sender.id} className="flex items-center p-2 border-b">
                  <Checkbox
                    isSelected={selectedSenders.includes(sender.id)}
                    onValueChange={() => toggleSender(sender.id)}
                  />
                  <div className="ml-2">
                    <p className="font-medium">{sender.name || 'Unnamed'}</p>
                    <p className="text-sm text-gray-500">{sender.email}</p>
                  </div>
                </div>
              ))}
              {senders.length === 0 && (
                <p className="text-center py-4 text-gray-500">No senders found. Please add senders first.</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowSendersModal(false)}>
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Leads Selection Modal */}
      <Modal isOpen={showLeadsModal} onOpenChange={(open) => setShowLeadsModal(open)}>
        <ModalContent>
          <ModalHeader>Select Leads</ModalHeader>
          <ModalBody>
            <Input
              placeholder="Search leads by address or city..."
              className="mb-4"
              // Add search functionality here
            />
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {leads.map(lead => (
                <div key={lead.id} className="flex items-center p-2 border-b">
                  <Checkbox
                    isSelected={selectedLeadIds.includes(lead.id)}
                    onValueChange={() => toggleLead(lead.id)}
                  />
                  <div className="ml-2">
                    <p className="font-medium">{lead.property_address}</p>
                    <p className="text-sm text-gray-500">{lead.property_city}, {lead.property_state} {lead.property_zip}</p>
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-center py-4 text-gray-500">No leads found. Please import leads first.</p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setShowLeadsModal(false)}>
              Done ({selectedLeadIds.length} selected)
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}