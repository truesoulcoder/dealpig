import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ProcessingStatus {
  id: number;
  file: string;
  status: string;
  completed_at: string | null;
  normalized_at: string | null;
}

export default function ProcessingStatusTable() {
  const [statuses, setStatuses] = useState<ProcessingStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClientComponentClient();
    setLoading(true);
    supabase
      .from("processing_status")
      .select("id, file, status, completed_at, normalized_at")
      .order("completed_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setStatuses(data || []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading processing statuses...</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (statuses.length === 0) return <p>No processing statuses found.</p>;

  return (
    <div className="overflow-x-auto mt-4">
      <table className="min-w-full table-auto border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">File</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Completed At</th>
            <th className="px-4 py-2 border">Normalized At</th>
          </tr>
        </thead>
        <tbody>
          {statuses.map((s) => (
            <tr key={s.id} className="odd:bg-white even:bg-gray-50">
              <td className="px-4 py-2 border">{s.file}</td>
              <td className="px-4 py-2 border">{s.status}</td>
              <td className="px-4 py-2 border">{s.completed_at ? new Date(s.completed_at).toLocaleString() : "-"}</td>
              <td className="px-4 py-2 border">{s.normalized_at ? new Date(s.normalized_at).toLocaleString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
