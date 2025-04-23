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
  TableCell
} from "@heroui/react";

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <p>Loading leads...</p>;
  }

  return (
    <div className="w-full">
      <Table aria-label="Leads table">
        <TableHeader>
          <TableColumn>Address</TableColumn>
          <TableColumn>City</TableColumn>
          <TableColumn>State</TableColumn>
          <TableColumn>Zip</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>{lead.property_address}</TableCell>
              <TableCell>{lead.property_city}</TableCell>
              <TableCell>{lead.property_state}</TableCell>
              <TableCell>{lead.property_zip}</TableCell>
              <TableCell>{lead.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}