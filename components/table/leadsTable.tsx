"use client";

import { useCallback, useState, useMemo, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Tooltip,
  Pagination,
  Selection,
  ChipProps,
  SortDescriptor,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Checkbox,
  Spinner,
  Select,
  SelectItem
} from "@heroui/react";
import { MagnifyingGlassIcon as SearchIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/outline";
import { EllipsisVerticalIcon as VerticalDotsIcon } from "@heroicons/react/24/outline";
import { columns, statusColorMap, statusOptions, emailStatusOptions } from "./tableData";
import { getLeads } from "@/actions/ingestLeads.action";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { generateLoi } from "@/actions/generateLoi.action";
import { sendLoiEmail } from "@/actions/sendLoiEmail.action";
import { Lead } from "@/helpers/types";

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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set([
    "property_address", "property_city", "property_state", "property_zip", "status", "email_status", "actions"
  ]));
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Selection>(new Set(["all"]));
  const [emailStatusFilter, setEmailStatusFilter] = useState<Selection>(new Set(["all"]));
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "created_at",
    direction: "descending",
  });
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [bulkStatus, setBulkStatus] = useState<string>("");
  const router = useRouter();
  
  // Modal state for bulk email
  const { isOpen: isEmailModalOpen, onOpen: onOpenEmailModal, onClose: onCloseEmailModal } = useDisclosure();
  // Modal state for bulk delete confirmation
  const { isOpen: isDeleteModalOpen, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
  // Modal state for bulk status update
  const { isOpen: isStatusModalOpen, onOpen: onOpenStatusModal, onClose: onCloseStatusModal } = useDisclosure();

  // Load leads with their email statuses
  useEffect(() => {
    loadLeads();
  }, []);
  
  // Function to load leads data
  const loadLeads = useCallback(async () => {
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
  }, [searchQuery, statusFilter, emailStatusFilter]);

  // Handle column visibility change
  const handleColumnVisibilityChange = useCallback((column: string) => {
    setVisibleColumns((prevColumns) => {
      const newColumns = new Set(prevColumns);
      if (newColumns.has(column)) {
        newColumns.delete(column);
      } else {
        newColumns.add(column);
      }
      return newColumns;
    });
  }, []);

  // Compute the filtered and sorted items
  const items = useMemo(() => {
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

  // Compute the pagination
  const pages = Math.ceil(items.length / rowsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return items.slice(start, end);
  }, [items, page, rowsPerPage]);

  // Rows per page options
  const rowsPerPageOptions = [5, 10, 15, 20, 25];

  // Handle rows per page change
  const handleRowsPerPageChange = useCallback((value: number) => {
    setRowsPerPage(value);
    setPage(1);
  }, []);

  // Get selected leads
  const selectedLeads = useMemo(() => {
    if (selectedKeys === "all") {
      return items;
    }
    const selectedKeysArray = Array.from(selectedKeys);
    return items.filter(lead => lead.id && selectedKeysArray.includes(lead.id));
  }, [selectedKeys, items]);

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
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
        <div className="flex w-full sm:w-auto flex-1 max-w-md">
          <Input
            isClearable
            placeholder="Search by address, city, or contact..."
            startContent={<SearchIcon className="text-default-400" />}
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="w-full"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-end justify-end">
          {/* Column visibility dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                endContent={<ChevronDownIcon className="text-small" />}
              >
                Columns
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Column visibility"
              closeOnSelect={false}
              selectedKeys={visibleColumns}
              selectionMode="multiple"
            >
              <DropdownItem key="property_address">Address</DropdownItem>
              <DropdownItem key="property_city">City</DropdownItem>
              <DropdownItem key="property_state">State</DropdownItem>
              <DropdownItem key="property_zip">Zip</DropdownItem>
              <DropdownItem key="status">Lead Status</DropdownItem>
              <DropdownItem key="email_status">Email Status</DropdownItem>
              <DropdownItem key="actions">Actions</DropdownItem>
            </DropdownMenu>
          </Dropdown>

          {/* Lead status filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                endContent={<ChevronDownIcon className="text-small" />}
              >
                Lead Status
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Lead Status Filter"
              closeOnSelect={false}
              selectedKeys={statusFilter}
              selectionMode="multiple"
              onSelectionChange={setStatusFilter as any}
            >
              {["all", "new", "contacted", "qualified", "negotiating", "closed", "dead"].map((status) => (
                <DropdownItem key={status} className="capitalize">
                  {status === "all" ? "All" : status}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Email status filter */}
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                endContent={<ChevronDownIcon className="text-small" />}
              >
                Email Status
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Email Status Filter"
              closeOnSelect={false}
              selectedKeys={emailStatusFilter}
              selectionMode="multiple"
              onSelectionChange={setEmailStatusFilter as any}
            >
              {["all", "pending", "sent", "opened", "clicked", "replied", "bounced", "failed"].map((status) => (
                <DropdownItem key={status} className="capitalize">
                  {status === "all" ? "All" : status}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          {/* Bulk actions button - only shown when items are selected */}
          {selectedKeys !== "all" && selectedKeys.size > 0 && (
            <Dropdown>
              <DropdownTrigger>
                <Button 
                  color="primary"
                >
                  Actions ({selectedKeys.size})
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Bulk Actions">
                <DropdownItem key="bulk-loi" onClick={handleBulkLOI}>Generate LOIs</DropdownItem>
                <DropdownItem key="bulk-email" onClick={handleBulkEmail}>Send Emails</DropdownItem>
              </DropdownMenu>
            </Dropdown>
          )}
        </div>
      </div>

      {/* The actual table */}
      <Table
        aria-label="Leads table"
        isHeaderSticky
        classNames={{
          wrapper: "max-h-[calc(100vh-250px)]",
          table: "min-h-[400px]",
        }}
        sortDescriptor={sortDescriptor}
        onSortChange={handleSortChange}
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
        selectionMode="multiple"
      >
        <TableHeader>
          <TableColumn key="property_address" allowsSorting isVisible={visibleColumns.has("property_address")}>Address</TableColumn>
          <TableColumn key="property_city" allowsSorting isVisible={visibleColumns.has("property_city")}>City</TableColumn>
          <TableColumn key="property_state" allowsSorting isVisible={visibleColumns.has("property_state")}>State</TableColumn>
          <TableColumn key="property_zip" isVisible={visibleColumns.has("property_zip")}>Zip</TableColumn>
          <TableColumn key="status" allowsSorting isVisible={visibleColumns.has("status")}>Lead Status</TableColumn>
          <TableColumn key="email_status" allowsSorting isVisible={visibleColumns.has("email_status")}>Email Status</TableColumn>
          <TableColumn key="actions" isVisible={visibleColumns.has("actions")}>Actions</TableColumn>
        </TableHeader>
        <TableBody
          loadingContent={<Spinner />}
          emptyContent={
            searchQuery || statusFilter.has("all") === false || emailStatusFilter.has("all") === false 
              ? "No leads match your filters. Try adjusting your search or filters." 
              : "No leads found. Upload some leads using the CSV upload tool."
          }
          isLoading={loading}
        >
          {paginatedItems.length > 0 ? (
            paginatedItems.map((lead) => (
              <TableRow 
                key={lead.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={onRowClick && lead.id ? () => handleRowClick(lead.id!) : undefined}
              >
                {visibleColumns.has("property_address") && <TableCell>{lead.property_address}</TableCell>}
                {visibleColumns.has("property_city") && <TableCell>{lead.property_city}</TableCell>}
                {visibleColumns.has("property_state") && <TableCell>{lead.property_state}</TableCell>}
                {visibleColumns.has("property_zip") && <TableCell>{lead.property_zip}</TableCell>}
                {visibleColumns.has("status") && (
                  <TableCell>
                    <Chip size="sm" variant="flat" color={getLeadStatusChipColor(lead.status || 'new')}>
                      {lead.status || 'New'}
                    </Chip>
                  </TableCell>
                )}
                {visibleColumns.has("email_status") && (
                  <TableCell>
                    <Chip 
                      size="sm" 
                      variant="flat" 
                      color={getStatusChipColor(lead.email_status || 'pending')}>
                      {lead.email_status || 'Pending'}
                    </Chip>
                  </TableCell>
                )}
                {visibleColumns.has("actions") && (
                  <TableCell className="whitespace-nowrap">
                    <div className="flex gap-2 items-center">
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light">
                            <VerticalDotsIcon className="text-default-300" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          <DropdownItem 
                            key="generate-loi" 
                            onClick={(e) => {
                              e.stopPropagation();
                              lead.id && handleGenerateLOI(lead.id, e);
                            }}
                          >
                            Generate LOI
                          </DropdownItem>
                          <DropdownItem 
                            key="send-email"
                            onClick={(e) => {
                              e.stopPropagation();
                              lead.id && handleSendEmail(lead.id, e);
                            }}
                          >
                            Send Email
                          </DropdownItem>
                          {onRowClick && lead.id && (
                            <DropdownItem 
                              key="view"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(lead.id!);
                              }}
                            >
                              View Details
                            </DropdownItem>
                          )}
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : null}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Showing {paginatedItems.length} of {items.length} leads
          </span>
          <Dropdown>
            <DropdownTrigger>
              <Button 
                variant="flat" 
                size="sm"
                endContent={<ChevronDownIcon className="text-small" />}
              >
                {rowsPerPage} per page
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Rows per page"
              selectionMode="single"
              selectedKeys={new Set([rowsPerPage.toString()])}
              onSelectionChange={(keys) => {
                if (keys && typeof keys === 'object' && 'size' in keys && keys.size > 0) {
                  handleRowsPerPageChange(Number(Array.from(keys)[0]));
                }
              }}
            >
              {rowsPerPageOptions.map((option) => (
                <DropdownItem key={option.toString()}>
                  {option}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <Pagination
          isCompact
          showControls
          showShadow
          color="primary"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>

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