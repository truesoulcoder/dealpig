'use client';

import React from 'react';
import { Lead } from '@/helpers/types';

interface LeadsTableProps {
  leads: Lead[];
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  if (leads.length === 0) {
    return <p>No leads found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Owner Name</th>
            <th className="px-4 py-2 border">Owner Email</th>
            <th className="px-4 py-2 border">Property Address</th>
            <th className="px-4 py-2 border">City</th>
            <th className="px-4 py-2 border">State</th>
            <th className="px-4 py-2 border">Zip</th>
            <th className="px-4 py-2 border">Beds</th>
            <th className="px-4 py-2 border">Baths</th>
            <th className="px-4 py-2 border">Days on Market</th>
            <th className="px-4 py-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="px-4 py-2 border">{lead.owner_name}</td>
              <td className="px-4 py-2 border">{lead.owner_email}</td>
              <td className="px-4 py-2 border">{lead.property_address}</td>
              <td className="px-4 py-2 border">{lead.property_city}</td>
              <td className="px-4 py-2 border">{lead.property_state}</td>
              <td className="px-4 py-2 border">{lead.property_zip}</td>
              <td className="px-4 py-2 border">{lead.beds}</td>
              <td className="px-4 py-2 border">{lead.baths}</td>
              <td className="px-4 py-2 border">{lead.days_on_market}</td>
              <td className="px-4 py-2 border">{lead.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}