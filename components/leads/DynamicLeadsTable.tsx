'use client';

import React, { useState, useMemo } from 'react';
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
} from '@heroui/react';
import LeadModal from './LeadModal';

interface DynamicLeadsTableProps {
  table: string;
  leads: any[];
  onEdit: (lead: any) => void;
  onRefresh: () => void;
  onSave: () => void;
}

const PAGE_SIZE = 25;

export default function DynamicLeadsTable({ table, leads, onEdit, onRefresh, onSave }: DynamicLeadsTableProps) {
  const [page, setPage] = useState(1);
  const [selectedKey, setSelectedKey] = useState<string | number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editedLeads, setEditedLeads] = useState<any[]>([]);

  const hasLeads = leads && leads.length > 0;
  let columns: string[] = [];
  if (hasLeads) {
    columns = Object.keys(leads[0]);
  } else {
    columns = ['id', 'first_name', 'last_name', 'email', 'phone'];
  }

  // Always show 25 rows
  const displayRows = hasLeads ? leads.slice(0, 25) : Array(25).fill(null);

  return (
    <div style={{ border: '2px solid #0f0', borderRadius: 8, padding: 0, background: 'rgba(0,0,0,0.7)' }}>
      <table className="min-w-full table-auto border-collapse border bg-black text-green-400">
        <thead>
          <tr className="bg-green-900">
            {columns.map((col) => (
              <th key={col} className="px-4 py-2 border border-green-700 text-green-300 font-bold uppercase text-xs">{col.replace(/_/g, ' ')}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, idx) => (
            <tr key={idx} className={row ? "hover:bg-green-950" : "bg-black/60"}>
              {columns.map((col, cidx) => (
                <td key={cidx} className="px-4 py-2 border border-green-800 text-green-200">
                  {row ? (row[col] ?? '—') : <span style={{ opacity: 0.4 }}>—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}