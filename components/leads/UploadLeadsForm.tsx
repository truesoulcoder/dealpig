'use client';

import { FormEvent, useState } from 'react';
import { uploadLeads } from '@/actions/leads.action';

export default function UploadLeadsForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await uploadLeads(formData);
    if (result.success) {
      setMessage('Leads file uploaded successfully.');
      e.currentTarget.reset();
    } else {
      setMessage(result.message || 'Upload failed.');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col gap-4">
      <input
        type="file"
        name="file"
        accept=".csv"
        required
        className="p-2 border border-gray-300 rounded"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Upload Leads'}
      </button>
      {message && (
        <p className="text-sm text-gray-700">{message}</p>
      )}
    </form>
  );
}