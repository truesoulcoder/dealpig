'use client';

import { useState, useEffect } from 'react';

interface FileInfo {
  name: string;
  updated_at: string;
}

export default function FileExplorer() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/leads/files')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load files');
        return res.json();
      })
      .then(data => setFiles(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading files…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (files.length === 0) return <p>No uploaded files.</p>;

  return (
    <div>
      <h2 className="font-medium mb-2">Uploaded Files</h2>
      <ul className="list-disc list-inside">
        {files.map(f => (
          <li key={f.name} className="flex justify-between">
            <span>{f.name}</span>
            <span className="text-sm text-gray-500">{new Date(f.updated_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}