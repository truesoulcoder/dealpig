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

export default function App() {
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [selectedPerson, setSelectedPerson] = React.useState(null);
  const [editablePerson, setEditablePerson] = React.useState(null);
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "name",
    direction: "ascending",
  });

  const {data, isLoading} = useSWR(`https://swapi.py4e.com/api/people?page=${page}`, fetcher, {
    keepPreviousData: true,
  });

  const pages = React.useMemo(() => {
    return data?.count ? Math.ceil(data.count / rowsPerPage) : 0;
  }, [data?.count, rowsPerPage]);

  React.useEffect(() => {
    setPage(1);
  }, [rowsPerPage]);

  // Sort function for client-side sorting
  const sortedItems = React.useMemo(() => {
    if (!data?.results) return [];
    
    return [...data.results].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      
      // Handle numeric values for height and mass
      if (sortDescriptor.column === "height" || sortDescriptor.column === "mass") {
        const numA = Number(first) || 0;
        const numB = Number(second) || 0;
        
        return sortDescriptor.direction === "ascending" ? numA - numB : numB - numA;
      }
      
      // Handle string values
      const cmp = first.localeCompare(second);
      
      return sortDescriptor.direction === "ascending" ? cmp : -cmp;
    });
  }, [data?.results, sortDescriptor]);

  const loadingState = isLoading || data?.results.length === 0 ? "loading" : "idle";

  const handleRowClick = (person) => {
    setSelectedPerson(person);
    setEditablePerson({...person}); // Create a copy for editing
    onOpen();
  };

  const handleInputChange = (key, value) => {
    setEditablePerson(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    setSelectedPerson({...editablePerson});
    // Here you would typically make an API call to update the data
    console.log("Saving updated data:", editablePerson);
    onClose();
  };

  const renderCell = React.useCallback((item, columnKey) => {
    const cellValue = getKeyValue(item, columnKey);
    
    return (
      <TableCell>{cellValue}</TableCell>
    );
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
            {data ? `Total ${data.count} leads` : "Loading..."}
          </span>
        </div>

        <Table
          aria-label="Example table with client async pagination and sorting"
          selectionMode="single"
          onRowAction={(key) => {
            const person = data?.results.find(item => item.name === key);
            handleRowClick(person);
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
            <TableColumn key="name" allowsSorting>Name</TableColumn>
            <TableColumn key="height" allowsSorting>Height</TableColumn>
            <TableColumn key="mass" allowsSorting>Mass</TableColumn>
            <TableColumn key="birth_year" allowsSorting>Birth year</TableColumn>
          </TableHeader>
          <TableBody
            items={sortedItems}
            loadingContent={<Spinner />}
            loadingState={loadingState}
          >
            {(item) => (
              <TableRow key={item?.name}>
                {(columnKey) => renderCell(item, columnKey)}
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
                {editablePerson && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      labelPlacement="outside"
                      placeholder="Name"
                      value={editablePerson.name}
                      onValueChange={(value) => handleInputChange("name", value)}
                      startContent={<Icon icon="lucide:user" className="text-default-400" />}
                      description="Lead's full name"
                    />
                    <Input
                      label="Height"
                      labelPlacement="outside"
                      placeholder="Height"
                      value={editablePerson.height}
                      onValueChange={(value) => handleInputChange("height", value)}
                      startContent={<Icon icon="lucide:ruler" className="text-default-400" />}
                      description="Lead's height value"
                    />
                    <Input
                      label="Mass"
                      labelPlacement="outside"
                      placeholder="Mass"
                      value={editablePerson.mass}
                      onValueChange={(value) => handleInputChange("mass", value)}
                      startContent={<Icon icon="lucide:weight" className="text-default-400" />}
                      description="Lead's mass value"
                    />
                    <Input
                      label="Birth Year"
                      labelPlacement="outside"
                      placeholder="Birth Year"
                      value={editablePerson.birth_year}
                      onValueChange={(value) => handleInputChange("birth_year", value)}
                      startContent={<Icon icon="lucide:calendar" className="text-default-400" />}
                      description="Lead's birth year"
                    />
                    <Input
                      label="Gender"
                      labelPlacement="outside"
                      placeholder="Gender"
                      value={editablePerson.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                      startContent={<Icon icon="lucide:user" className="text-default-400" />}
                      description="Lead's gender"
                    />
                    <Input
                      label="Eye Color"
                      labelPlacement="outside"
                      placeholder="Eye Color"
                      value={editablePerson.eye_color}
                      onValueChange={(value) => handleInputChange("eye_color", value)}
                      startContent={<Icon icon="lucide:eye" className="text-default-400" />}
                      description="Lead's eye color"
                    />
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleSave}>
                  Save Changes
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}