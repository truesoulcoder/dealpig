'use client';

import { useState } from 'react';

export default function LeadUploader({ onUpload }: { onUpload?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const res = await fetch('/api/leads/upload', { method: 'POST', body: formData });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');
      setMessage(`${result.count} leads imported.`);
      onUpload?.();
    } catch (error: unknown) {
      console.error(error);
      const msg = error instanceof Error ? error.message : String(error);
      setMessage(`Upload failed: ${msg}`);
    }
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
        disabled={!selectedFile}
        className="px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
      >
        Upload CSV
      </button>
      {message && <p className="mt-2 text-sm text-gray-700">{message}</p>}
    </form>
  );
}