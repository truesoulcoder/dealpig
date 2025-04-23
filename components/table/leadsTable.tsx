"use client";

import { fetchLeads } from '@/actions/auth.action';
import { Lead } from '@/helpers/types';
import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Button,
  Tooltip,
  Pagination
} from "@heroui/react";

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    async function loadLeads() {
      try {
        const data = await fetchLeads();
        setLeads(data);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, []);

  // Calculate pagination
  const pages = Math.ceil(leads.length / rowsPerPage);
  const items = leads.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Get email status chip color based on status
  const getStatusChipColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'success';
      case 'opened':
        return 'primary';
      case 'clicked':
        return 'secondary';
      case 'bounced':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4"><span>Loading leads...</span></div>;
  }

  return (
    <div className="w-full">
      <Table aria-label="Leads table">
        <TableHeader>
          <TableColumn>Address</TableColumn>
          <TableColumn>City</TableColumn>
          <TableColumn>State</TableColumn>
          <TableColumn>Zip</TableColumn>
          <TableColumn>Lead Status</TableColumn>
          <TableColumn>Email Status</TableColumn>
          <TableColumn>Actions</TableColumn>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.property_address}</TableCell>
                <TableCell>{lead.property_city}</TableCell>
                <TableCell>{lead.property_state}</TableCell>
                <TableCell>{lead.property_zip}</TableCell>
                <TableCell>
                  <Chip size="sm" variant="flat" color={lead.status === 'new' ? 'primary' : 'default'}>
                    {lead.status || 'New'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="sm" 
                    variant="flat" 
                    color={getStatusChipColor(lead.email_status || 'pending')}>
                    {lead.email_status || 'Pending'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="Generate LOI">
                      <Button size="sm" variant="light">
                        Generate LOI
                      </Button>
                    </Tooltip>
                    <Tooltip content="Send Email">
                      <Button size="sm" variant="light">
                        Send Email
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                No leads found. Upload some leads using the CSV upload tool.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {pages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={pages}
            page={page}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}