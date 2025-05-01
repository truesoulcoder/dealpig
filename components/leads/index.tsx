'use client';

import React, { useState, useEffect } from 'react';
// Import the singleton instance instead of the factory
import supabase from '@/lib/supabase/client';
import { LeadSource, LeadSourceMetadata } from '@/helpers/types';
import UploadLeadsForm from './UploadLeadsForm';
import ConfigureSourceModal from './ConfigureSourceModal';
// Using HeroUI components
import { Button, Spinner } from '@heroui/react'; // Assuming Spinner exists
import toast from 'react-hot-toast';

export default function LeadsSection() {
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedSource, setSelectedSource] = useState<LeadSource | null>(null);
  const [processingSourceId, setProcessingSourceId] = useState<string | null>(null);

  // Fetch lead sources on component mount
  useEffect(() => {
    console.log('[LeadsSection] Initial fetch...'); // Added log
    fetchLeadSources();
  }, []);

  const fetchLeadSources = async () => {
    console.log('[LeadsSection] fetchLeadSources CALLED.'); // Log when function starts
    setIsLoadingSources(true);
    setError(null);
    try {
      // Check auth status before fetching
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[LeadsSection] Error getting user:', userError);
      }
      console.log('[LeadsSection] Current user:', user); // Log the user object
      console.log('[LeadsSection] User ID:', user?.id); // Log the user ID
      console.log('[LeadsSection] User authenticated:', !!user);

      const { data, error: fetchError } = await supabase
        .from('lead_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      console.log('[LeadsSection] Fetched sources DATA:', data); // Log the actual data received
      setLeadSources(data || []);
      console.log('[LeadsSection] setLeadSources CALLED with data.'); // Log after setting state
    } catch (err: any) {
      console.error('[LeadsSection] Error fetching lead sources:', err);
      setError(err.message || 'Failed to load lead sources.');
      toast.error('Failed to load lead sources.');
    } finally {
      setIsLoadingSources(false);
      console.log('[LeadsSection] fetchLeadSources FINISHED.'); // Log when function ends
    }
  };

  const handleUploadSuccess = () => {
    console.log(`[LeadsSection] handleUploadSuccess CALLED. Refetching sources...`); // Log when callback is triggered
    fetchLeadSources();
  };

  const openConfigureModal = (source: LeadSource) => {
    console.log('[LeadsSection] Opening configure modal for:', source); // Added log
    setSelectedSource(source);
    setIsModalOpen(true);
  };

  const handleSaveMetadata = async (sourceId: string, metadata: LeadSourceMetadata) => {
    console.log(`[LeadsSection] Saving metadata for ${sourceId}:`, metadata); // Added log
    try {
      const { error: updateError } = await supabase
        .from('lead_sources')
        .update({ metadata: metadata, updated_at: new Date().toISOString() })
        .eq('id', sourceId);

      if (updateError) throw updateError;

      toast.success('Configuration saved successfully!');
      // Update local state to reflect the change immediately
      setLeadSources(prevSources =>
        prevSources.map(source =>
          source.id === sourceId ? { ...source, metadata: metadata } : source
        )
      );
      console.log('[LeadsSection] Local state updated with new metadata.'); // Added log
    } catch (err: any) {
      console.error('[LeadsSection] Error saving metadata:', err);
      toast.error(`Failed to save configuration: ${err.message}`);
      throw err; // Re-throw to keep the modal loading state active
    }
  };

  // Function to trigger processing
  const handleProcessSource = async (sourceId: string) => {
    console.log(`[LeadsSection] Triggering processing for source ID: ${sourceId}`); // Added log
    setProcessingSourceId(sourceId); // Set loading state for this specific source
    try {
      // Call the backend API/Action to start processing
      const response = await fetch('/api/leads/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to start processing (HTTP ${response.status})`);
      }

      toast.success(result.message || `Processing started for source ${sourceId}`);
      // Optionally refetch sources or update status locally if the API provides immediate feedback
      // fetchLeadSources(); // Or update status based on API response

    } catch (err: any) {
      console.error(`[LeadsSection] Error processing source ${sourceId}:`, err);
      toast.error(`Processing error: ${err.message}`);
    } finally {
      setProcessingSourceId(null); // Clear loading state
    }
  };

  // Log current state before rendering
  console.log('[LeadsSection] Rendering with leadSources state:', leadSources); // Added log

  return (
    <div className="space-y-8">
      {/* Upload Form - Pass the handleUploadSuccess callback */}
      <UploadLeadsForm onUploadSuccess={handleUploadSuccess} />

      {/* Lead Sources List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Uploaded Lead Sources</h2>
        {isLoadingSources && (
          <div className="flex justify-center p-4">
            {/* Assuming HeroUI Spinner */}
            <Spinner size="lg" />
            <span className="ml-2">Loading sources...</span>
          </div>
        )}
        {error && <p className="text-red-600 p-4 bg-red-50 rounded">Error: {error}</p>}
        {!isLoadingSources && !error && (
          <div className="space-y-1">
            {leadSources.length === 0 ? (
              <p className="text-gray-500">No lead sources uploaded yet.</p>
            ) : (
              // Using standard list structure, styled with Tailwind/HeroUI classes
              <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
                {leadSources.map((source) => {
                  // Log each source being mapped
                  console.log(`[LeadsSection] Mapping source item: ${source.id}, Metadata:`, source.metadata); // Added log
                  return (
                    <li key={source.id} className="px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
                      <div className="flex-grow">
                        <p className="font-medium">{source.file_name}</p>
                        <p className="text-sm text-gray-500">
                          ID: <code className="text-xs bg-gray-100 px-1 rounded">{source.id}</code><br/>
                          Uploaded: {new Date(source.created_at).toLocaleString()}<br/>
                          Status: {source.metadata ? 'Configured' : 'Needs Configuration'}
                          {processingSourceId === source.id && <span className="text-blue-500 ml-2">(Processing...)</span>} {/* Added processing status */}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                       {/* Using HeroUI Buttons */}
                       <Button
                        size="sm"
                        color={source.metadata ? "secondary" : "primary"}
                        variant="bordered" // Changed from "outline" to "bordered"
                        onClick={() => openConfigureModal(source)}
                        disabled={processingSourceId === source.id}
                      >
                        {source.metadata ? 'Reconfigure' : 'Configure'}
                      </Button>
                       <Button
                        size="sm"
                        color="success" // Assuming success color exists
                        variant="solid" // Using solid variant
                        disabled={!source.metadata || processingSourceId === source.id}
                        isLoading={processingSourceId === source.id} // Changed from loading to isLoading
                        onClick={() => handleProcessSource(source.id)}
                      >
                        Process
                      </Button>
                    </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Configuration Modal */}
      <ConfigureSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leadSource={selectedSource}
        onSave={handleSaveMetadata}
      />
    </div>
  );
}