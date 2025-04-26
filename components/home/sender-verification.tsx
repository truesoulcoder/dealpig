"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip, 
  Checkbox, 
  Spinner,
  Tooltip
} from "@heroui/react";
import { FaCheckCircle, FaExclamationTriangle, FaPaperPlane, FaInfoCircle } from "react-icons/fa";

interface Sender {
  id: string;
  name: string;
  email: string;
  verified: boolean;
  test_sent: boolean;
  test_sent_at?: string;
  loading?: boolean;
  error?: string;
}

interface SenderVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignName: string;
  onAllVerified: () => void;
}

export default function SenderVerificationModal({ 
  isOpen, 
  onClose, 
  campaignId, 
  campaignName,
  onAllVerified 
}: SenderVerificationModalProps) {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingAll, setTestingAll] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  
  // Fetch campaign senders on open
  useEffect(() => {
    if (isOpen && campaignId) {
      fetchSenders();
      fetchUserEmail();
    }
  }, [isOpen, campaignId, fetchSenders, fetchUserEmail]);
  
  // Fetch user's email for test email recipient
  const fetchUserEmail = useCallback(async () => {
    try {
      // This would need to be implemented - getting the current user's email
      // For now using a placeholder
      setUserEmail("user@example.com");
    } catch (error) {
      console.error("Error fetching user email:", error);
    }
  }, []);
  
  // Fetch campaign senders
  const fetchSenders = useCallback(async () => {
    setLoading(true);
    try {
      // Call API to get senders assigned to this campaign
      const response = await fetch(`/api/campaigns/${campaignId}/senders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch campaign senders');
      }
      
      const data = await response.json();
      setSenders(data.senders.map((sender: any) => ({
        ...sender,
        verified: !!sender.verified,
        test_sent: !!sender.test_sent
      })));
    } catch (error) {
      console.error("Error fetching campaign senders:", error);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);
  
  // Send test email from a specific sender
  const sendTestEmail = useCallback(async (senderId: string) => {
    // Update local state to show loading
    setSenders(prev => prev.map(sender => 
      sender.id === senderId 
        ? { ...sender, loading: true, error: undefined } 
        : sender
    ));
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/test-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: senderId,
          recipientEmail: userEmail
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send test email');
      }
      
      // Update sender status on success
      setSenders(prev => prev.map(sender => 
        sender.id === senderId 
          ? { 
              ...sender, 
              test_sent: true, 
              test_sent_at: new Date().toISOString(),
              loading: false
            } 
          : sender
      ));
    } catch (error) {
      console.error("Error sending test email:", error);
      // Update sender with error
      setSenders(prev => prev.map(sender => 
        sender.id === senderId 
          ? { 
              ...sender, 
              loading: false, 
              error: error instanceof Error ? error.message : 'An unknown error occurred'
            } 
          : sender
      ));
    }
  }, [campaignId, userEmail]);
  
  // Send test emails from all senders
  const sendAllTestEmails = useCallback(async () => {
    setTestingAll(true);
    
    try {
      // Send test emails sequentially to prevent rate limiting
      for (const sender of senders) {
        if (!sender.test_sent && !sender.loading) {
          await sendTestEmail(sender.id);
          // Add small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setTestingAll(false);
    }
  }, [senders, sendTestEmail]);
  
  // Toggle verification status for a sender
  const toggleVerification = useCallback(async (senderId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/senders/${senderId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update sender verification status');
      }
      
      // Update local state
      setSenders(prev => prev.map(sender => 
        sender.id === senderId ? { ...sender, verified } : sender
      ));
      
      // Check if all senders are now verified
      const updatedSenders = senders.map(sender => 
        sender.id === senderId ? { ...sender, verified } : sender
      );
      
      if (updatedSenders.every(sender => sender.verified)) {
        onAllVerified();
      }
    } catch (error) {
      console.error("Error updating sender verification:", error);
    }
  }, [campaignId, senders, onAllVerified]);
  
  // Check if all senders have been verified
  const allSendersVerified = senders.every(sender => sender.verified);
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {
        if (allSendersVerified) {
          onClose();
        } else {
          // If not all verified, confirm before closing
          if (confirm("Campaign verification is not complete. The campaign will remain inactive if you exit now. Continue?")) {
            onClose();
          }
        }
      }}
      size="3xl"
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FaExclamationTriangle className="text-yellow-400" />
            <span>Campaign Activation Verification</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Campaign: {campaignName}
          </p>
        </ModalHeader>
        <ModalBody>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <FaInfoCircle className="text-yellow-500 mt-0.5 mr-3" size={16} />
              <div>
                <p className="text-sm text-gray-700 font-medium">
                  Before this campaign can be activated, you must verify each sender account.
                </p>
                <ul className="text-sm text-gray-600 mt-2 list-disc list-inside space-y-1">
                  <li>Test emails will be sent to your email address ({userEmail})</li>
                  <li>Verify that emails are formatted correctly and attachments work</li>
                  <li>Check each sender by marking them as verified</li>
                  <li>All senders must be verified before the campaign can be activated</li>
                </ul>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          ) : senders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No senders have been assigned to this campaign.</p>
              <Button color="primary" className="mt-4" onClick={onClose}>
                Add Senders to Campaign
              </Button>
            </div>
          ) : (
            <>
              <Table aria-label="Sender verification table">
                <TableHeader>
                  <TableColumn>SENDER</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>TEST EMAIL</TableColumn>
                  <TableColumn>VERIFIED</TableColumn>
                  <TableColumn>ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {senders.map((sender) => (
                    <TableRow key={sender.id}>
                      <TableCell>{sender.name}</TableCell>
                      <TableCell>{sender.email}</TableCell>
                      <TableCell>
                        {sender.test_sent ? (
                          <Chip 
                            color="success" 
                            variant="flat" 
                            size="sm"
                            startContent={<FaCheckCircle />}
                          >
                            Sent {sender.test_sent_at ? new Date(sender.test_sent_at).toLocaleTimeString() : ''}
                          </Chip>
                        ) : sender.error ? (
                          <Tooltip content={sender.error}>
                            <Chip 
                              color="danger" 
                              variant="flat" 
                              size="sm"
                            >
                              Failed
                            </Chip>
                          </Tooltip>
                        ) : (
                          <Chip 
                            color="warning" 
                            variant="flat" 
                            size="sm"
                          >
                            Not Sent
                          </Chip>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox 
                          isSelected={sender.verified}
                          onValueChange={(isSelected) => toggleVerification(sender.id, isSelected)}
                          isDisabled={!sender.test_sent}
                          aria-label={`Verify sender ${sender.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm"
                          color="primary"
                          variant="flat"
                          startContent={<FaPaperPlane />}
                          isLoading={sender.loading}
                          onClick={() => sendTestEmail(sender.id)}
                          isDisabled={testingAll}
                        >
                          Send Test
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between mt-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {senders.filter(s => s.verified).length} of {senders.length} senders verified
                  </p>
                </div>
                <Button 
                  color="primary" 
                  variant="flat"
                  startContent={<FaPaperPlane />}
                  onClick={sendAllTestEmails}
                  isLoading={testingAll}
                  isDisabled={senders.every(s => s.test_sent)}
                >
                  Send All Test Emails
                </Button>
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" color="danger" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            color="success" 
            isDisabled={!allSendersVerified}
            onClick={() => {
              onAllVerified();
              onClose();
            }}
          >
            Activate Campaign
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}