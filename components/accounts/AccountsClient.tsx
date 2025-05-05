"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Button, Input, Card, CardHeader, CardBody, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination,
  Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from "@heroui/react";
import type { SortDescriptor, SortDirection, Key } from "@react-types/shared";
import { DotsIcon } from "@/components/icons/accounts/dots-icon";
import { ExportIcon } from "@/components/icons/accounts/export-icon";
import { TrashIcon } from "@/components/icons/accounts/trash-icon";
import type { Sender } from "@/helpers/types";

interface AccountsClientProps {
  initialSenders: Sender[];
}

export default function AccountsClient({ initialSenders }: AccountsClientProps) {
  const [senders, setSenders] = useState<Sender[]>(initialSenders);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredSenders, setFilteredSenders] = useState<Sender[]>(initialSenders);
  const [page, setPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "name" as Key, direction: "ascending" as SortDirection });

  const filterSenders = useCallback(() => {
    if (!searchQuery) {
      setFilteredSenders(senders);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = senders.filter(sender => 
      sender.name?.toLowerCase().includes(query) || 
      sender.email?.toLowerCase().includes(query) ||
      (sender.title && sender.title.toLowerCase().includes(query))
    );
    setFilteredSenders(filtered);
  }, [searchQuery, senders]);

  useEffect(() => { filterSenders(); }, [senders, searchQuery, filterSenders]);

  const handleExportCSV = () => {
    if (filteredSenders.length === 0) { alert('No senders to export'); return; }
    const headers = ['Name', 'Email', 'Title', 'Emails Sent', 'Daily Quota', 'Last Sent'];
    const csvContent = [
      headers.join(','),
      ...filteredSenders.map(s => [
        s.name, s.email, s.title || '', s.emails_sent || '0', s.daily_quota || '100', s.last_sent_at ? new Date(s.last_sent_at).toLocaleString() : 'Never'
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `email-senders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Input 
            placeholder="Search senders..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
          <Button onClick={() => setSearchQuery('')}>Clear</Button>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleExportCSV}>Export CSV</Button>
        </div>
      </CardHeader>
      <CardBody>
        <Table
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
        >
          <TableHeader>
            <TableColumn key="name">Name</TableColumn>
            <TableColumn key="email">Email</TableColumn>
            <TableColumn key="title">Title</TableColumn>
            <TableColumn key="quota">Daily Quota</TableColumn>
            <TableColumn key="sent">Emails Sent</TableColumn>
            <TableColumn key="actions">Actions</TableColumn>
          </TableHeader>
          <TableBody>
            {filteredSenders.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(sender => (
              <TableRow key={sender.id}>
                <TableCell>{sender.name}</TableCell>
                <TableCell>{sender.email}</TableCell>
                <TableCell>{sender.title || '-'}</TableCell>
                <TableCell>{sender.daily_quota}</TableCell>
                <TableCell>{sender.emails_sent || 0}</TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <DotsIcon />
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key="refresh-oauth" onPress={() => window.location.href = `/api/auth/gmail/refresh?sender_id=${sender.id}`}>Refresh OAuth</DropdownItem>
                      <DropdownItem key="export" onPress={() => handleExportCSV()}>Export</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                  <Button variant="ghost" onPress={() => {
                    if (confirm('Delete this sender?')) {
                      fetch(`/api/senders/${sender.id}`, { method: 'DELETE' })
                        .then(() => setSenders(prev => prev.filter(s => s.id !== sender.id)));
                    }
                  }}>
                    <TrashIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-2">
          <Pagination
            total={Math.ceil(filteredSenders.length / rowsPerPage)}
            page={page}
            onChange={setPage}
          />
          <select
            value={rowsPerPage}
            onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
            className="border rounded p-1"
          >
            {[5, 10, 20].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </CardBody>
    </Card>
  );
}
