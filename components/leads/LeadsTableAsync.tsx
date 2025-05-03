import React, { useEffect, useState } from 'react';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Pagination, Spinner } from '@heroui/react';

interface LeadsTableAsyncProps {
  tables: string[];
  selectedTable: string;
  onTableSelect: (table: string) => void;
}

interface PaginatedLeadResult {
  data: any[];
  total: number;
}

const ROWS_OPTIONS = [25, 50, 100];

export default function LeadsTableAsync({ tables, selectedTable, onTableSelect }: LeadsTableAsyncProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    if (selectedTable) {
      setPage(1); // Reset to first page on table change
      fetchLeads(1, rowsPerPage);
    }
    // eslint-disable-next-line
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      fetchLeads(page, rowsPerPage);
    }
    // eslint-disable-next-line
  }, [page, rowsPerPage]);

  async function fetchLeads(pageNum: number, pageSize: number) {
    setLoading(true);
    try {
      const offset = (pageNum - 1) * pageSize;
      const res = await fetch(`/api/leads/data?table=${encodeURIComponent(selectedTable)}&limit=${pageSize}&offset=${offset}`);
      const result: PaginatedLeadResult = await res.json();
      setLeads(result.data || []);
      setTotalRows(result.total || 0);
    } catch (err) {
      setLeads([]);
      setTotalRows(0);
    } finally {
      setLoading(false);
    }
  }

  // Get columns from data
  const columns = leads.length > 0 ? Object.keys(leads[0]) : [];
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  return (
    <div className="w-full">
      <div className="flex gap-4 mb-2">
        <label>
          Table:
          <select value={selectedTable} onChange={e => onTableSelect(e.target.value)} className="ml-2 px-2 py-1 border rounded">
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Rows per page:
          <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))} className="ml-2 px-2 py-1 border rounded">
            {ROWS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
      </div>
      <div className="relative border rounded bg-black/60">
        {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10"><Spinner /></div>}
        <Table>
          <TableHeader>
            {columns.map(col => <TableColumn key={col}>{col.replace(/_/g, ' ')}</TableColumn>)}
          </TableHeader>
          <TableBody>
            {leads.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map(col => <TableCell key={col}>{row[col]}</TableCell>)}
              </TableRow>
            ))}
            {leads.length === 0 && (
              <TableRow><TableCell colSpan={columns.length} className="text-center text-gray-400">No data</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-2">
        <Pagination
          total={totalPages}
          page={page}
          onChange={setPage}
          className=""
        />
        <span className="text-sm text-gray-400">Page {page} of {totalPages} ({totalRows} rows)</span>
      </div>
    </div>
  );
}
