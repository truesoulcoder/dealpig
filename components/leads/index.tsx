'use client';

import React, { useState, useEffect } from 'react';
// Import the singleton instance instead of the factory
import supabase from '@/lib/supabase/client';
import { LeadSource } from '@/helpers/types';
import UploadLeadsForm from './UploadLeadsForm';
// Using HeroUI components
import { Spinner } from '@heroui/react'; // Assuming Spinner exists
import toast from 'react-hot-toast';

export default function LeadsSection() {
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
                  // Determine status based on metadata presence
                  const status = source.metadata?.tableName ? 'Ingested' : 'Uploaded'; // Fixed typo: table_name -> tableName
                  return (
                    <li key={source.id} className="px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white">
                      <div className="flex-grow">
                        <p className="font-medium">{source.file_name}</p>
                        <p className="text-sm text-gray-500">
                          ID: <code className="text-xs bg-gray-100 px-1 rounded">{source.id}</code><br/>
                          Uploaded: {new Date(source.created_at).toLocaleString()}<br/>
                          Records: {source.record_count ?? 'N/A'}<br/>
                          Status: {status}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}