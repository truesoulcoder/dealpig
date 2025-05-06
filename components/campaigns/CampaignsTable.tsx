'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Table, TableBody, TableCell, TableHeader, TableRow 
} from '@heroui/table'; 
import { 
  Button, 
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter 
} from '@heroui/react'; 
import { Campaign } from '@/helpers/types'; 
import { CampaignEditor } from './CampaignEditor'; 
import { toast } from 'sonner';
import { LoadingSkeleton as LoadingSpinner } from '@/components/ui/LoadingSkeleton'; 
import { AlertTriangle, PlusCircle, Edit, Trash2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('An error occurred while fetching the data.');
  }
  return res.json();
});

interface CampaignsTableProps {
  // Define any props if needed, e.g., for filtering or initial sort order
}

export function CampaignsTable({}: CampaignsTableProps) {
  const { data: campaigns, error: campaignsError, isLoading } = useSWR<Campaign[]>('/api/campaigns', fetcher);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCampaign(null); 
    setIsEditorOpen(true);
  };

  const handleDelete = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete campaign');
      }
      toast.success('Campaign deleted successfully!');
      mutate('/api/campaigns'); 
    } catch (err) {
      console.error('Delete error:', err);
      toast.error((err as Error).message || 'An error occurred while deleting.');
    }
  };

  const handleEditorSave = () => {
    setIsEditorOpen(false);
    setSelectedCampaign(null);
    mutate('/api/campaigns'); 
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (campaignsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <AlertTriangle size={48} className="mb-4" />
        <p className="text-xl font-semibold">Error loading campaigns</p>
        <p>{campaignsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          color="primary"
          onPress={handleAddNew}
          startContent={<PlusCircle size={18}/>}
        >
          Add New Campaign
        </Button>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <p>No campaigns found. Click "Add New Campaign" to get started.</p>
        </div>
      ) : (
        <Table aria-label="Campaigns Table">
          <TableHeader>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Target Audience</TableCell>
              <TableCell className="text-right">Actions</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody items={campaigns}>
            {(campaign) => (
              <TableRow key={campaign.id}>
                <TableCell>{campaign.name}</TableCell>
                <TableCell>{campaign.status}</TableCell>
                <TableCell>{new Date(campaign.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(campaign.end_date).toLocaleDateString()}</TableCell>
                <TableCell>${campaign.budget.toLocaleString()}</TableCell>
                <TableCell>{campaign.target_audience.join(', ')}</TableCell>
                <TableCell className="flex justify-end items-center space-x-2">
                  <Button 
                    isIconOnly
                    aria-label="Edit campaign"
                    onPress={() => handleEdit(campaign)}
                    variant="ghost" 
                    size="sm"
                    className="p-1 h-auto"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button 
                      isIconOnly
                      aria-label="Delete campaign"
                      onPress={() => {
                        if (window.confirm(`Are you sure you want to delete campaign: ${campaign.name}?`)) {
                          handleDelete(campaign.id);
                        }
                      }}
                      variant="ghost" 
                      size="sm"
                      color="danger"
                    >
                      <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {isEditorOpen && (
        <Modal 
          isOpen={isEditorOpen} 
          onOpenChange={setIsEditorOpen} 
          size="2xl"
          backdrop="blur"
          scrollBehavior="inside" 
        >
          <ModalContent className="bg-background text-foreground">
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {selectedCampaign ? 'Edit Campaign' : 'Add New Campaign'}
                </ModalHeader>
                <ModalBody>
                  <CampaignEditor 
                    campaign={selectedCampaign} 
                    onSave={() => {
                      handleEditorSave();
                      onClose();
                    }}
                    onCancel={onClose}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="light" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
