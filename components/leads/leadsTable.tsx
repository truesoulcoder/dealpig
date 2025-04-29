import React, { useState, useEffect, useMemo, ChangeEvent, FC, Key } from 'react';
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
} from '@heroui/react';
import type { SortDescriptor as LibrarySortDescriptor, SortDirection as LibrarySortDirection } from '@react-types/shared';
import type { ChipProps } from '@heroui/react';
import { getLeads, updateLead, deleteLead } from '@/actions/leads.action';
import type { Lead } from '@/helpers/types';

// Column definitions
interface Column {
  uid: ColumnUid;
  name: string;
  sortable: boolean;
}
const columns: Column[] = [
  { uid: 'property', name: 'PROPERTY', sortable: true },
  { uid: 'owner', name: 'OWNER', sortable: true },
  { uid: 'values', name: 'VALUES', sortable: true },
  { uid: 'details', name: 'DETAILS', sortable: false },
  { uid: 'mls', name: 'MLS', sortable: true },
  { uid: 'status', name: 'STATUS', sortable: true },
  { uid: 'actions', name: 'ACTIONS', sortable: false },
];

// Key used for react-aria table sorting
type ColumnUid = 'property' | 'owner' | 'values' | 'details' | 'mls' | 'status' | 'actions';
// Reuse library types
type SortDescriptor = LibrarySortDescriptor;
type SortDirection = LibrarySortDirection;

// Use ChipProps color type
type ChipColor = ChipProps['color'];

const statusColor: Record<Lead['status'], ChipColor> = {
  NEW: 'primary',
  CONTACTED: 'secondary',
  INTERESTED: 'success',
  NOT_INTERESTED: 'warning',
  CLOSED: 'success',
  ARCHIVED: 'default',
};

const LeadsTable: FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'property', direction: 'ascending' });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // fetch leads
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getLeads();
        setLeads(data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this lead?')) {
      await deleteLead(id);
      const updated = await getLeads();
      setLeads(updated);
    }
  };

  const handleUpdate = async (lead: Lead) => {
    await updateLead(lead);
    setLeads(await getLeads());
  };

  // filtering & sorting
  const filtered = useMemo(() => {
    return leads.filter(lead =>
      lead.property_address?.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.owner_name?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [leads, searchText]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const { column, direction } = sortDescriptor;
      const aVal = (a as any)[column];
      const bVal = (b as any)[column];
      if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
      if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [filtered, sortDescriptor]);

  // pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  const onPageSizeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const renderCell = (lead: Lead, column: ColumnUid) => {
    switch (column) {
      case 'property':
        return <>{lead.property_address}<br/>{lead.property_city}, {lead.property_state} {lead.property_zip}</>;
      case 'owner':
        return <>{lead.owner_name}</>;
      case 'values':
        return <>${lead.market_value?.toLocaleString() ?? 'N/A'}</>;
      case 'details':
        return <>{lead.beds} bd, {lead.baths} ba</>;
      case 'mls':
        return <>{lead.mls_status}</>;
      case 'status':
        return <Chip color={statusColor[lead.status] as ChipProps['color']}>{lead.status}</Chip>;
      case 'actions':
        return (
          <>
            <Button size="sm" onPress={() => handleUpdate(lead)}>Edit</Button>
            <Button size="sm" color="danger" onPress={() => handleDelete(lead.id)}>Delete</Button>
          </>
        );
    }
  };

  return (
    <div>
      <div className="mb-4 space-x-2">
        <Input
          placeholder="Search leads..."
          value={searchText}
          onValueChange={setSearchText}
        />
      </div>

      <Table
        isHeaderSticky
        sortDescriptor={sortDescriptor}
        onSortChange={(d) => setSortDescriptor({ column: d.column as ColumnUid, direction: d.direction as SortDirection })}
        aria-label="Leads table"
      >
        <TableHeader columns={columns}>
          {col => (
            <TableColumn key={col.uid} allowsSorting={col.sortable}>
              {col.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={pageItems} emptyContent="No leads found">
          {lead => (
            <TableRow key={lead.id}>
              {colKey => <TableCell>{renderCell(lead, colKey as ColumnUid)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center space-x-4">
        <span>
          Page {page} of {totalPages}
        </span>
        <Button size="sm" variant="flat" onPress={() => setPage(p => Math.max(p-1,1))} disabled={page===1}>
          Previous
        </Button>
        <Button size="sm" variant="flat" onPress={() => setPage(p => Math.min(p+1,totalPages))} disabled={page===totalPages}>
          Next
        </Button>
        <select value={pageSize} onChange={onPageSizeChange}>
          {[5,10,20].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
      </div>
    </div>
  );
}

export default LeadsTable;

