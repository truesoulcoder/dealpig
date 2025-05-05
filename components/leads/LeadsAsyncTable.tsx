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

const fetcher = (...args) => fetch(...args).then((res) => res.json());

interface LeadsAsyncTableProps {
  table: string;
}

export default function LeadsAsyncTable({ table }: LeadsAsyncTableProps) {
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [selectedLead, setSelectedLead] = React.useState<Record<string, any> | null>(null);
  const [editableLead, setEditableLead] = React.useState<Record<string, any>>({});
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "name",
    direction: "ascending",
  });

  // Fetch only when a table is selected
  const { data, isLoading } = useSWR(
    table ? `/api/leads/data?table=${encodeURIComponent(table)}&page=${page}&limit=${rowsPerPage}` : null,
    fetcher,
    { keepPreviousData: true }
  );

  const pages = React.useMemo(() => data?.total ? Math.ceil(data.total / rowsPerPage) : 0, [data?.total, rowsPerPage]);

  React.useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  // Use data columns if available
  const columns = React.useMemo(() => {
    if (data?.data && data.data.length > 0) return Object.keys(data.data[0]);
    return [];
  }, [data?.data]);

  const sortedItems = React.useMemo(() => {
    if (!data?.data) return [];
    return data.data;
  }, [data?.data]);

  const loadingState = isLoading || !data?.data || data.data.length === 0 ? "loading" : "idle";

  const handleRowClick = (lead) => {
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
    setSelectedLead({ ...editableLead });
    // API call to update the data would go here
    onClose();
  };

  const renderCell = React.useCallback((item, columnKey) => {
    const cellValue = getKeyValue(item, columnKey);
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
            {data ? `Total ${data.total} leads` : "Loading..."}
          </span>
        </div>

        <Table
          aria-label="Uploaded Leads Table"
          selectionMode="single"
          onRowAction={(key) => {
            const lead = data?.data.find((item) => item.id === key);
            handleRowClick(lead);
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
              <TableColumn key={col}>{col.replace(/_/g, " ")}</TableColumn>
            ))}
          </TableHeader>
          <TableBody
            items={sortedItems}
            loadingContent={<Spinner />}
            loadingState={loadingState}
          >
            {(item) => (
              <TableRow key={item?.id}>
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
                        label={col.replace(/_/g, " ")}
                        labelPlacement="outside"
                        placeholder={col.replace(/_/g, " ")}
                        value={editableLead[col] ?? ''}
                        onValueChange={(value) => handleInputChange(col, value)}
                        startContent={<Icon icon="lucide:user" className="text-default-400" />}
                        description={`Lead's ${col.replace(/_/g, " ")}`}
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
