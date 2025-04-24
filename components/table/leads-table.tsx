import { useEffect, useState, useCallback } from 'react';
import React from 'react';
import { getLeads } from "@/actions/ingestLeads.action";
import { getEmailsByLead } from "@/actions/campaign.action";
import { Spinner } from "@heroui/react";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/react"; 
import { Lead } from "@/helpers/types";
import { ReactNode } from 'react';

// Define interface for leads with email status
interface LeadWithEmail {
  [key: string]: any;
  id?: string;
  status?: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  wholesale_value?: number;
  market_value?: number;
  email_status?: string;
  last_email_date?: string;
  recipient_email?: string;
  contacts?: any[];
}

export const LeadsTable = () => {
  const [leads, setLeads] = useState<LeadWithEmail[]>([]);
  const [loading, setLoading] = useState(true);

  // Function to load leads data
  const loadLeads = useCallback(async () => {
    try {
      setLoading(true);
      const leadsData = await getLeads();
      
      // For each lead, get the most recent email
      const leadsWithEmailStatus: LeadWithEmail[] = await Promise.all(
        leadsData.map(async (lead) => {
          if (!lead.id) return { ...lead, email_status: 'PENDING' };
          
          const emails = await getEmailsByLead(lead.id);
          let emailStatus = 'PENDING';
          let lastEmailDate = '';
          let recipientEmail = '';
          
          if (emails.length > 0) {
            // Get the most recent email
            const latestEmail = emails.sort((a, b) => {
              return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            })[0];
            
            emailStatus = latestEmail.status || 'PENDING';
            lastEmailDate = latestEmail.sent_at || latestEmail.created_at || '';
            
            // Get the recipient's email if available
            if (lead.contacts && lead.contacts.length > 0) {
              recipientEmail = lead.contacts[0].email;
            }
          }
          
          return {
            ...lead,
            email_status: emailStatus,
            last_email_date: lastEmailDate,
            recipient_email: recipientEmail
          };
        })
      );
      
      setLeads(leadsWithEmailStatus);
    } catch (error) {
      console.error('Error fetching leads with email status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const columns = React.useMemo(
    () => [
      {
        Header: 'Address',
        accessor: 'property_address',
      },
      {
        Header: 'City',
        accessor: 'property_city',
      },
      {
        Header: 'State',
        accessor: 'property_state',
      },
      {
        Header: 'Status',
        accessor: 'status',
      },
      {
        Header: 'Email Status',
        accessor: 'email_status',
      }
    ],
    []
  );
  // Function to safely render cell content as ReactNode
  const renderCellContent = (lead: LeadWithEmail, accessor: keyof LeadWithEmail): ReactNode => {
    const value = lead[accessor];
    
    if (value === null || value === undefined) {
      return '';
    }
    
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="overflow-x-auto">
      <Table 
        aria-label="Leads table"
        className="min-w-full"
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn key={column.accessor as string}>
              {column.Header}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              {columns.map((column) => (
                <TableCell key={`${lead.id}-${column.accessor}`}>
                  {renderCellContent(lead, column.accessor as keyof LeadWithEmail)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {leads.length === 0 && !loading && (
        <div className="text-center p-4 text-gray-500">
          No leads found. Import some leads using the CSV upload tool.
        </div>
      )}
    </div>
  );
};

export default LeadsTable;