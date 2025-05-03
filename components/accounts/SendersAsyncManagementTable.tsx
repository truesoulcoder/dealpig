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
import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function SendersAsyncManagementTable() {
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(25);
  const [selectedSender, setSelectedSender] = React.useState(null);
  const [editableSender, setEditableSender] = React.useState(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "email",
    direction: "ascending",
  });

  const { data, isLoading } = useSWR(`/api/senders?page=${page}&limit=${rowsPerPage}`, fetcher, {
    keepPreviousData: true,
  });

  const pages = React.useMemo(() => {
    return data?.total ? Math.ceil(data.total / rowsPerPage) : 0;
  }, [data?.total, rowsPerPage]);

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

  const handleRowClick = (sender) => {
    setSelectedSender(sender);
    setEditableSender({ ...sender });
    onOpen();
  };

  const handleInputChange = (key, value) => {
    setEditableSender((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    setSelectedSender({ ...editableSender });
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
            <select
              className="bg-transparent text-small outline-none"
              onChange={onRowsPerPageChange}
              defaultValue={rowsPerPage}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <span className="text-small text-default-400">
            {data ? `Total ${data.total} senders` : "Loading..."}
          </span>
        </div>

        <Table
          aria-label="Senders Management Table"
          selectionMode="single"
          onRowAction={(key) => {
            const sender = data?.data.find((item) => item.id === key);
            handleRowClick(sender);
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
                Sender Details
                <p className="text-small text-default-500">View and edit sender information</p>
              </ModalHeader>
              <ModalBody>
                {editableSender && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {columns.map((col) => (
                      <Input
                        key={col}
                        label={col.replace(/_/g, " ")}
                        labelPlacement="outside"
                        placeholder={col.replace(/_/g, " ")}
                        value={editableSender[col] ?? ''}
                        onValueChange={(value) => handleInputChange(col, value)}
                        startContent={<Icon icon="lucide:user" className="text-default-400" />}
                        description={`Sender's ${col.replace(/_/g, " ")}`}
                      />
                    ))}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onClick={handleSave}>Save</Button>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
