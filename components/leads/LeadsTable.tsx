'use client';

import React, { useState, useEffect } from 'react';
import { Lead } from '@/helpers/types';
import { getLeads } from '@/actions/leads.action'; // Action to fetch leads

interface LeadsTableProps {
  sourceId: string | null; // ID of the source to filter by, or null for all
}

const LeadsTable: React.FC<LeadsTableProps> = ({ sourceId }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedLeads = await getLeads(sourceId ?? undefined); // Pass undefined if sourceId is null
        setLeads(fetchedLeads || []);
      } catch (err: any) {
        console.error('Failed to fetch leads:', err);
        setError(err.message || 'Failed to load leads.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [sourceId]); // Refetch when sourceId changes

  // Define columns based on the 'leads' table structure
  const columns = [
    { key: 'owner_name', label: 'Owner Name' },
    { key: 'owner_email', label: 'Owner Email' },
    { key: 'property_address', label: 'Address' },
    { key: 'property_city', label: 'City' },
    { key: 'property_state', label: 'State' },
    { key: 'property_zip', label: 'Zip' },
    { key: 'beds', label: 'Beds' },
    { key: 'baths', label: 'Baths' },
    { key: 'square_footage', label: 'SqFt' },
    { key: 'year_built', label: 'Year Built' },
    { key: 'status', label: 'Status' },
    // Add more columns as needed
  ];

  return (
    <div className="border rounded overflow-hidden">
      <h3 className="font-semibold p-4 border-b">Normalized Leads</h3>
      {loading && <p className="p-4 text-sm text-gray-500">Loading leads...</p>}
      {error && <p className="p-4 text-sm text-red-600">Error: {error}</p>}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col.key} scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-4 text-sm text-gray-500 text-center">No leads found for the selected source.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {/* Access nested properties safely if needed */}
                        {String(lead[col.key as keyof Lead] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;
