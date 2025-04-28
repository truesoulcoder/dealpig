'use client';

// Switch to fetch-based upload against API route
import { FormEvent, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function UploadLeadsForm() {
  // Explorer state
  const [files, setFiles] = useState<Array<{ name: string; updated_at?: string }>>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    const { data, error } = await supabase.storage.from('lead-imports').list('', { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } });
    if (!error && data) {
      setFiles(data);
    }
    setLoadingFiles(false);
  };

  // load initial file list
  useEffect(() => { fetchFiles(); }, []);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const addLog = (line: string) => setLogs((prev) => [...prev, line]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setProgress(0);
    setLogs([]);
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    addLog(`> Starting upload: ${file.name}`);

    // Use XMLHttpRequest to capture upload progress
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/leads');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
        addLog(`> Upload progress: ${percent}%`);
      }
    };
    xhr.onload = () => {
      const status = xhr.status;
      addLog(`> Upload complete with status ${status}`);
      try {
        const result = JSON.parse(xhr.responseText);
        if (status === 200 && result.success) {
          addLog('> Server response: Success');
          setMessage('Leads file uploaded successfully.');
          e.currentTarget.reset();
          // refresh file explorer
          fetchFiles();
        } else if (status === 409) {
          addLog('> Server response: Duplicate file');
          setMessage('This file has already been uploaded.');
        } else {
          addLog(`> Server error: ${result.message || xhr.statusText}`);
          setMessage(result.message || 'Upload failed.');
        }
      } catch {
        setMessage('Invalid server response.');
      }
      setLoading(false);
    };
    xhr.onerror = () => {
      addLog('> Network error during upload');
      setMessage('Network error during upload.');
      setLoading(false);
    };
    xhr.send(formData);
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
      <div className="flex items-center gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? `Uploading... (${progress}%)` : 'Upload Leads'}
        </button>
        {loading && (
          <div className="flex-1 bg-gray-200 rounded h-2 relative">
            <div
              className="bg-blue-600 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      {message && (
        <p className="text-sm text-gray-700 font-medium">{message}</p>
      )}
      <div
        className="bg-black text-green-400 font-mono p-2 rounded h-40 overflow-y-auto whitespace-pre"
        ref={logEndRef}
      >
        {logs.join('\n')}
      </div>
      {/* Explorer */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Bucket Contents</h2>
        {loadingFiles ? (
          <p className="text-sm text-gray-500">Loading files...</p>
        ) : (
          <ul className="list-disc pl-5 max-h-40 overflow-y-auto text-sm text-gray-700">
            {files.map((f) => (
              <li key={f.name}>
                {f.name} {f.updated_at && <span className="text-xs text-gray-400">({new Date(f.updated_at).toLocaleString()})</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}