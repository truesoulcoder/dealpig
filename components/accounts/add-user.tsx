import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import React, { useState } from "react";
import { FaGoogle } from "react-icons/fa";

export const AddSender = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('');
  const [dailyQuota, setDailyQuota] = useState('100');
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Handle Gmail OAuth
  const handleGmailAuth = async () => {
    if (!name || !email) {
      alert('Please enter name and email');
      return;
    }
    
    setIsAuthorizing(true);
    try {
      // Redirect to Gmail OAuth flow
      const encodedEmail = encodeURIComponent(email);
      const encodedName = encodeURIComponent(name);
      const encodedTitle = encodeURIComponent(title);
      const encodedQuota = encodeURIComponent(dailyQuota);
      
      // Redirect to OAuth flow with sender details as query params
      window.location.href = `/api/auth/gmail?email=${encodedEmail}&name=${encodedName}&title=${encodedTitle}&dailyQuota=${encodedQuota}`;
    } catch (error) {
      console.error('Error starting Gmail authorization:', error);
      setIsAuthorizing(false);
      alert('Failed to start Gmail authorization');
    }
  };

  return (
    <div>
      <>
        <Button onPress={onOpen} color="primary">
          Add Sender
        </Button>
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="top-center"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Add Email Sender
                </ModalHeader>
                <ModalBody>
                  <Input 
                    label="Name" 
                    placeholder="Sender's full name"
                    variant="bordered"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    isRequired
                  />
                  <Input 
                    label="Email" 
                    placeholder="Gmail address"
                    variant="bordered"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    isRequired
                    type="email"
                  />
                  <Input 
                    label="Title" 
                    placeholder="Job title (optional)"
                    variant="bordered"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <Input 
                    label="Daily Email Quota" 
                    placeholder="Maximum emails per day"
                    variant="bordered"
                    value={dailyQuota}
                    onChange={(e) => setDailyQuota(e.target.value)}
                    type="number"
                    min="1"
                    max="500"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    You&apos;ll need to authorize DealPig to send emails on behalf of this Gmail account.
                  </p>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    color="primary" 
                    onPress={handleGmailAuth}
                    startContent={<FaGoogle />}
                    isLoading={isAuthorizing}
                  >
                    {isAuthorizing ? 'Authorizing...' : 'Authorize with Gmail'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    </div>
  );
};
