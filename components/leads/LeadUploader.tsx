'use client';

import { useState, useTransition } from 'react';

export default function LeadUploader({ onUpload }: { onUpload?: () => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [isPending, start] = useTransition();

  // Helper to add a progress message
  function addProgress(msg: string) {
    setProgressMessages(prev => [...prev, msg]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setProgressMessages([`Uploading file: ${selectedFile.name}`]);
    setMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    start(async () => {
      try {
        addProgress('Uploading to server...');
        const res = await fetch('/api/leads/upload', { method: 'POST', body: formData });
        addProgress('Waiting for server response...');
        const result = await res.json();

        if (!res.ok) {
          addProgress(`❌ Error: ${result.error || 'Upload failed'}`);
          throw new Error(result.error || 'Upload failed');
        }
        // If backend sends step details, show them
        if (result.steps && Array.isArray(result.steps)) {
          result.steps.forEach((step: string) => addProgress(step));
        }
        addProgress(`✅ Success: ${result.rows ?? result.count} leads imported.`);
        setMessage(`${result.rows ?? result.count} leads imported.`);
        setSelectedFile(null);
        onUpload?.();
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        setMessage(`Upload failed: ${msg}`);
        addProgress(`❌ Upload failed: ${msg}`);
      }
    });
  }

  return (
    <>
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
      {isPending && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div style={{ color: '#0f0', fontSize: 24, textAlign: 'center', maxWidth: 420 }}>
            <svg style={{margin: '0 auto 16px auto', display:'block'}} width="48" height="48" viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" stroke="#0f0" strokeWidth="5" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
            <div style={{textAlign:'left', margin:'0 auto', fontSize:18, background:'rgba(0,0,0,0.6)', borderRadius:8, padding:'16px 20px', marginTop:8, maxHeight:260, overflowY:'auto'}}>
              {progressMessages.length > 0 ? (
                progressMessages.map((msg, idx) => (
                  <div key={idx} style={{marginBottom:4, wordBreak:'break-word'}}>{msg}</div>
                ))
              ) : (
                <div>Processing your upload…</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}