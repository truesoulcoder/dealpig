'use client';

import React from 'react';

interface LeadSelectorProps {
  tables: string[];
  selected?: string;
  onSelect: (table: string) => void;
}

export default function LeadSelector({ tables, selected, onSelect }: LeadSelectorProps) {
  if (tables.length === 0) {
    return <p>No lead tables available.</p>;
  }
  return (
    <div>
      <label className="block mb-1 font-medium">Choose leads table:</label>
      <select
        value={selected}
        onChange={e => onSelect(e.target.value)}
        className="border px-2 py-1"
      >
        {tables.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
}