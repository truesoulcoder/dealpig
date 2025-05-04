'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import LeadUploader from '@/components/leads/LeadUploader';
import LeadSelector from '@/components/leads/LeadSelector';
import DynamicLeadsTable from '@/components/leads/DynamicLeadsTable';
import FileExplorer from '@/components/leads/FileExplorer';
import ConsoleLog from '@/components/leads/ConsoleLog';
import { useConsoleLogEvents } from '@/components/leads/useConsoleLogEvents';

export default function LeadsPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const messages = useConsoleLogEvents();

  async function fetchTables() {
    const res = await fetch('/api/leads/tables');
    const data = await res.json();
    setTables(data);
    if (!selected && data.length) setSelected(data[0]);
  }

  useEffect(() => { fetchTables(); }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Leads</h1>
      <FileExplorer />
      <LeadUploader onUpload={() => { fetchTables(); }} />
      <ConsoleLog messages={messages} />
      <LeadSelector tables={tables} onSelect={setSelected} />
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
      <DynamicLeadsTable
        table={selected}
        leads={[]}
        onEdit={() => {}}
        onRefresh={() => { fetchTables(); }}
        onSave={() => { /* no-op, real-time updates cover it */ }}
      />
    </div>
  );
}