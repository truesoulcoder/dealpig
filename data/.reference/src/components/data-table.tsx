import React from 'react';
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Input,
  Pagination,
  Spinner
} from '@heroui/react';
import { Icon } from '@iconify/react';

interface DataTableProps {
  data: any[];
  headers: string[];
  fileName: string | null;
}

export const DataTable: React.FC<DataTableProps> = ({ data, headers, fileName }) => {
  const [page, setPage] = React.useState(1);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortDescriptor, setSortDescriptor] = React.useState<{
    column: string | null;
    direction: 'ascending' | 'descending' | null;
  }>({
    column: null,
    direction: null,
  });
  
  // Filter data based on search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    return data.filter(row => {
      return Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery]);
  
  // Sort data based on sort descriptor
  const sortedData = React.useMemo(() => {
    if (!sortDescriptor.column || !sortDescriptor.direction) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortDescriptor.column!];
      const bValue = b[sortDescriptor.column!];
      
      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDescriptor.direction === 'ascending' ? aValue - bValue : bValue - aValue;
      }
      
      // Default string comparison
      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();
      
      if (sortDescriptor.direction === 'ascending') {
        return aString.localeCompare(bString);
      } else {
        return bString.localeCompare(aString);
      }
    });
  }, [filteredData, sortDescriptor]);
  
  // Paginate data
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, page, rowsPerPage]);
  
  // Total pages
  const totalPages = React.useMemo(() => {
    return Math.ceil(sortedData.length / rowsPerPage);
  }, [sortedData, rowsPerPage]);
  
  // Handle sort change
  const handleSortChange = (column: string) => {
    if (sortDescriptor.column === column) {
      // Toggle direction or reset
      if (sortDescriptor.direction === 'ascending') {
        setSortDescriptor({ column, direction: 'descending' });
      } else if (sortDescriptor.direction === 'descending') {
        setSortDescriptor({ column: null, direction: null });
      } else {
        setSortDescriptor({ column, direction: 'ascending' });
      }
    } else {
      // New column, start with ascending
      setSortDescriptor({ column, direction: 'ascending' });
    }
  };
  
  // Reset pagination when data changes
  React.useEffect(() => {
    setPage(1);
  }, [data]);
  
  if (!fileName) {
    return (
      <div className="text-center p-8">
        <Icon icon="lucide:file-question" className="w-16 h-16 mx-auto text-gray-400" />
        <p className="mt-4 text-gray-500">Select a CSV file from the explorer to view its data</p>
      </div>
    );
  }
  
  if (data.length === 0 || headers.length === 0) {
    return (
      <div className="text-center p-8">
        <Spinner size="lg" />
        <p className="mt-4">Loading data...</p>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {fileName} <span className="text-sm text-gray-500">({data.length} rows)</span>
        </h2>
        <Input
          placeholder="Search..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          startContent={<Icon icon="lucide:search" />}
          className="w-64"
          clearable
        />
      </div>
      
      <div className="overflow-x-auto">
        <Table 
          aria-label="CSV data table"
          bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="primary"
                page={page}
                total={totalPages}
                onChange={setPage}
              />
            </div>
          }
        >
          <TableHeader>
            {headers.map((header) => (
              <TableColumn 
                key={header}
                className="cursor-pointer"
                onClick={() => handleSortChange(header)}
              >
                <div className="flex items-center gap-1">
                  {header}
                  {sortDescriptor.column === header && (
                    <Icon 
                      icon={sortDescriptor.direction === 'ascending' ? 'lucide:arrow-up' : 'lucide:arrow-down'} 
                      className="text-primary-500"
                    />
                  )}
                </div>
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody emptyContent="No data available">
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header) => (
                  <TableCell key={`${rowIndex}-${header}`}>
                    {row[header] !== undefined ? String(row[header]) : ''}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};