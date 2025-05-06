import React, { useState, useEffect, useMemo } from 'react';
import type { Selection, SortDescriptor as HeroSortDescriptor } from '@heroui/react'; // Import Selection and SortDescriptor types
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Pagination, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Input, Spinner, Select, SelectItem
} from '@heroui/react';

// Define a more specific type for a lead if possible, for now 'any'
interface Lead {
  id: number | string;
  [key: string]: any; // Allow other properties
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface LeadsAsyncTableProps { // Exporting the interface
  leads: Lead[];
  paginationInfo: PaginationInfo;
  isLoading: boolean;
  selectedTable: string; // For context in API calls (e.g., update)
  onEditSubmit: (updatedLeadData: any, tableName: string, leadId: string | number) => Promise<void>; // To notify parent about update
  onRefreshData: () => void; // To trigger a refresh in the parent
  currentPage: number;
  rowsPerPage: number;
  sortConfig: { key: string; direction: 'asc' | 'desc' };
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (size: number) => void;
  onSortChange: (sortConfig: { key: string; direction: 'asc' | 'desc' }) => void;
  rowsPerPageOptions?: number[];
}

const LeadsAsyncTable: React.FC<LeadsAsyncTableProps> = ({
  leads,
  paginationInfo,
  isLoading,
  selectedTable,
  onEditSubmit, // Renamed from onEdit for clarity, or keep as onEdit if it's just about opening modal
  onRefreshData,
  currentPage,
  rowsPerPage,
  sortConfig,
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  rowsPerPageOptions = [10, 25, 50, 100],
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableLead, setEditableLead] = useState<Lead | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const columns = useMemo(() => {
    if (!leads || leads.length === 0) return [];
    // Dynamically generate columns from the keys of the first lead object
    // Exclude 'id' from sortable columns if it's not intended, or handle its display specially
    return Object.keys(leads[0]).map(key => ({ key, label: key.replace(/_/g, ' ').toUpperCase() }));
  }, [leads]);

  const handleEdit = (lead: Lead) => {
    setEditableLead({ ...lead });
    setIsModalOpen(true);
    setModalError(null);
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (editableLead) {
      setEditableLead({ ...editableLead, [e.target.name]: e.target.value });
    }
  };

  const handleSave = async () => {
    if (!editableLead || !selectedTable) return;
    setModalSaving(true);
    setModalError(null);
    try {
      // The actual update logic is now in /api/leads/data via POST
      const response = await fetch('/api/leads/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tableName: selectedTable, 
          id: editableLead.id, 
          updates: editableLead 
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update lead: ${response.statusText}`);
      }
      // await onEditSubmit(editableLead, selectedTable, editableLead.id); // Call parent's handler if it does optimistic updates
      onRefreshData(); // Crucial: Trigger data refresh in parent
      setIsModalOpen(false);
      setEditableLead(null);
    } catch (error: any) {
      console.error('Error saving lead:', error);
      setModalError(error.message || 'An unexpected error occurred.');
    } finally {
      setModalSaving(false);
    }
  };

  const renderCell = (item: Lead, columnKey: string | number) => {
    const cellValue = item[columnKey as keyof Lead];
    return String(cellValue); // Simple string conversion
  };

  const topContent = useMemo(() => {
    return (
      <div className="flex justify-between items-center gap-2">
        <div className="text-sm text-gray-600">
          Total {paginationInfo.totalItems} leads
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm">Rows per page:</span>
            <Select 
                aria-label="Rows per page"
                size="sm"
                selectedKeys={new Set([String(rowsPerPage)])}
                onSelectionChange={(keys: Selection) => {
                    if (keys !== 'all' && keys.size > 0) {
                        const value = Array.from(keys)[0];
                        onRowsPerPageChange(Number(value));
                    }
                }}
            >
                {rowsPerPageOptions.map(size => (
                    <SelectItem key={String(size)} textValue={String(size)}>
                        {String(size)}
                    </SelectItem>
                ))}
            </Select>
        </div>
      </div>
    );
  }, [paginationInfo.totalItems, rowsPerPage, onRowsPerPageChange, rowsPerPageOptions]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-center items-center">
        {paginationInfo.totalPages > 1 && (
            <Pagination
                showControls
                color="primary"
                page={currentPage}
                total={paginationInfo.totalPages}
                onChange={onPageChange}
            />
        )}
      </div>
    );
  }, [currentPage, paginationInfo.totalPages, onPageChange]);

  // Prepare sortDescriptor for the HeroUI Table
  const currentTableSortDescriptor: HeroSortDescriptor = {
    column: sortConfig.key, // Table expects 'column', our state uses 'key'
    direction: sortConfig.direction === 'asc' ? 'ascending' : 'descending',
  };

  if (!columns || columns.length === 0 && !isLoading) {
    return (
        <div className="p-4 text-center text-gray-500">
            {selectedTable ? 'No leads found for this table or table is empty.' : 'Please select a table.'}
        </div>
    );
  }

  return (
    <>
      <Table 
        aria-label={`Leads from ${selectedTable}`}
        topContent={topContent}
        topContentPlacement="outside"
        bottomContent={bottomContent}
        bottomContentPlacement="outside"
        sortDescriptor={currentTableSortDescriptor}
        onSortChange={(descriptor: HeroSortDescriptor) => {
            // Adapt descriptor from Table to what our parent onSortChange expects
            if (descriptor.column) { // Ensure column is defined
                onSortChange({
                    key: String(descriptor.column),
                    direction: descriptor.direction === 'ascending' ? 'asc' : 'desc',
                });
            }
        }}
        className="min-h-[200px]" // Ensure table has some height during loading or when empty
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn 
                key={column.key} 
                align={column.key === 'actions' ? 'end' : 'start'}
                allowsSorting={column.key !== 'actions'} // Example: disable sorting for an actions column
            >
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody 
            items={leads || []} 
            isLoading={isLoading} 
            loadingContent={<Spinner label="Loading leads..." />} 
            emptyContent={isLoading ? ' ' : "No leads to display."}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>
                  {columnKey === 'actions' ? (
                    <Button size="sm" variant="light" onPress={() => handleEdit(item)}>
                      Edit
                    </Button>
                  ) : renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      {editableLead && (
        <Modal isOpen={isModalOpen} onOpenChange={() => setIsModalOpen(!isModalOpen)} size="2xl">
          <ModalContent>
            <ModalHeader>Edit Lead - ID: {editableLead.id}</ModalHeader>
            <ModalBody className="max-h-[60vh] overflow-y-auto">
              {modalError && <p className="text-red-500 text-sm mb-2">{modalError}</p>}
              {Object.entries(editableLead).map(([key, value]) => (
                <Input
                  key={key}
                  label={key.replace(/_/g, ' ').toUpperCase()}
                  name={key}
                  value={String(value)} // Ensure value is string
                  onChange={handleModalInputChange}
                  className="mb-2"
                  isReadOnly={key === 'id'} // Make ID read-only
                />
              ))}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button color="primary" onPress={handleSave} isLoading={modalSaving}>
                {modalSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default LeadsAsyncTable;
