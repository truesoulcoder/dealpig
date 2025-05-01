'use client';

import { useState, useEffect } from 'react';

interface DynamicLeadsTableProps {
  table: string;
}

export default function DynamicLeadsTable({ table }: DynamicLeadsTableProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/leads/data?table=${encodeURIComponent(table)}`)
      .then(async res => {
        if (!res.ok) throw new Error((await res.json()).error || 'Failed to load');
        return res.json();
      })
      .then(data => setRows(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [table]);

  if (loading) return <p>Loading {table} …</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (rows.length === 0) return <p>No leads in {table}.</p>;

  // derive columns from first row
  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            {columns.map(col => (
              <th key={col} className="px-2 py-1 border text-left">
                {col.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-gray-50">
              {columns.map(col => (
                <td key={col} className="px-2 py-1 border">
                  {row[col] as string}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}