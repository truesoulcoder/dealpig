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
  SortDescriptor,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem
} from "@heroui/react";
import { SearchIcon, CheckIcon } from "@heroui/react/outline";
import { FaChevronDown, FaCog } from "react-icons/fa";
import { getLeads, getEmailsByLeadId, updateLead, Lead, Email } from '@/lib/database';
import { trpc } from '@/app/providers/trpc-provider';
import { useRouter } from 'next/navigation';

interface LeadWithEmail extends Lead {
  email_status?: string;
  last_email_date?: string;
  recipient_email?: string; 
}

interface LeadsTableProps {
  onRowClick?: (leadId: string) => void;
}

export default function LeadsTable({ onRowClick }: LeadsTableProps) {
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
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const rowsPerPage = 10;
  const router = useRouter();
  
  // Modal state for bulk email
  const { isOpen: isEmailModalOpen, onOpen: onOpenEmailModal, onClose: onCloseEmailModal } = useDisclosure();
  // Modal state for bulk delete confirmation
  const { isOpen: isDeleteModalOpen, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
  // Modal state for bulk status update
  const { isOpen: isStatusModalOpen, onOpen: onOpenStatusModal, onClose: onCloseStatusModal } = useDisclosure();

  // tRPC mutation hooks
  const updateLeadMutation = trpc.leads.updateLead.useMutation({
    onSuccess: () => {
      // Refresh leads data after successful update
      loadLeadsWithEmailStatus();
      // Clear selection
      setSelectedKeys(new Set([]));
      // Close modal if it was open
      onCloseStatusModal();
    },
    onError: (error) => {
      console.error('Error updating leads:', error);
      // Handle error (could show an error toast notification here)
    }
  });
  
  const deleteLeadMutation = trpc.leads.deleteLead.useMutation({
    onSuccess: () => {
      loadLeadsWithEmailStatus();
      setSelectedKeys(new Set([]));
      onCloseDeleteModal();
    },
    onError: (error) => {
      console.error('Error deleting leads:', error);
    }
  });

  // Load leads with their email statuses
  useEffect(() => {
    loadLeadsWithEmailStatus();
  }, []);
  
  // Function to load leads data
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

  // Get selected leads
  const selectedLeads = useMemo(() => {
    if (selectedKeys === "all") {
      return filteredLeads;
    }
    const selectedKeysArray = Array.from(selectedKeys);
    return filteredLeads.filter(lead => lead.id && selectedKeysArray.includes(lead.id));
  }, [selectedKeys, filteredLeads]);

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
  const handleGenerateLOI = (leadId: string, event: React.MouseEvent) => {
    // Prevent the row click event from firing
    event.stopPropagation();
    console.log(`Generate LOI for lead ${leadId}`);
    // Navigate to the generate LOI page
    router.push(`/leads/${leadId}/generate-loi`);
  };

  // Handle bulk LOI generation
  const handleBulkGenerateLOI = () => {
    // Redirect to bulk LOI generation page with selected lead IDs
    const leadIds = selectedLeads.map(lead => lead.id).join(',');
    router.push(`/leads/bulk-loi?ids=${leadIds}`);
  };

  // Handle email sending for a lead
  const handleSendEmail = (leadId: string, event: React.MouseEvent) => {
    // Prevent the row click event from firing
    event.stopPropagation();
    console.log(`Send email for lead ${leadId}`);
    // Navigate to the send email page
    router.push(`/leads/${leadId}/send-email`);
  };
  
  // Handle bulk email sending
  const handleBulkSendEmail = () => {
    onOpenEmailModal();
  };
  
  // Process bulk email send
  const processBulkEmail = () => {
    const leadIds = selectedLeads.map(lead => lead.id).join(',');
    router.push(`/leads/bulk-email?ids=${leadIds}`);
    onCloseEmailModal();
  };
  
  // Handle bulk status update
  const handleBulkStatusUpdate = () => {
    onOpenStatusModal();
  };
  
  // Process bulk status update
  const processBulkStatusUpdate = async () => {
    if (!bulkStatus) return;
    
    try {
      // Update each selected lead with the new status
      await Promise.all(
        selectedLeads.map(lead => {
          if (!lead.id) return Promise.resolve();
          return updateLeadMutation.mutate({
            id: lead.id,
            status: bulkStatus,
            property_address: lead.property_address,
            property_city: lead.property_city,
            property_state: lead.property_state,
            property_zip: lead.property_zip,
            owner_name: lead.owner_name || '',
            owner_email: lead.contacts?.[0]?.email || '',
            offer_price: lead.offer_price || 0
          });
        })
      );
      
      // Successfully updated
      onCloseStatusModal();
      setSelectedKeys(new Set([]));
    } catch (error) {
      console.error('Error in bulk status update:', error);
    }
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    onOpenDeleteModal();
  };
  
  // Process bulk delete
  const processBulkDelete = async () => {
    try {
      // Delete each selected lead
      await Promise.all(
        selectedLeads.map(lead => {
          if (!lead.id) return Promise.resolve();
          return deleteLeadMutation.mutate(lead.id);
        })
      );
      
      // Successfully deleted
      onCloseDeleteModal();
      setSelectedKeys(new Set([]));
    } catch (error) {
      console.error('Error in bulk delete:', error);
    }
  };

  // Handle sort change
  const handleSortChange = (descriptor: SortDescriptor) => {
    setSortDescriptor(descriptor);
  };

  // Handle row click to view lead details
  const handleRowClick = (leadId: string) => {
    if (onRowClick) {
      onRowClick(leadId);
    }
  };

  // Handle selection change
  const handleSelectionChange = (keys: Selection) => {
    setSelectedKeys(keys);
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
          {/* Show bulk actions when items are selected */}
          {selectedKeys !== "all" && selectedKeys.size > 0 && (
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  color="primary"
                  endContent={<FaChevronDown />}
                >
                  Bulk Actions ({selectedKeys.size})
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Bulk Actions">
                <DropdownItem key="status" onClick={handleBulkStatusUpdate}>
                  Update Status
                </DropdownItem>
                <DropdownItem key="email" onClick={handleBulkSendEmail}>
                  Send Email
                </DropdownItem>
                <DropdownItem key="loi" onClick={handleBulkGenerateLOI}>
                  Generate LOIs
                </DropdownItem>
                <DropdownItem key="delete" className="text-danger" onClick={handleBulkDelete}>
                  Delete Leads
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
          
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
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
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
              <TableRow 
                key={lead.id} 
                className="hover:bg-gray-50"
              >
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
                      <Button 
                        size="sm" 
                        variant="light" 
                        onClick={lead.id ? (e) => handleGenerateLOI(lead.id!, e) : undefined}
                      >
                        Generate LOI
                      </Button>
                    </Tooltip>
                    <Tooltip content="Send Email">
                      <Button 
                        size="sm" 
                        variant="light" 
                        onClick={lead.id ? (e) => handleSendEmail(lead.id!, e) : undefined}
                      >
                        Send Email
                      </Button>
                    </Tooltip>
                    {onRowClick && lead.id && (
                      <Tooltip content="View Details">
                        <Button 
                          size="sm" 
                          variant="light" 
                          onClick={() => handleRowClick(lead.id!)}
                        >
                          View
                        </Button>
                      </Tooltip>
                    )}
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
      
      {/* Bulk Email Modal */}
      <Modal isOpen={isEmailModalOpen} onClose={onCloseEmailModal}>
        <ModalContent>
          <ModalHeader>Send Bulk Email</ModalHeader>
          <ModalBody>
            <p>You are about to send emails to {selectedLeads.length} lead(s).</p>
            <p className="text-sm text-gray-500 mt-2">
              This action will redirect you to the bulk email composer where you can customize your message.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onCloseEmailModal}>
              Cancel
            </Button>
            <Button color="primary" onClick={processBulkEmail}>
              Proceed
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Bulk Status Update Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={onCloseStatusModal}>
        <ModalContent>
          <ModalHeader>Update Lead Status</ModalHeader>
          <ModalBody>
            <p className="mb-4">Update status for {selectedLeads.length} selected leads:</p>
            <Select
              label="Select new status"
              placeholder="Choose a status"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="w-full"
            >
              <SelectItem key="new" value="new">New</SelectItem>
              <SelectItem key="contacted" value="contacted">Contacted</SelectItem>
              <SelectItem key="negotiating" value="negotiating">Negotiating</SelectItem>
              <SelectItem key="closed" value="closed">Closed</SelectItem>
              <SelectItem key="dead" value="dead">Dead</SelectItem>
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onCloseStatusModal}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onClick={processBulkStatusUpdate}
              isDisabled={!bulkStatus}
              isLoading={updateLeadMutation.isLoading}
            >
              Update Status
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Bulk Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onCloseDeleteModal}>
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            <p className="text-red-500 font-medium">Warning: This action cannot be undone.</p>
            <p className="mt-2">You are about to delete {selectedLeads.length} lead(s). Are you sure you want to proceed?</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onClick={onCloseDeleteModal}>
              Cancel
            </Button>
            <Button 
              color="danger" 
              onClick={processBulkDelete}
              isLoading={deleteLeadMutation.isLoading}
            >
              Delete Leads
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}