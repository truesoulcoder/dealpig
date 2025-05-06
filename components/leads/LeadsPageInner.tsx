"use client";

import { useState, useEffect } from 'react';
import LeadUploader from './LeadUploader';
import LeadsWorkspace from './LeadsWorkspace';
import ProcessingStatusTable from './ProcessingStatusTable';
import { useConsoleLogEvents } from './useConsoleLogEvents';
import { useTheme } from '../ui/theme-context';
import ThemeToggle from '../ui/ThemeToggle';
import FileExplorer from './FileExplorer';
import ConsoleLog from './ConsoleLog';

export default function LeadsPageInner() {
  const { theme } = useTheme();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [leadsData, setLeadsData] = useState<{ data: any[], pagination: any }>({ data: [], pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 } });
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10); // Default page size
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'id', direction: 'asc' });
  const [isNormalizing, setIsNormalizing] = useState(false); // For normalization loading state

  const messagesFromHook = useConsoleLogEvents();
  const [messages, setMessages] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
    timestamp?: number;
  }[]>([]);

  useEffect(() => {
    setMessages(messagesFromHook.map(event => ({
      type: event.type as 'info' | 'error' | 'success',
      message: event.message,
      timestamp: event.timestamp
    })));
  }, [messagesFromHook]);

  function addMessage(type: 'info' | 'error' | 'success', message: string) {
    setMessages(prevMessages => [...prevMessages, { type, message, timestamp: Date.now() }]);
  }

  // Function to clear local console messages
  function clearConsoleLogs() {
    setMessages([]);
  }

  async function fetchTables() {
    try {
      addMessage('info', 'Fetching available lead tables...');
      const res = await fetch('/api/leads/tables');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to fetch tables: ${res.statusText}`);
      }
      const data = await res.json();
      setTables(data.tables || []);
      if (!selectedTable && data.tables && data.tables.length > 0) {
        setSelectedTable(data.tables[0]);
      }
      addMessage('success', `Found ${data.tables?.length || 0} lead tables.`);
    } catch (error: any) {
      addMessage('error', `Error fetching tables: ${error.message}`);
      console.error('Error fetching tables:', error);
      setTables([]);
    }
  }

  async function fetchLeads(table: string, page: number, pageSize: number, sortBy: string, sortOrder: string) {
    if (!table) {
      setLeadsData({ data: [], pagination: { page: 1, pageSize: rowsPerPage, totalItems: 0, totalPages: 1 } });
      return;
    }
    setIsLoadingLeads(true);
    addMessage('info', `Fetching leads for ${table}, page ${page}, ${pageSize} rows/page, sort by ${sortBy} ${sortOrder}...`);
    try {
      const res = await fetch(`/api/leads/data?table=${encodeURIComponent(table)}&page=${page}&pageSize=${pageSize}&sortBy=${encodeURIComponent(sortBy)}&sortOrder=${sortOrder}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to fetch leads: ${res.statusText}`);
      }
      const data = await res.json();
      setLeadsData(data || { data: [], pagination: { page: 1, pageSize: rowsPerPage, totalItems: 0, totalPages: 1 } });
      addMessage('success', `Fetched ${data?.data?.length || 0} leads for ${table}. Total: ${data?.pagination?.totalItems || 0}`);
    } catch (error: any) {
      addMessage('error', `Error fetching leads for ${table}: ${error.message}`);
      console.error('Error fetching leads:', error);
      setLeadsData({ data: [], pagination: { page: 1, pageSize: rowsPerPage, totalItems: 0, totalPages: 1 } });
    }
    setIsLoadingLeads(false);
  }

  useEffect(() => { fetchTables(); }, []);
  
  useEffect(() => {
    if (selectedTable) {
      fetchLeads(selectedTable, currentPage, rowsPerPage, sortConfig.key, sortConfig.direction);
    }
  }, [selectedTable, currentPage, rowsPerPage, sortConfig]);

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1); // Reset to first page when table changes
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleRowsPerPageChange = (newPageSize: number) => {
    setRowsPerPage(newPageSize);
    setCurrentPage(1); // Reset to first page
  };

  const handleSortChange = (newSortConfig: { key: string; direction: 'asc' | 'desc' }) => {
    setSortConfig(newSortConfig);
    setCurrentPage(1); // Reset to first page
  };

  const refreshLeadsData = () => {
    if (selectedTable) {
        addMessage('info', `Refreshing leads data for table: ${selectedTable}...`);
        fetchLeads(selectedTable, currentPage, rowsPerPage, sortConfig.key, sortConfig.direction);
    }
  };

  // Function to handle the normalization process and subsequent UI refresh
  async function handleNormalization(sourceFilename: string) {
    if (!sourceFilename) {
      addMessage('error', 'Normalization cannot start: Source filename is missing.');
      return;
    }

    setIsNormalizing(true);
    addMessage('info', `Starting normalization & archiving for ${sourceFilename}...`);

    try {
      const response = await fetch('/api/leads/normalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceFilename }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addMessage('success', `${result.message || `Successfully normalized and archived ${sourceFilename}.`} Refreshing UI...`);
        clearConsoleLogs(); // Clear console on full success
        
        await fetchTables(); // Refresh table list - this might set a new selectedTable if none was selected
        refreshLeadsData(); // Refresh leads for the current (or newly selected) table

        addMessage('info', 'UI refreshed after normalization.');

      } else {
        addMessage('error', `Normalization failed: ${result.message || 'Unknown error from API.'}`);
        // Console logs are NOT cleared on failure
      }
    } catch (error: any) {
      addMessage('error', `Error during normalization request: ${error.message || 'Network or client-side error.'}`);
      // Console logs are NOT cleared on failure
    } finally {
      setIsNormalizing(false);
    }
  }

  return (
    <div className={theme + " container mx-auto px-4 py-8 flex flex-col gap-8 min-h-screen"}>
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-green-300 mb-4 tracking-wide">Leads Dashboard</h1>
      
      {/* File Explorer and Console Log side-by-side */}
      <div className="flex flex-col md:flex-row items-stretch w-full mb-4 gap-4" style={{ minHeight: '200px', maxHeight: '300px' }}>
        <div className="flex-1 bg-gray-800 bg-opacity-50 overflow-auto flex flex-col p-2 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-300 mb-2 pl-1">File Explorer</h2>
          <FileExplorer />
        </div>
        <div className="flex-1 bg-gray-800 bg-opacity-50 overflow-auto flex flex-col p-2 rounded-lg border border-gray-700 shadow-lg">
          <h2 className="text-lg font-semibold text-gray-300 mb-2 pl-1">Console Log</h2>
          <ConsoleLog messages={messages} />
        </div>
      </div>

      <div className="w-full max-w-md mx-auto">
        <LeadUploader 
          onUploadSuccess={(uploadedFilename) => {
            // When upload is successful, start the normalization process
            handleNormalization(uploadedFilename);
          }}
          addMessage={addMessage}
          isProcessing={isNormalizing} // Disable uploader while normalizing
        />
      </div>
      {/* Show processing status table for this user */}
      <ProcessingStatusTable />
      <LeadsWorkspace
        tables={tables}
        selectedTable={selectedTable}
        onTableSelect={handleTableSelect}
        leadsData={leadsData}
        isLoadingLeads={isLoadingLeads || isNormalizing} // Consider normalization as a loading state for the table
        onLeadEdit={(lead) => { 
          refreshLeadsData(); 
        }}
        onRefresh={refreshLeadsData} // Pass the refresh function
        // Pass pagination and sorting states and handlers
        currentPage={currentPage}
        rowsPerPage={rowsPerPage}
        sortConfig={sortConfig}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        onSortChange={handleSortChange}
        messages={messages}
      />
    </div>
  );
}
