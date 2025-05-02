'use client';

import React from 'react';
import { NormalizedLead } from '@/helpers/types';

interface LeadsTableProps {
  leads: NormalizedLead[];
}

export default function LeadsTable({ leads }: LeadsTableProps) {
  if (!leads || leads.length === 0) {
    return <p>No leads found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            {/* Reverted to more user-friendly headers */}
            <th className="px-4 py-2 border">Contact Name</th>
            <th className="px-4 py-2 border">Contact Email</th>
            <th className="px-4 py-2 border">Property Address</th>
            <th className="px-4 py-2 border">City</th>
            <th className="px-4 py-2 border">State</th>
            <th className="px-4 py-2 border">Postal Code</th>
            <th className="px-4 py-2 border">Beds</th>
            <th className="px-4 py-2 border">Baths</th>
            <th className="px-4 py-2 border">MLS Status</th>
            <th className="px-4 py-2 border">Days on Market</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.original_lead_id || lead.contact_email}>
              {/* Data bindings remain correct for NormalizedLead */}
              <td className="px-4 py-2 border">{lead.contact_name}</td>
              <td className="px-4 py-2 border">{lead.contact_email}</td>
              <td className="px-4 py-2 border">{lead.property_address}</td>
              <td className="px-4 py-2 border">{lead.property_city}</td>
              <td className="px-4 py-2 border">{lead.property_state}</td>
              <td className="px-4 py-2 border">{lead.property_postal_code}</td>
              <td className="px-4 py-2 border">{lead.beds}</td>
              <td className="px-4 py-2 border">{lead.baths}</td>
              <td className="px-4 py-2 border">{lead.mls_curr_status}</td>
              <td className="px-4 py-2 border">{lead.mls_curr_days_on_market}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}