"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from "@heroui/react/card";
import { Button } from '@heroui/react/button';
import { Input } from '@heroui/react/input';
import { Textarea } from '@heroui/react/textarea';
import { Select, SelectItem } from '@heroui/react/select';
import { Spinner } from '@heroui/react/spinner';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/app/providers/trpc-provider';
import dynamic from 'next/dynamic';

// Dynamically import the rich text editor to avoid SSR issues
const DynamicEditor = dynamic(
  () => import('@/components/home/emailEditor'),
  { ssr: false, loading: () => <Spinner label="Loading editor..." /> }
);

export default function BulkEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const leadIds = searchParams.get('ids')?.split(',') || [];
  
  const [subject, setSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [leadDetails, setLeadDetails] = useState<any[]>([]);
  
  // Get templates query
  const templatesQuery = trpc.emails.getTemplates.useQuery({ type: 'email' });
  
  // Get leads details
  const leadsQuery = trpc.leads.getBulkLeads.useQuery({ ids: leadIds }, {
    enabled: leadIds.length > 0
  });
  
  // Email sending mutation
  const sendEmailMutation = trpc.emails.sendBulkEmail.useMutation({
    onSuccess: () => {
      alert('Emails sent successfully!');
      router.push('/leads');
    },
    onError: (error) => {
      alert(`Error sending emails: ${error.message}`);
      setIsLoading(false);
    }
  });

  useEffect(() => {
    if (leadsQuery.data) {
      setLeadDetails(leadsQuery.data);
    }
  }, [leadsQuery.data]);

  // Handle template change
  const handleTemplateChange = (template: string) => {
    setTemplateId(template);
    if (template) {
      const selectedTemplate = templatesQuery.data?.find(t => t.id === template);
      if (selectedTemplate) {
        setSubject(selectedTemplate.subject || '');
        setEmailContent(selectedTemplate.content || '');
      }
    }
  };
  
  // Handle send email
  const handleSendEmail = async () => {
    if (!subject || !emailContent) {
      alert('Please provide a subject and email content');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await sendEmailMutation.mutateAsync({
        leadIds,
        subject,
        content: emailContent,
        templateId: templateId || undefined
      });
    } catch (error) {
      // Error is handled by the mutation
    }
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
            <p className="text-gray-500 mb-4">Please select leads from the leads table to send a bulk email.</p>
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
          <h1 className="text-2xl font-bold mb-1">Send Bulk Email</h1>
          <p className="text-gray-500">
            Sending email to {leadIds.length} lead(s)
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button 
            variant="flat"
            onClick={() => setPreview(!preview)}
          >
            {preview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start w-full gap-4">
            <div className="w-full">
              <h2 className="text-lg font-semibold mb-2">Email Details</h2>
              {leadDetails.length > 0 && (
                <p className="text-sm text-gray-500">
                  Recipients: {leadDetails.map(lead => 
                    lead.contacts?.[0]?.email || 'No email'
                  ).join(', ')}
                </p>
              )}
            </div>
            {templatesQuery.data && templatesQuery.data.length > 0 && (
              <div className="w-full sm:w-1/3">
                <Select
                  label="Email Template"
                  placeholder="Select a template"
                  value={templateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <SelectItem key="none" value="">No Template</SelectItem>
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
          <div className="mb-4">
            <Input
              type="text"
              label="Subject"
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              isRequired
            />
          </div>

          <div className="min-h-[400px] border border-gray-300 rounded-lg mb-4">
            {preview ? (
              <div className="p-4 prose max-w-none min-h-[400px]" dangerouslySetInnerHTML={{ __html: emailContent }} />
            ) : (
              <DynamicEditor
                initialContent={emailContent}
                onChange={setEmailContent}
                placeholder="Write your email content here..."
              />
            )}
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <Button 
              variant="flat" 
              onClick={handleCancel}
              isDisabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onClick={handleSendEmail}
              isLoading={isLoading || sendEmailMutation.isLoading}
            >
              Send to {leadIds.length} Recipients
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}