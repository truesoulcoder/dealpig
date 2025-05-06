'use client';

import React, { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { 
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Campaign } from '@/helpers/types'; // Assuming Campaign type is defined here
import { CampaignEditor } from './CampaignEditor'; // To be created
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner'; // Assuming this exists
import { AlertTriangle, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
    AlertDialogTrigger 
} from '@/components/ui/alert-dialog';


const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Failed to fetch campaigns');
  }
  return res.json();
});

export function CampaignsTable() {
  const { data: campaigns, error, isLoading } = useSWR<Campaign[]>('/api/campaigns', fetcher);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCampaign(null); // Clear selection for new campaign
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
      mutate('/api/campaigns'); // Revalidate the campaigns list
    } catch (err) {
      console.error('Delete error:', err);
      toast.error((err as Error).message || 'An error occurred while deleting.');
    }
  };

  const handleEditorSave = () => {
    setIsEditorOpen(false);
    setSelectedCampaign(null);
    mutate('/api/campaigns'); // Revalidate data after save
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-40"><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-red-600">
        <AlertTriangle className="w-10 h-10 mb-2" />
        <p>Error loading campaigns: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
       <div className="flex justify-end">
         <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
            <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Campaign
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                <DialogTitle>{selectedCampaign ? 'Edit Campaign' : 'Create New Campaign'}</DialogTitle>
                </DialogHeader>
                {/* Render CampaignEditor only when the dialog is intended to be open */}
                {isEditorOpen && (
                    <CampaignEditor 
                        campaign={selectedCampaign} 
                        onSave={handleEditorSave} 
                        onCancel={() => setIsEditorOpen(false)}
                    />
                )}
            </DialogContent>
         </Dialog>
       </div>

      <Table>
        <TableCaption>A list of your recent campaigns.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Leads</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns && campaigns.length > 0 ? (
            campaigns.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>{campaign.status}</TableCell>
                <TableCell>{campaign.leads_worked ?? 0} / {campaign.total_leads ?? 0}</TableCell>
                <TableCell>{new Date(campaign.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                    <Dialog open={isEditorOpen && selectedCampaign?.id === campaign.id} onOpenChange={(open) => {!open && setSelectedCampaign(null); setIsEditorOpen(open);}}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(campaign)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        {/* Content moved outside trigger for better control */} 
                    </Dialog>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the campaign
                                and potentially related data. 
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleDelete(campaign.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center h-24">
                No campaigns found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
       {/* Separate Dialog Content for Editor to avoid multiple renders inside loop */} 
       {isEditorOpen && selectedCampaign && (
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                    <DialogTitle>Edit Campaign</DialogTitle>
                    </DialogHeader>
                    <CampaignEditor 
                        campaign={selectedCampaign} 
                        onSave={handleEditorSave} 
                        onCancel={() => setIsEditorOpen(false)}
                    />
                </DialogContent>
            </Dialog>
       )} 
    </div>
  );
}
