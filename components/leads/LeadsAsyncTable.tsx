import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  getKeyValue,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  useDisclosure,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Selection,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import useSWR from "swr";
import { Lead } from "@/helpers/types";

interface SWRData {
  data: Lead[];
  total: number;
  error?: string;
}

const fetcher = async (url: string): Promise<SWRData> => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Failed to fetch data');
  }
  return res.json();
};

interface LeadsAsyncTableProps {
  table: string;
}

export default function LeadsAsyncTable({ table }: LeadsAsyncTableProps) {
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [editableLead, setEditableLead] = React.useState<Partial<Lead>>({});
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "PropertyAddress",
    direction: "ascending",
  });

  const { data, error, isLoading } = useSWR<SWRData>(
    table ? `/api/leads/data?table=${encodeURIComponent(table)}&page=${page}&limit=${rowsPerPage}` : null,
    fetcher,
    { 
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  const pages = React.useMemo(() => data?.total ? Math.ceil(data.total / rowsPerPage) : 0, [data?.total, rowsPerPage]);

  const columns = React.useMemo(() => {
    if (data?.data && data.data.length > 0) return Object.keys(data.data[0]);
    return [];
  }, [data?.data]);

  const sortedItems = React.useMemo(() => {
    if (!data?.data) return [];
    return [...data.data].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Lead];
      const second = b[sortDescriptor.column as keyof Lead];
      const cmp = (first ?? '') < (second ?? '') ? -1 : (first ?? '') > (second ?? '') ? 1 : 0;
      return sortDescriptor.direction === 'descending' ? -cmp : cmp;
    });
  }, [data?.data, sortDescriptor]);

  const loadingState = isLoading ? "loading" : error ? "error" : (data?.data?.length === 0 ? "empty" : "idle");

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEditableLead({ ...lead });
    onOpen();
  };

  const handleInputChange = (key, value) => {
    setEditableLead((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    setSelectedLead({ ...editableLead } as Lead);
    console.log('Saving lead:', editableLead);
    onClose();
  };

  const renderCell = React.useCallback((item: Lead, columnKey: React.Key) => {
    const cellValue = getKeyValue(item, columnKey);
    if (typeof cellValue === 'string' && (columnKey === 'CreatedAt' || columnKey === 'UpdatedAt' || columnKey === 'LastContactedAt' || columnKey === 'MLSListDate')) {
      try {
        return <TableCell>{new Date(cellValue).toLocaleString()}</TableCell>;
      } catch (e) {
        return <TableCell>{cellValue}</TableCell>; 
      }
    }
    return <TableCell>{cellValue}</TableCell>;
  }, []);

  const onRowsPerPageChange = React.useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
  }, []);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-default-400 text-small">Rows per page:</span>
            <Dropdown>
              <DropdownTrigger>
                <Button variant="flat" size="sm">{rowsPerPage}</Button>
              </DropdownTrigger>
              <DropdownMenu>
                {[10, 25, 50, 100].map((count) => (
                  <DropdownItem key={count} onPress={() => setRowsPerPage(count)}>
                    {count}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
          <span className="text-small text-default-400">
            {loadingState === 'loading' && "Loading leads..."}
            {loadingState === 'error' && <span className="text-danger text-small">Error loading leads: {error.message}</span>}
            {loadingState === 'idle' && `Total ${data.total} leads`}
          </span>
        </div>

        <Table
          aria-label="Uploaded Leads Table"
          selectionMode="single"
          onRowAction={(key) => {
            const lead = sortedItems.find((item) => String(item.Id) === String(key)); 
            if (lead) handleRowClick(lead);
          }}
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          classNames={{
            tbody: "cursor-pointer",
            tr: "transition-colors hover:bg-primary-50 data-[selected=true]:bg-primary-100",
          }}
          bottomContent={
            pages > 0 ? (
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={(page) => setPage(page)}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            {columns.map((col) => (
              <TableColumn 
                key={col} 
                allowsSorting={true}
              >
                {col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody
            items={sortedItems ?? []}
            loadingContent={<Spinner label="Loading..." />}
            loadingState={loadingState}
            emptyContent={loadingState !== 'loading' ? "No leads found." : " "}
          >
            {(item) => (
              <TableRow key={item?.Id}>
                {columns.map((col) => renderCell(item, col))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Lead Details
                <p className="text-small text-default-500">View and edit lead information</p>
              </ModalHeader>
              <ModalBody>
                {editableLead && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {columns.map((col) => (
                      <Input
                        key={col}
                        label={col.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        labelPlacement="outside"
                        placeholder={`Enter ${col.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                        value={editableLead[col as keyof Lead] ?? ''}
                        onValueChange={(value) => handleInputChange(col, value)}
                        type={typeof editableLead[col as keyof Lead] === 'number' ? 'number' : 'text'} 
                      />
                    ))}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={handleSave}>Save</Button>
                <Button variant="ghost" onPress={onClose}>Cancel</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
