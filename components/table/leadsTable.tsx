"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableColumn, 
  TableRow, 
  TableCell,
  Chip,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Input,
  Select,
  SelectItem,
  Spinner
} from "@heroui/react";
import { FaPlus, FaSearch, FaEllipsisVertical, FaEye, FaEdit, FaTrash } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { Lead, LeadStatus } from '@/helpers/types';

// Column definitions for the leads table
const columns = [
  { key: "property_address", label: "PROPERTY ADDRESS" },
  { key: "location", label: "LOCATION" },
  { key: "value", label: "VALUE" },
  { key: "status", label: "STATUS" },
  { key: "created_at", label: "CREATED" },
  { key: "actions", label: "ACTIONS" },
];

// Status options for filtering
const statusOptions = Object.values(LeadStatus).map(status => ({
  label: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
  value: status
}));

// Create a refresh tag to track cache invalidation
let refreshCounter = 0;

export default function LeadsTable() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTag, setRefreshTag] = useState(0);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const rowsPerPage = 10;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Refresh function that can be called from parent components
  const refreshData = useCallback(() => {
    setRefreshTag(++refreshCounter);
  }, []);

  // Make the refresh function available through a ref if needed
  if (typeof window !== 'undefined') {
    // @ts-ignore - Store the refresh function globally for internal communication
    window.__refreshLeadsTable = refreshData;
  }
  
  // Fetch leads data
  const fetchLeads = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('leads')
        .select('*', { count: 'exact' });
      
      // Apply filters
      if (searchQuery) {
        query = query.or(
          `property_address.ilike.%${searchQuery}%,property_city.ilike.%${searchQuery}%,owner_name.ilike.%${searchQuery}%`
        );
      }

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      // Apply pagination
      const from = (page - 1) * rowsPerPage;
      const to = from + rowsPerPage - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      setLeads(data || []);
      setTotal(count || 0);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setError('Failed to load leads. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch and on filter/page change
  useEffect(() => {
    fetchLeads();
  }, [page, searchQuery, statusFilter, refreshTag]);

  // Handle row actions
  const handleViewLead = (leadId: string) => {
    router.push(`/leads/${leadId}`);
  };

  const handleEditLead = (leadId: string) => {
    router.push(`/leads/${leadId}/edit`);
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      
      if (error) throw error;
      
      // Refresh the leads list
      fetchLeads();
    } catch (error) {
      console.error('Error deleting lead:', error);
      setError('Failed to delete lead. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status chip color based on lead status
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'primary';
      case 'contacted':
        return 'success';
      case 'qualified':
        return 'warning';
      case 'negotiating':
        return 'secondary';
      case 'under_contract':
        return 'info';
      case 'closed':
        return 'success';
      case 'dead':
        return 'danger';
      default:
        return 'default';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate pagination information
  const pages = Math.ceil(total / rowsPerPage);
  const hasSearchResults = useMemo(() => leads.length > 0, [leads]);

  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Input
            classNames={{
              base: "w-full sm:w-72",
              inputWrapper: "h-11",
            }}
            placeholder="Search by address or owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<FaSearch className="text-gray-400" />}
            isClearable
            onClear={() => setSearchQuery('')}
          />
          <Select
            className="w-full sm:w-48"
            placeholder="Filter by status"
            selectedKeys={statusFilter ? [statusFilter] : []}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <SelectItem key="" value="">All Statuses</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="flex gap-3">
          <Button 
            color="success" 
            variant="light"
            onPress={refreshData}
          >
            Refresh
          </Button>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      {/* Main table */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
            <Spinner size="lg" />
          </div>
        )}
        
        <Table aria-label="Leads table" className="min-h-[400px]">
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn key={column.key}>
                {column.label}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody 
            items={leads}
            emptyContent={
              !isLoading && (
                searchQuery || statusFilter 
                  ? "No leads match your search criteria" 
                  : "No leads found. Add your first lead."
              )
            }
          >
            {(lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{lead.property_address}</div>
                    {lead.owner_name && (
                      <div className="text-sm text-gray-500">Owner: {lead.owner_name}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span>{lead.property_city}{lead.property_city && lead.property_state ? ', ' : ''}{lead.property_state}</span>
                    {lead.property_zip && <span className="block text-gray-500">{lead.property_zip}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {lead.wholesale_value && (
                      <div>Wholesale: ${lead.wholesale_value.toLocaleString()}</div>
                    )}
                    {lead.market_value && (
                      <div>Market: ${lead.market_value.toLocaleString()}</div>
                    )}
                    {!lead.wholesale_value && !lead.market_value && "-"}
                  </div>
                </TableCell>
                <TableCell>
                  <Chip 
                    size="sm" 
                    color={getStatusColor(lead.status)} 
                    variant="flat"
                  >
                    {lead.status}
                  </Chip>
                </TableCell>
                <TableCell>
                  {formatDate(lead.created_at)}
                </TableCell>
                <TableCell>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly variant="light" size="sm">
                        <FaEllipsisVertical />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Lead Actions">
                      <DropdownItem 
                        key="view" 
                        startContent={<FaEye className="text-blue-500" />}
                        onPress={() => handleViewLead(lead.id)}
                      >
                        View Details
                      </DropdownItem>
                      <DropdownItem 
                        key="edit" 
                        startContent={<FaEdit className="text-green-500" />}
                        onPress={() => handleEditLead(lead.id)}
                      >
                        Edit Lead
                      </DropdownItem>
                      <DropdownItem 
                        key="delete" 
                        className="text-danger" 
                        color="danger"
                        startContent={<FaTrash className="text-red-500" />}
                        onPress={() => handleDeleteLead(lead.id)}
                      >
                        Delete Lead
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      {hasSearchResults && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {Math.min((page - 1) * rowsPerPage + 1, total)} to {Math.min(page * rowsPerPage, total)} of {total} leads
          </span>
          <Pagination
            showControls
            total={pages}
            initialPage={1}
            page={page}
            onChange={setPage}
          />
        </div>
      )}
    </div>
  );
}