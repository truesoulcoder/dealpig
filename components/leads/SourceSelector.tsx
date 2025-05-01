'use client';

import React, { useState, useEffect } from 'react';
import { LeadSource } from '@/helpers/types';
import { getLeadSources } from '@/actions/leads.action'; // Action to fetch sources

interface SourceSelectorProps {
  selectedSourceId: string | null;
  onSourceChange: (sourceId: string | null) => void;
}

const SourceSelector: React.FC<SourceSelectorProps> = ({ selectedSourceId, onSourceChange }) => {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSources = async () => {
      setLoading(true);
      try {
        const fetchedSources = await getLeadSources();
        setSources(fetchedSources);
        // If no source is selected, maybe default to the first one?
        // if (!selectedSourceId && fetchedSources.length > 0) {
        //   onSourceChange(fetchedSources[0].id);
        // }
      } catch (error) {
        console.error('Failed to fetch lead sources:', error);
        // Handle error display if needed
      } finally {
        setLoading(false);
      }
    };
    fetchSources();
  }, []); // Fetch on mount

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onSourceChange(value === 'ALL' ? null : value);
  };

  return (
    <div className="mb-4">
      <label htmlFor="source-select" className="block text-sm font-medium text-gray-700 mb-1">
        Select Lead Source:
      </label>
      <select
        id="source-select"
        value={selectedSourceId ?? 'ALL'}
        onChange={handleChange}
        disabled={loading || sources.length === 0}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-gray-100"
      >
        <option value="ALL">All Sources</option>
        {sources.map((source) => (
          <option key={source.id} value={source.id}>
            {source.file_name} ({new Date(source.created_at).toLocaleDateString()})
          </option>
        ))}
      </select>
      {loading && <p className="text-xs text-gray-500 mt-1">Loading sources...</p>}
      {!loading && sources.length === 0 && <p className="text-xs text-red-500 mt-1">No sources found.</p>}
    </div>
  );
};

export default SourceSelector;
