'use client';

import { useState, useTransition } from 'react';

export default function LeadUploader({ onUpload }: { onUpload?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, start] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    start(async () => {
      try {
        const res = await fetch('/api/leads/upload', { method: 'POST', body: formData });
        const result = await res.json();

        if (!res.ok) throw new Error(result.error || 'Upload failed');
        setMessage(`${result.rows ?? result.count} leads imported.`);
        setSelectedFile(null);
        onUpload?.();
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        setMessage(`Upload failed: ${msg}`);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <input
        type="file"
        accept=".csv"
        onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
        required
        className="border p-1"
      />
      <button
        type="submit"
        disabled={!selectedFile || isPending}
        className="px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
      >
        Upload CSV
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </form>
  );
}