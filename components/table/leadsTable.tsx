import { fetchLeads } from '@/actions/auth.action';
import { Lead } from '@/helpers/types';
import { useEffect, useState } from 'react';

export default function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeads() {
      try {
        const data = await fetchLeads();
        setLeads(data);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    }

    loadLeads();
  }, []);

  if (loading) {
    return <p>Loading leads...</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Address</th>
            <th className="px-4 py-2 border">City</th>
            <th className="px-4 py-2 border">State</th>
            <th className="px-4 py-2 border">Zip</th>
            <th className="px-4 py-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td className="px-4 py-2 border">{lead.property_address}</td>
              <td className="px-4 py-2 border">{lead.property_city}</td>
              <td className="px-4 py-2 border">{lead.property_state}</td>
              <td className="px-4 py-2 border">{lead.property_zip}</td>
              <td className="px-4 py-2 border">{lead.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}