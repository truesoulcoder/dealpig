"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody, CardHeader, Chip, Button, ButtonGroup, Spinner, Tabs, Tab } from "@heroui/react";
import { Divider } from "@heroui/react";

import { getLeadById, getContactsByLeadId, Lead, Contact } from '@/lib/database';
import EmailTrackingPanel from '@/components/table/emailTrackingPanel';

interface LeadDetailPageProps {
  params: {
    id: string;
  };
}

export default function LeadDetailPage({ params }: LeadDetailPageProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const router = useRouter();

  useEffect(() => {
    const fetchLeadData = async () => {
      try {
        setLoading(true);
        
        // Fetch lead data
        const leadData = await getLeadById(params.id);
        setLead(leadData);
        
        // Fetch contacts for this lead
        if (leadData?.id) {
          const contactsData = await getContactsByLeadId(leadData.id);
          setContacts(contactsData);
        }
      } catch (error) {
        console.error('Error fetching lead data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeadData();
  }, [params.id]);

  // Function to navigate to send email page
  const handleSendEmail = () => {
    if (lead?.id) {
      router.push(`/leads/${lead.id}/send-email`);
    }
  };

  // Function to navigate to generate LOI page
  const handleGenerateLOI = () => {
    if (lead?.id) {
      router.push(`/leads/${lead.id}/generate-loi`);
    }
  };

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'primary';
      case 'contacted':
        return 'success';
      case 'negotiating':
        return 'warning';
      case 'closed':
        return 'secondary';
      case 'dead':
        return 'danger';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Spinner size="lg" label="Loading lead details..." />
      </div>
    );
  }

  if (!lead) {
    return (
      <Card className="max-w-3xl mx-auto mt-8">
        <CardBody className="text-center py-8">
          <h3 className="text-xl font-semibold mb-4">Lead Not Found</h3>
          <p className="text-gray-500 mb-6">
            The lead you are looking for could not be found or has been deleted.
          </p>
          <Button color="primary" onClick={() => router.push('/leads')}>
            Back to Leads
          </Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header with buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Lead Details</h1>
          <p className="text-gray-500">
            View and manage lead information for {lead.property_address}
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <ButtonGroup>
            <Button color="primary" variant="flat" onClick={handleGenerateLOI}>
              Generate LOI
            </Button>
            <Button color="primary" onClick={handleSendEmail}>
              Send Email
            </Button>
          </ButtonGroup>
        </div>
      </div>
      
      {/* Lead info card */}
      <Card className="mb-8">
        <CardHeader className="flex justify-between">
          <h2 className="text-xl font-semibold">Property Information</h2>
          <Chip color={getStatusColor(lead.status || 'new')}>
            {lead.status || 'New'}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Property Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{lead.property_address}</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{lead.property_city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium">{lead.property_state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ZIP</p>
                    <p className="font-medium">{lead.property_zip}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  {lead.wholesale_value && (
                    <div>
                      <p className="text-sm text-gray-500">Wholesale Value</p>
                      <p className="font-medium">${lead.wholesale_value.toLocaleString()}</p>
                    </div>
                  )}
                  {lead.market_value && (
                    <div>
                      <p className="text-sm text-gray-500">Market Value</p>
                      <p className="font-medium">${lead.market_value.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                {lead.days_on_market !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Days on Market</p>
                    <p className="font-medium">{lead.days_on_market}</p>
                  </div>
                )}
                {lead.mls_status && (
                  <div>
                    <p className="text-sm text-gray-500">MLS Status</p>
                    <p className="font-medium">{lead.mls_status}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
              {contacts.length > 0 ? (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <Card key={contact.id} shadow="sm" className="p-4">
                      <div>
                        <div className="flex justify-between">
                          <p className="font-medium">{contact.name}</p>
                          {contact.is_primary && <Chip size="sm" color="primary">Primary</Chip>}
                        </div>
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No contacts found for this lead</p>
              )}
              
              <Button 
                color="default" 
                variant="flat" 
                size="sm" 
                className="mt-4"
                onClick={() => router.push(`/leads/${lead.id}/add-contact`)}
              >
                Add Contact
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs aria-label="Lead details tabs">
        <Tab key="details" title="Property Details">
          <Card shadow="sm">
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Additional property details can be displayed here */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">MLS Details</h3>
                  <div className="space-y-3">
                    {lead.mls_list_date && (
                      <div>
                        <p className="text-sm text-gray-500">List Date</p>
                        <p className="font-medium">{new Date(lead.mls_list_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {lead.mls_list_price && (
                      <div>
                        <p className="text-sm text-gray-500">List Price</p>
                        <p className="font-medium">${lead.mls_list_price.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">Lead Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Created</p>
                      <p className="font-medium">
                        {lead.created_at && new Date(lead.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Updated</p>
                      <p className="font-medium">
                        {lead.updated_at && new Date(lead.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Tab>
        
        <Tab key="emails" title="Email History">
          <EmailTrackingPanel 
            leadId={lead.id || ''} 
            onSendNewEmail={handleSendEmail} 
          />
        </Tab>
        
        <Tab key="notes" title="Notes">
          <Card shadow="sm">
            <CardBody>
              <p className="text-gray-500 text-center py-8">
                Note taking functionality will be implemented in a future update.
              </p>
            </CardBody>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}