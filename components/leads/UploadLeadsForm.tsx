'use client';

// Switch to fetch-based upload against API route
import { Button } from '@heroui/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export default function UploadLeadsForm() {
  const { theme } = useTheme();
  const isLeetTheme = theme === 'leet';
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  // Track selected file name for display
  const [selectedFileName, setSelectedFileName] = useState<string>('No file chosen');
  // Explorer state using Supabase client
  const [files, setFiles] = useState<Array<{ name: string }>>([]);
  // State to track last submission error vs success
  const [isError, setIsError] = useState(false);
  // Toggle and status for showing full console
  const [uploadStatus, setUploadStatus] = useState<'idle'|'success'|'error'>('idle');
  const [showConsole, setShowConsole] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);
  const addLog = (line: string) => setLogs((prev) => [...prev, line]);
  const fetchFiles = async () => {
    setLoadingFiles(true);
    console.log('[UploadLeadsForm] fetching bucket list');
    try {
      const res = await fetch('/api/leads/list');
      console.log('[UploadLeadsForm] list API status:', res.status, res.statusText);
      if (!res.ok) {
        console.error('[UploadLeadsForm] list API HTTP error', res.status);
        setLoadingFiles(false);
        return;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.error('[UploadLeadsForm] list API returned non-JSON:', contentType);
        setLoadingFiles(false);
        return;
      }
      const json = await res.json();
      console.log('[UploadLeadsForm] list API JSON:', json);
      if (Array.isArray(json.files)) {
        setFiles(json.files);
      } else {
        console.error('[UploadLeadsForm] invalid files data:', json.files);
      }
    } catch (err) {
      console.error('[UploadLeadsForm] fetch list error:', err);
    }
    setLoadingFiles(false);
  };
  // load initial file list
  useEffect(() => { fetchFiles(); }, []);

  // Utility: build nested tree from file paths
  const buildTree = (paths: string[]) => {
    type Node = { name: string; children?: Node[] };
    const rootMap = new Map<string, Node>();
    for (const path of paths) {
      const parts = path.split('/');
      let map = rootMap;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLeaf = i === parts.length - 1;
        if (!map.has(part)) {
          map.set(part, { name: part, children: [] });
        }
        const node = map.get(part)!;
        if (isLeaf) break;
        map = new Map(node.children!.map((n) => [n.name, n]));
      }
    }
    return Array.from(rootMap.values());
  };
  // Convert files list to tree structure
  const fileTree = useMemo(() => buildTree(files.map((f) => f.name)), [files]);

  // Render tree recursively with ASCII prefixes
  const renderTree = (nodes: any[], prefix = '') =>
    nodes.map((node, idx) => {
      const isLast = idx === nodes.length - 1;
      const branch = isLast ? '└── ' : '├── ';
      // strip UUID prefix (part before first underscore)
      const rawName = node.name.includes('_') ? node.name.substring(node.name.indexOf('_') + 1) : node.name;
      // Rename placeholder file for display
      const displayName = rawName === '.emptyFolderPlaceholder' ? '.superSecretFolder' : rawName;
      const line = prefix + branch + displayName + (node.children && node.children.length ? '/' : '');
      return (
        <div key={prefix + node.name}>
          {line}
          {node.children && node.children.length
            ? renderTree(node.children, prefix + (isLast ? '    ' : '│   '))
            : null}
        </div>
      );
    });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage(null);
    setIsError(false);
    setLogs([]); // Clear previous logs
    setProgress(0);

    const form = e.currentTarget as HTMLFormElement;
    const fileInput = form.querySelector('input[type=file]') as HTMLInputElement;
    const file = fileInput.files?.[0];
    
    if (!file) {
      setMessage('No file selected');
      setLoading(false);
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setIsError(true);
      setMessage('Only CSV files are supported');
      setLoading(false);
      return;
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setIsError(true);
      setMessage('File is too large. Maximum size is 50MB');
      addLog(`Error: File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds limit of 50MB`);
      setLoading(false);
      return;
    }

    addLog(`Starting upload of ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)...`);
    setProgress(10);

    try {
      // Send file directly to our API which will handle upload and ingestion
      const payload = new FormData();
      payload.append('file', file);
      
      addLog('Uploading file to server...');
      setProgress(20);
      
      const res = await fetch('/api/leads', {
        method: 'POST',
        body: payload,
        headers: {
          // Don't set Content-Type header - let the browser set it with the boundary
        }
      });
      
      setProgress(40);
      addLog('Processing file...');
      
      let result: any;
      try {
        const contentType = res.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          throw new Error(`Invalid content type: ${contentType}`);
        }
        result = await res.json();
      } catch (err) {
        console.error('Response parsing error:', err);
        setIsError(true);
        setMessage('Server response was not valid JSON');
        addLog(`Error: Invalid server response - ${err instanceof Error ? err.message : 'Unknown error'}`);
        setLoading(false);
        return;
      }

      setProgress(60);
      
      if (!res.ok || !result.success) {
        setIsError(true);
        setMessage(result.message || 'Failed to upload leads file.');
        addLog(`Error: ${result.message || 'Failed to upload leads file.'}`);
      } else {
        setMessage(result.message || 'Leads file uploaded successfully.');
        addLog('File uploaded successfully');
        addLog(`Processed ${result.count || 0} leads`);
        setProgress(100);
        form.reset();
        setSelectedFileName('No file chosen');
        fetchFiles();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setIsError(true);
      setMessage('Network error occurred');
      addLog(`Error: Network error during upload - ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Determine logs to display: show all on error, last 5 lines on success
  const displayLogs = isError ? logs : logs.slice(-5);

  // Compute CSS classes for theme styles after client mount
  const baseExplorerClass = 'bg-black text-green-400 font-mono p-4 rounded overflow-x-auto whitespace-pre h-[400px] overflow-y-auto';
  const explorerClass = mounted && isLeetTheme ? `${baseExplorerClass} leet-console border border-green-400` : baseExplorerClass;
  const labelClass = mounted && isLeetTheme
    ? 'inline-flex items-center justify-center flex-shrink-0 leet-btn'
    : 'inline-flex items-center justify-center flex-shrink-0 text-green-400 font-mono text-lg border border-green-400 rounded-none h-10 px-4 py-2';
  const fileNameClass = `flex-1 ${mounted && isLeetTheme ? 'text-green-400 font-mono' : 'text-gray-400 font-mono'} text-lg truncate`;
  const uploadButtonClass = `w-full ${mounted && isLeetTheme ? 'leet-btn' : ''}`;

  return (
    <div className="w-full mx-auto px-4">
      <div className="grid grid-cols-3 gap-4">
        {/* Explorer: hierarchical file/folder tree */}
        <div className={explorerClass}>
          <div className="font-bold mb-2">lead-imports/</div>
          {loadingFiles ? (
            <div className="italic text-gray-500">Loading...</div>
          ) : files.length === 0 ? (
            <div className="italic text-gray-500">No files in bucket</div>
          ) : (
            renderTree(fileTree)
          )}
        </div>

        {/* Upload form */}
        <div className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col gap-4">
            <div className="flex items-center gap-4 min-w-0 w-full">
              <label htmlFor="fileInput" className={labelClass}>
                [CHOOSE]
              </label>
              <input
                id="fileInput"
                type="file"
                name="file"
                accept=".csv"
                required
                className="hidden"
                onChange={(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  setSelectedFileName(file?.name || 'No file chosen');
                }}
              />
              <span className={fileNameClass}>
                {selectedFileName}
              </span>
            </div>

            <Button type="submit" disabled={loading} className={uploadButtonClass}>
              {loading ? 'UPLOADING...' : 'UPLOAD'}
            </Button>
          </form>

          {message && (
            <div className={`p-4 rounded ${
              isError 
                ? 'bg-red-100 text-red-700 border border-red-300' 
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}