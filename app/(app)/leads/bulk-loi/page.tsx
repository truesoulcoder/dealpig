"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardFooter, Button, Spinner, Select, Chip } from "@heroui/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/app/providers/trpc-provider';
import { FaFileAlt, FaDownload, FaEnvelope } from 'react-icons/fa';

// Temporary solution for missing SelectItem
const SelectItem = ({ children, value, ...props }: { children: React.ReactNode, value: string, [key: string]: any }) => (
  <option value={value} {...props}>{children}</option>
);

export default function BulkLoiPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadIds = searchParams.get('ids')?.split(',') || [];
  
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLois, setGeneratedLois] = useState<Array<{id: string, url: string}>>([]);
  const [selectedLeads, setSelectedLeads] = useState<Array<string>>(leadIds);
  
  // Get templates query
  const templatesQuery = trpc.documents.getTemplates.useQuery({ type: 'loi' });
  
  // Get leads details
  const leadsQuery = trpc.leads.getBulkLeads.useQuery({ ids: leadIds }, {
    enabled: leadIds.length > 0
  });

  // LOI generation mutation
  const generateLoiMutation = trpc.documents.generateBulkLoi.useMutation({
    onSuccess: (data) => {
      setGeneratedLois(data);
      setIsGenerating(false);
    },
    onError: (error) => {
      alert(`Error generating LOIs: ${error.message}`);
      setIsGenerating(false);
    }
  });
  
  // LOI email sending mutation
  const sendLoiEmailMutation = trpc.emails.sendBulkLoiEmail.useMutation({
    onSuccess: () => {
      alert('LOI emails sent successfully!');
      router.push('/leads');
    },
    onError: (error) => {
      alert(`Error sending LOI emails: ${error.message}`);
    }
  });

  // Handle template change
  const handleTemplateChange = (template: string) => {
    setSelectedTemplate(template);
  };
  
  // Handle LOI generation
  const handleGenerateLois = async () => {
    if (selectedLeads.length === 0) {
      alert('Please select at least one lead');
      return;
    }
    
    setIsGenerating(true);
    
    try {
      await generateLoiMutation.mutateAsync({
        leadIds: selectedLeads,
        templateId: selectedTemplate === 'default' ? undefined : selectedTemplate
      });
    } catch (error) {
      // Error is handled by the mutation
    }
  };
  
  // Handle email with LOIs
  const handleSendWithEmail = () => {
    if (generatedLois.length === 0) {
      alert('Please generate LOIs first');
      return;
    }
    
    const loiDetails = generatedLois.map(loi => ({
      leadId: loi.id,
      loiUrl: loi.url
    }));
    
    sendLoiEmailMutation.mutate({ lois: loiDetails });
  };
  
  // Handle download all LOIs
  const handleDownloadAll = () => {
    generatedLois.forEach(loi => {
      const link = document.createElement('a');
      link.href = loi.url;
      link.download = `LOI-${loi.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };
  
  // Handle cancel
  const handleCancel = () => {
    router.back();
  };
  
  if (leadIds.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardBody className="text-center py-8">
            <h2 className="text-xl font-semibold mb-4">No leads selected</h2>
            <p className="text-gray-500 mb-4">Please select leads from the leads table to generate LOIs.</p>
            <Button color="primary" onClick={() => router.push('/leads')}>
              Return to Leads
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (leadsQuery.isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12">
            <Spinner size="lg" />
            <p className="mt-4">Loading lead information...</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Bulk LOI Generation</h1>
          <p className="text-gray-500">
            Generate Letters of Intent for {selectedLeads.length} lead(s)
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
            <div className="w-full">
              <h2 className="text-lg font-semibold mb-2">LOI Settings</h2>
              <p className="text-sm text-gray-500">
                Customize your Letter of Intent generation settings
              </p>
            </div>
            {templatesQuery.data && templatesQuery.data.length > 0 && (
              <div className="w-full sm:w-1/3">
                <Select
                  label="LOI Template"
                  placeholder="Select a template"
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <SelectItem key="default" value="default">Default Template</SelectItem>
                  {templatesQuery.data.map((template) => (
                    <SelectItem key={template.id} value={template.id || ''}>
                      {template.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          <div className="border rounded-lg p-4">
            <h3 className="text-md font-medium mb-4">Selected Properties</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {leadsQuery.data?.map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-2 border rounded-md">
                  <div>
                    <p className="font-medium">{lead.property_address}</p>
                    <p className="text-sm text-gray-500">
                      {lead.property_city}, {lead.property_state} {lead.property_zip}
                    </p>
                  </div>
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color={selectedLeads.includes(lead.id || '') ? 'primary' : 'default'}
                    onClick={() => {
                      if (selectedLeads.includes(lead.id || '')) {
                        setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                      } else {
                        setSelectedLeads([...selectedLeads, lead.id || '']);
                      }
                    }}
                  >
                    {selectedLeads.includes(lead.id || '') ? 'Selected' : 'Deselected'}
                  </Chip>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button 
              variant="flat" 
              onClick={handleCancel}
              isDisabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleGenerateLois}
              isLoading={isGenerating}
              isDisabled={selectedLeads.length === 0}
              startContent={<FaFileAlt />}

            >
              Generate {selectedLeads.length} LOIs
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Generated LOIs Section */}
      {generatedLois.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="text-lg font-semibold">Generated LOIs</h2>
              <p className="text-sm text-gray-500">
                {generatedLois.length} LOIs have been successfully generated
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {generatedLois.map((loi) => {
                // Find the lead details for this LOI
                const lead = leadsQuery.data?.find(l => l.id === loi.id);
                
                return (
                  <div key={loi.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{lead?.property_address || 'Unknown Property'}</p>
                      <p className="text-sm text-gray-500">
                        {lead?.property_city}, {lead?.property_state} {lead?.property_zip}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="light"
                        as="a"
                        href={loi.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Preview
                      </Button>
                      <Button 
                        size="sm" 
                        variant="flat"
                        as="a"
                        href={loi.url}
                        download={`LOI-${loi.id}.pdf`}
                        startContent={<FaDownload size={14} />}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
          <CardFooter>
            <div className="flex w-full justify-end space-x-2">
              <Button 
                color="secondary" 
                onClick={handleDownloadAll}
                startContent={<FaDownload />}
              >
                Download All
              </Button>
              <Button 
                color="primary"
                onClick={handleSendWithEmail}
                isLoading={sendLoiEmailMutation.isLoading}
                startContent={<FaEnvelope />}
              >
                Send with Email
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}