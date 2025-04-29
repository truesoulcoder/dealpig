"use client"

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
} from "@heroui/react";
import { supabase } from "@/lib/supabase";
import LeadSourceSelector from "./LeadSourceSelector";

interface LeadsTableProps {
  className?: string;
  style?: React.CSSProperties;
}

interface Lead {
  id: string;
  // Common fields that might exist in any lead table
  property_address?: string;
  property_city?: string;
  property_state?: string;
  property_zip?: string;
  owner_name?: string;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  wholesale_value?: number;
  market_value?: number;
  days_on_market?: number;
  mls_status?: string;
  mls_list_date?: string;
  mls_list_price?: number;
  owner_type?: string;
  property_type?: string;
  beds?: number;
  baths?: number;
  square_footage?: number;
  year_built?: number;
  assessed_total?: number;
  created_at?: string;
  updated_at?: string;
  // Allow additional dynamic columns
  [key: string]: string | number | boolean | null | undefined;
}

export function LeadsTable({ className, style }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "ascending" | "descending" } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedSourceId, setSelectedSourceId] = useState<string>();
  const [selectedTableName, setSelectedTableName] = useState<string>();
  
  const fetchLeads = useCallback(async (tableName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*");

      if (error) {
        console.error("Error fetching leads:", error);
        return;
      }

      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSourceSelect = useCallback((sourceId: string, storagePath: string) => {
    setSelectedSourceId(sourceId);
    setSelectedTableName(storagePath);
    fetchLeads(storagePath);
  }, [fetchLeads]);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let result = [...leads];

    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(lead => 
        Object.values(lead).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null) return sortConfig.direction === "ascending" ? 1 : -1;
        if (bValue === null) return sortConfig.direction === "ascending" ? -1 : 1;
        
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [leads, searchText, sortConfig]);

  // Calculate pagination
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedLeads.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedLeads, currentPage, pageSize]);

  // Get columns from the first lead
  const columns = useMemo(() => {
    if (leads.length === 0) return [];
    const firstLead = leads[0];
    return Object.keys(firstLead).map(key => ({
      key,
      label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      sortable: true
    }));
  }, [leads]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === "ascending" ? "descending" : "ascending"
    }));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <LeadSourceSelector
          value={selectedSourceId}
          onSelect={handleSourceSelect}
          className="w-64"
        />
        <Input
          placeholder="Search leads..."
          value={searchText}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)}
          className="w-64"
        />
      </div>

      <Table
        aria-label="Leads table"
        isHeaderSticky
        className="min-h-[400px]"
      >
        <TableHeader>
          {columns.map((column) => (
            <TableColumn 
              key={column.key} 
              allowsSorting={column.sortable}
              onClick={() => handleSort(column.key)}
            >
              {column.label}
            </TableColumn>
          ))}
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<div className="text-center">Loading leads...</div>}
          emptyContent={selectedTableName ? "No leads found" : "Select a lead source to view leads"}
        >
          {paginatedLeads.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => (
                <TableCell key={`${row.id}-${column.key}`}>
                  {row[column.key]?.toString() || ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center">
        <span className="text-small text-default-400">
          Total {filteredAndSortedLeads.length} leads
        </span>
        <Pagination
          total={Math.ceil(filteredAndSortedLeads.length / pageSize)}
          page={currentPage}
          onChange={setCurrentPage}
        />
      </div>
    </div>
  );
}

export default LeadsTable;

