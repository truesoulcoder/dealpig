"use client";

import { useState, useEffect } from 'react';
import LeadUploader from './LeadUploader';
import LeadsWorkspace from './LeadsWorkspace';
import ProcessingStatusTable from './ProcessingStatusTable';
import { fetchConsoleLogEvents } from './useConsoleLogEvents';
import { useTheme } from '../ui/theme-context';
import ThemeToggle from '../ui/ThemeToggle';

export default function LeadsPageInner() {
  const { theme } = useTheme();
  const [tables, setTables] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [leads, setLeads] = useState<any[]>([]);
  const [messages, setMessages] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
    timestamp?: number;
  }[]>([]);

  // Only fetch logs at specific events (not real-time or polling)
  // On page load
  useEffect(() => { fetchConsoleLogEvents().then(setMessages); }, []);

  function addMessage(type: 'info' | 'error' | 'success', message: string) {
    setMessages(msgs => [...msgs, { type, message, timestamp: Date.now() }]);
  }

  async function fetchTables() {
    const res = await fetch('/api/leads/tables');
    const data = await res.json();
    setTables(data);
    if (!selected && data.length) setSelected(data[0]);
  }

  async function fetchLeads(table: string) {
    if (!table) return setLeads([]);
    const res = await fetch(`/api/leads?table=${table}`);
    const data = await res.json();
    setLeads(data);
  }

  useEffect(() => { fetchTables(); }, []);
  useEffect(() => { if (selected) fetchLeads(selected); }, [selected]);

  return (
    <div className={theme + " container mx-auto px-4 py-8 flex flex-col gap-8 min-h-screen"}>
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-green-300 mb-4 tracking-wide">Leads Dashboard</h1>
      <div className="w-full max-w-md mx-auto">
        <LeadUploader 
          onUpload={() => {
            fetchTables();
            fetchConsoleLogEvents().then(setMessages); // On successful archiving
          }}
          addMessage={addMessage}
        />
      </div>
      {/* Show processing status table for this user */}
      <ProcessingStatusTable />
      <LeadsWorkspace
        tables={tables}
        selectedTable={selected}
        onTableSelect={setSelected}
        leads={leads}
        onLeadEdit={(lead) => {
          // Update the edited row in leads state
          setLeads((prev) => prev.map(l => l.id === lead.id ? lead : l));
        }}
        onRefresh={() => {
          if (selected) fetchLeads(selected);
          fetchConsoleLogEvents().then(setMessages); // On refresh button click
        }}
        onSave={() => {
          // TODO: Implement save all changes logic (batch update to backend)
        }}
        messages={messages}
      />
    </div>
  );
}
