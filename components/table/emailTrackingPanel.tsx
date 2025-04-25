"use client";

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, Chip, Spinner, Button } from '@heroui/react';
import { Email, getEmailsByLeadId } from '@/lib/database';

interface EmailTrackingPanelProps {
  leadId: string;
  onSendNewEmail?: () => void;
}

export default function EmailTrackingPanel({ leadId, onSendNewEmail }: EmailTrackingPanelProps) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchEmails() {
      if (!leadId) return;
      
      try {
        setLoading(true);
        const emailData = await getEmailsByLeadId(leadId);
        setEmails(emailData);
      } catch (error) {
        console.error('Error fetching emails:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEmails();
  }, [leadId]);
  
  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SENT':
        return 'success';
      case 'OPENED':
        return 'primary';
      case 'REPLIED':
        return 'secondary';
      case 'BOUNCED':
        return 'danger';
      case 'FAILED':
        return 'danger';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString();
  };
  
  if (loading) {
    return (
      <Card>
        <CardBody className="flex items-center justify-center py-8">
          <Spinner color="primary" label="Loading email history..." />
        </CardBody>
      </Card>
    );
  }
  
  if (emails.length === 0) {
    return (
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Email History</h3>
          {onSendNewEmail && (
            <Button color="primary" size="sm" onPress={onSendNewEmail}>
              Send New Email
            </Button>
          )}
        </CardHeader>
        <CardBody>
          <div className="text-center py-6">
            <p className="text-gray-500 mb-4">No emails have been sent yet for this lead.</p>
            {onSendNewEmail && (
              <Button color="primary" onPress={onSendNewEmail}>
                Send First Email
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Email History</h3>
        {onSendNewEmail && (
          <Button color="primary" size="sm" onPress={onSendNewEmail}>
            New Email
          </Button>
        )}
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {emails.map((email) => (
            <Card key={email.id} shadow="sm" className="border border-gray-200">
              <CardBody className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold">{email.subject}</h4>
                    <p className="text-sm text-gray-500">
                      Sent: {formatDate(email.sent_at || email.created_at)}
                    </p>
                  </div>
                  <Chip color={getStatusColor(email.status || 'PENDING')}>
                    {email.status || 'PENDING'}
                  </Chip>
                </div>
                
                <div className="text-sm mt-4 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:gap-12 mb-2">
                    <div>
                      <span className="font-semibold">Opened:</span>{' '}
                      {email.opened_at ? formatDate(email.opened_at) : 'Not yet'}
                    </div>
                    <div>
                      <span className="font-semibold">Replied:</span>{' '}
                      {email.replied_at ? formatDate(email.replied_at) : 'Not yet'}
                    </div>
                  </div>
                  
                  {email.status?.toUpperCase() === 'BOUNCED' && (
                    <div className="mt-2 p-2 bg-red-50 rounded">
                      <span className="font-semibold">Bounce Reason:</span>{' '}
                      {email.bounce_reason || 'Unknown error'}
                    </div>
                  )}
                  
                  {email.loi_path && (
                    <div className="mt-3">
                      <span className="font-semibold">Attachment:</span>{' '}
                      <a 
                        href={email.loi_path} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View LOI Document
                      </a>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}