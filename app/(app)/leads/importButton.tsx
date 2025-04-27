"use client";

import { useState } from 'react';
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/react';
import { FaUpload } from 'react-icons/fa';
import UploadCsvForm from '@/components/leads/uploadCsvForm';

export default function ImportButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  
  const handleClose = () => {
    setIsOpen(false);
    
    // Refresh the leads table after successful import or modal close
    setTimeout(() => {
      // Use the global refresh function if available
      if (typeof window !== 'undefined' && window.__refreshLeadsTable) {
        // @ts-ignore - This is our global function
        window.__refreshLeadsTable();
      }
    }, 500); // Add a small delay to ensure the modal is fully closed
  };

  return (
    <>
      <Button 
        color="primary"
        startContent={<FaUpload />}
        onPress={handleOpen}
      >
        Import Leads
      </Button>

      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        size="3xl"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Import Leads from CSV
          </ModalHeader>
          <ModalBody>
            <UploadCsvForm onImportSuccess={handleClose} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}