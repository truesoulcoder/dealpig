'use client';

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { removeDuplicateStatuses } from '@/utils/leadUtils';

interface ProcessingStatus {
  id: number;
  file: string;
  status: string;
  completed_at: string | null;
  normalized_at: string | null;
  contact_name?: string;
  contact_email?: string;
  property_address?: string;
}

export default function ProcessingStatusTable() {
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatuses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("processing_status")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      // Remove duplicate statuses
      const uniqueStatuses = removeDuplicateStatuses(data || []);
      const duplicateCount = (data?.length || 0) - uniqueStatuses.length;
      
      if (duplicateCount > 0) {
        console.log(`Removed ${duplicateCount} duplicate statuses`);
      }

      setStatuses(uniqueStatuses);
    } catch (err) {
      console.error("Error fetching processing statuses:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  if (loading) {
    return <div>Loading processing statuses...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  if (statuses.length === 0) {
    return <div>No processing statuses found.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Completed At
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Normalized At
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statuses.map((status) => (
            <tr key={status.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {status.file}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    status.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : status.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {status.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {status.completed_at ? new Date(status.completed_at).toLocaleString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {status.normalized_at ? new Date(status.normalized_at).toLocaleString() : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}