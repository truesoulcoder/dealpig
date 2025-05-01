'use client';

import React, { useState, useEffect } from 'react';
import { LeadSource, Lead, LeadSourceMetadata } from '@/helpers/types';
import { Button, Modal, Select, Spinner } from '@heroui/react';

interface ConfigureSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadSource: LeadSource | null;
  onSave: (sourceId: string, metadata: LeadSourceMetadata) => Promise<void>;
}

const targetLeadColumns: (keyof Lead)[] = [
  'property_address',
  'property_city',
  'property_state',
  'property_zip',
  'property_type',
  'beds',
  'baths',
  'square_footage',
  'year_built',
  'wholesale_value',
  'market_value',
  'assessed_total',
  'days_on_market',
  'mls_status',
  'mls_list_date',
  'mls_list_price',
  'owner_name',
  'owner_email',
  'owner_type',
  'mailing_address',
  'mailing_city',
  'mailing_state',
  'mailing_zip',
  'notes',
];

const ConfigureSourceModal: React.FC<ConfigureSourceModalProps> = ({ isOpen, onClose, leadSource, onSave }) => {
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string | null>>({});
  const [targetTable, setTargetTable] = useState<string>('leads');
  const [isLoadingHeaders, setIsLoadingHeaders] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && leadSource) {
      const fetchHeaders = async () => {
        setIsLoadingHeaders(true);
        setError(null);
        setCsvHeaders([]);
        setColumnMap({});

        try {
          const response = await fetch(`/api/leads/headers?path=${encodeURIComponent(leadSource.storage_path)}`);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Failed to fetch CSV headers' }));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          const headers = data.headers || [];

          if (!Array.isArray(headers)) {
            throw new Error('Invalid header data received from API.');
          }

          setCsvHeaders(headers);

          const initialMap: Record<string, string | null> = {};
          const existingMap = leadSource.metadata?.columnMap || {};
          headers.forEach(header => {
            const normalizedHeader = header.toLowerCase().replace(/[\s_]/g, '');
            const autoMappedTarget = targetLeadColumns.find(targetCol =>
              targetCol.toLowerCase().replace(/_/g, '') === normalizedHeader
            );
            initialMap[header] = existingMap[header] !== undefined ? existingMap[header] : (autoMappedTarget || null);
          });
          setColumnMap(initialMap);
          setTargetTable(leadSource.metadata?.tableName || 'leads');

        } catch (err: any) {
          console.error('Error fetching CSV headers:', err);
          setError(err.message || 'Failed to load headers.');
        } finally {
          setIsLoadingHeaders(false);
        }
      };
      fetchHeaders();
    }
  }, [isOpen, leadSource]);

  const handleMappingChange = (csvHeader: string, targetColumnValue: string | number | readonly string[] | undefined) => {
    const value = targetColumnValue as string | null;
    setColumnMap(prevMap => ({
      ...prevMap,
      [csvHeader]: value === '' ? null : value,
    }));
  };

  const handleSave = async () => {
    if (!leadSource) return;
    setIsSaving(true);
    setError(null);
    try {
      const metadata: LeadSourceMetadata = {
        tableName: targetTable,
        columnMap: columnMap,
      };
      await onSave(leadSource.id, metadata);
      onClose();
    } catch (err: any) {
      console.error('Error saving metadata:', err);
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">
          Configure Lead Source: {leadSource?.file_name || '...'}
        </h2>
      </div>
      <div className="p-4 max-h-[70vh] overflow-y-auto">
        {isLoadingHeaders && (
          <div className="flex justify-center items-center h-40">
            <Spinner size="lg" />
            <span className="ml-2">Loading headers...</span>
          </div>
        )}
        {error && <p className="text-red-600 p-4 bg-red-50 rounded">Error: {error}</p>}
        {!isLoadingHeaders && !error && csvHeaders.length > 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Table</label>
              <input
                type="text"
                value={targetTable}
                readOnly
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-100 cursor-not-allowed"
              />
            </div>
            <h3 className="text-lg font-medium">Map CSV Columns to Lead Fields</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 items-center border-t border-b border-gray-200 py-2">
              <div className="font-semibold text-sm text-gray-600">CSV Header</div>
              <div className="font-semibold text-sm text-gray-600">Lead Field (Target: {targetTable})</div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
                {csvHeaders.map((header) => (
                  <div key={header} className="grid grid-cols-2 gap-x-4 gap-y-3 items-center">
                    <div className="py-1 truncate text-sm" title={header}>{header}</div>
                    <div>
                      <Select
                        aria-label={`Map ${header}`}
                        placeholder="Select Field or Ignore"
                        value={columnMap[header] || ''}
                        onChange={(e) => handleMappingChange(header, e.target.value)}
                        className="w-full"
                      >
                        <option value="">-- Do Not Import --</option>
                        {targetLeadColumns.map((col) => (
                          <option key={col} value={col}>
                            {col}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {!isLoadingHeaders && !error && csvHeaders.length === 0 && (
          <p className="text-center text-gray-500 py-4">Could not load headers for this file, or the file might be empty.</p>
        )}
      </div>
      <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
        <Button variant="bordered" color="secondary" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          color="primary"
          onClick={handleSave}
          isLoading={isSaving}
          disabled={isLoadingHeaders || csvHeaders.length === 0 || isSaving}
        >
          Save Configuration
        </Button>
      </div>
    </Modal>
  );
};

export default ConfigureSourceModal;
