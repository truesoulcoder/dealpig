'use client';

import { useState, useEffect } from 'react';
import LeadUploader from '../../../components/leads/LeadUploader';
import LeadSelector from '../../../components/leads/LeadSelector';
import DynamicLeadsTable from '../../../components/leads/DynamicLeadsTable';
import FileExplorer from '../../../components/leads/FileExplorer';
import ConsoleLog from '../../../components/leads/ConsoleLog';
import { useRealtimeConsoleLogEvents } from '../../../components/leads/useConsoleLogEvents';

export default function LeadsPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  useRealtimeConsoleLogEvents(setMessages);

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
      <LeadUploader onUpload={fetchTables} />
      <ConsoleLog messages={messages} />
      <LeadSelector tables={tables} onSelect={setSelected} />
      <DynamicLeadsTable table={selected} leads={[]} onEdit={() => {}} onRefresh={fetchTables} onSave={() => {}} />
    </div>
  );
}