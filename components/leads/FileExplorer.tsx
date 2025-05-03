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
    fetch('/api/leads/files?bucket=lead-uploads') // <-- bucket name for lead uploads
      .then(res => {
        if (!res.ok) throw new Error('Failed to load files');
        return res.json();
      })
      .then(data => setFiles(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ border: '2px solid #0f0', borderRadius: 8, padding: 12, background: 'rgba(0,0,0,0.7)', marginBottom: 16 }}>
      <h2 style={{ color: '#0f0', fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>Uploaded Files (lead-uploads bucket)</h2>
      {loading && <p>Loading files…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {!loading && !error && files.length === 0 && <p className="text-gray-500 italic">No uploaded files.</p>}
      {!loading && !error && files.length > 0 && (
        <ul className="list-disc list-inside">
          {files.map(f => (
            <li key={f.name} className="flex justify-between">
              <span>{f.name}</span>
              <span className="text-sm text-gray-500">{new Date(f.updated_at).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}