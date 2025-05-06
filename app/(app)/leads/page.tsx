'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import LeadUploader from '@/components/leads/LeadUploader';
import LeadSelector from '@/components/leads/LeadSelector';
import LeadsAsyncTable from '@/components/leads/LeadsAsyncTable';
import FileExplorer from '@/components/leads/FileExplorer';
import ConsoleLog from '@/components/leads/ConsoleLog';
import { useConsoleLogEvents } from '@/components/leads/useConsoleLogEvents';

export default function LeadsPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const messages = useConsoleLogEvents();

  async function fetchTables() {
    setError(null);
    try {
      const res = await fetch('/api/leads/tables');
      if (!res.ok) {
        throw new Error(`Failed to fetch tables: ${res.statusText}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid data format received for tables.');
      }
      setTables(data);
      if (!selected && data.length > 0) {
        setSelected(data[0]);
      }
    } catch (err) {
      console.error("fetchTables error:", err);
      setError(err instanceof Error ? err.message : String(err));
      setTables([]);
      setSelected('');
    }
  }

  useEffect(() => { fetchTables(); }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Leads</h1>
      {/* File Explorer and Console Log side-by-side */}
      <div className="flex flex-row items-stretch w-full mb-4 h-[191px] gap-2">
        <div className="flex-1 h-full bg-black/60 overflow-auto flex flex-col p-2 rounded-lg">
          <FileExplorer />
        </div>
        <div className="flex-1 h-full bg-black/60 overflow-auto flex flex-col p-2 rounded-lg">
          <ConsoleLog messages={messages} />
        </div>
      </div>
      <LeadUploader onUpload={() => { fetchTables(); }} />
      {/* Display error if fetching tables failed */}
      {error && <p className="text-danger-500">Error loading tables: {error}</p>}
      <LeadSelector tables={tables} selected={selected} onSelect={setSelected} />
      {/* Controls above leads table */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => { fetchTables(); }}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Refresh
        </button>
        <button
          disabled
          className="px-4 py-2 bg-gray-400 text-white rounded opacity-50 cursor-not-allowed"
        >
          Save
        </button>
      </div>
      {selected ? (
        <LeadsAsyncTable table={selected} />
      ) : (
        error ? 
          <p className="text-gray-500">Could not load tables.</p> :
          (tables.length === 0 ? 
            <p className="text-gray-500">No lead tables found. Upload a CSV to get started.</p> :
            <p className="text-gray-500">Select a table to view leads.</p>)
      )}
    </div>
  );
}