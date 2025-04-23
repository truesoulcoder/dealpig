"use client";

import { useState, useEffect, useMemo } from 'react';
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
  Pagination,
  Input,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Selection,
  SortDescriptor
} from "@heroui/react";
import { SearchIcon } from "@heroui/react/outline";
import { getLeads, getEmailsByLeadId, Lead, Email } from '@/lib/database';

interface LeadWithEmail extends Lead {
  email_status?: string;
  last_email_date?: string;
  recipient_email?: string; 
}

export default function LeadsTable() {
  // State management
  const [leads, setLeads] = useState<LeadWithEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>(new Set(["all"]));
  const [emailStatusFilter, setEmailStatusFilter] = useState<Selection>(new Set(["all"]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "created_at",
    direction: "descending",
  });
  const rowsPerPage = 10;

  // Load leads with their email statuses
  useEffect(() => {
    async function loadLeadsWithEmailStatus() {
      try {
        setLoading(true);
        const leadsData = await getLeads();
        
        // For each lead, get the most recent email
        const leadsWithEmailStatus: LeadWithEmail[] = await Promise.all(
          leadsData.map(async (lead) => {
            if (!lead.id) return { ...lead, email_status: 'PENDING' };
            
            const emails = await getEmailsByLeadId(lead.id);
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
    }

    loadLeadsWithEmailStatus();
  }, []);

  // Filter and sort data
  const filteredLeads = useMemo(() => {
    let filtered = [...leads];
    
    // Apply search query filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.property_address?.toLowerCase().includes(query) ||
        lead.property_city?.toLowerCase().includes(query) ||
        lead.property_zip?.toLowerCase().includes(query) ||
        (lead.contacts && lead.contacts.some(contact => 
          contact.name.toLowerCase().includes(query) || 
          contact.email.toLowerCase().includes(query)
        ))
      );
    }
    
    // Apply lead status filter
    if (statusFilter !== "all" && !statusFilter.has("all")) {
      filtered = filtered.filter(lead => statusFilter.has(lead.status?.toLowerCase() || "new"));
    }
    
    // Apply email status filter
    if (emailStatusFilter !== "all" && !emailStatusFilter.has("all")) {
      filtered = filtered.filter(lead => emailStatusFilter.has(lead.email_status?.toLowerCase() || "pending"));
    }
    
    // Apply sorting
    if (sortDescriptor.column) {
      filtered = [...filtered].sort((a, b) => {
        const first = a[sortDescriptor.column as keyof LeadWithEmail] as string;
        const second = b[sortDescriptor.column as keyof LeadWithEmail] as string;
        
        if (!first && !second) return 0;
        if (!first) return 1;
        if (!second) return -1;
        
        const cmp = first.localeCompare(second);
        
        return sortDescriptor.direction === "descending" ? -cmp : cmp;
      });
    }
    
    return filtered;
  }, [leads, searchQuery, statusFilter, emailStatusFilter, sortDescriptor]);

  // Calculate pagination
  const pages = Math.ceil(filteredLeads.length / rowsPerPage);
  const items = filteredLeads.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Get email status chip color
  const getStatusChipColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'sent':
        return 'success';
      case 'opened':
        return 'primary';
      case 'replied':
        return 'secondary';
      case 'bounced':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };
  
  // Get lead status chip color
  const getLeadStatusChipColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'new':
        return 'primary';
      case 'contacted':
        return 'success';
      case 'negotiating':
        return 'warning';
      case 'closed':
        return 'secondary';
      case 'dead':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Handle LOI generation for a lead
  const handleGenerateLOI = (leadId: string) => {
    // TODO: Implement LOI generation
    console.log(`Generate LOI for lead ${leadId}`);
  };

  // Handle email sending for a lead
  const handleSendEmail = (leadId: string) => {
    // TODO: Implement email sending
    console.log(`Send email for lead ${leadId}`);
  };

  // Handle sort change
  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  };

  if (loading) {
    return <div className="flex justify-center p-4"><span>Loading leads...</span></div>;
  }

  return (
    <div className="w-full space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex w-full sm:w-auto flex-1 max-w-md">
          <Input
            placeholder="Search by address, city, or contact..."
            startContent={<SearchIcon className="w-5 h-5 text-gray-400" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex flex-row gap-2">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat">
                Lead Status
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              selectionMode="multiple"
              selectedKeys={statusFilter}
              onSelectionChange={setStatusFilter}
            >
              <DropdownItem key="all">All Statuses</DropdownItem>
              <DropdownItem key="new">New</DropdownItem>
              <DropdownItem key="contacted">Contacted</DropdownItem>
              <DropdownItem key="negotiating">Negotiating</DropdownItem>
              <DropdownItem key="closed">Closed</DropdownItem>
              <DropdownItem key="dead">Dead</DropdownItem>
            </DropdownMenu>
          </Dropdown>
          
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat">
                Email Status
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              selectionMode="multiple"
              selectedKeys={emailStatusFilter}
              onSelectionChange={setEmailStatusFilter}
            >
              <DropdownItem key="all">All Statuses</DropdownItem>
              <DropdownItem key="pending">Pending</DropdownItem>
              <DropdownItem key="sent">Sent</DropdownItem>
              <DropdownItem key="opened">Opened</DropdownItem>
              <DropdownItem key="replied">Replied</DropdownItem>
              <DropdownItem key="bounced">Bounced</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Leads table */}
      <Table 
        aria-label="Leads table"
        sortDescriptor={sortDescriptor}
        onSortChange={handleSortChange}
      >
        <TableHeader>
          <TableColumn key="property_address" allowsSorting>Address</TableColumn>
          <TableColumn key="property_city" allowsSorting>City</TableColumn>
          <TableColumn key="property_state" allowsSorting>State</TableColumn>
          <TableColumn key="property_zip">Zip</TableColumn>
          <TableColumn key="status" allowsSorting>Lead Status</TableColumn>
          <TableColumn key="email_status" allowsSorting>Email Status</TableColumn>
          <TableColumn key="actions">Actions</TableColumn>
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
                  <Chip size="sm" variant="flat" color={getLeadStatusChipColor(lead.status || 'new')}>
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
                      <Button size="sm" variant="light" onClick={() => handleGenerateLOI(lead.id!)}>
                        Generate LOI
                      </Button>
                    </Tooltip>
                    <Tooltip content="Send Email">
                      <Button size="sm" variant="light" onClick={() => handleSendEmail(lead.id!)}>
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
                {searchQuery || statusFilter.has("all") === false || emailStatusFilter.has("all") === false ? 
                  "No leads match your filters. Try adjusting your search or filters." : 
                  "No leads found. Upload some leads using the CSV upload tool."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      {/* Pagination */}
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