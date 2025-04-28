'use client';

// Switch to fetch-based upload against API route
import { Button } from '@heroui/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

export default function UploadLeadsForm() {
  const { theme } = useTheme();
  const isLeetTheme = theme === 'leet';
  
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
    setShowConsole(true); // show log console during upload
    const formEl = e.currentTarget; // capture form element for reset
    setLoading(true);
    setMessage(null);
    setProgress(0);
    setLogs([]);
    setIsError(false);
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;
    addLog(`> Starting upload: ${file.name}`);

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
      if (status !== 200) {
        setIsError(true);
        setUploadStatus('error');
        
        // Log the actual response content for debugging
        addLog(`> Server response: ${xhr.responseText.substring(0, 100)}...`);
        
        // Check if response is HTML instead of JSON
        if (xhr.responseText.trim().startsWith('<!DOCTYPE') || 
            xhr.responseText.trim().startsWith('<html')) {
          addLog('> Server returned HTML instead of JSON (possible server error)');
          setMessage('Server error occurred. Please try again later.');
        } else {
          // Try to parse JSON error message
          let errMsg = `Error ${status}`;
          try {
            const errJson = JSON.parse(xhr.responseText);
            if (errJson.message) errMsg = errJson.message;
          } catch (e) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            addLog(`> Failed to parse error response: ${errorMessage}`);
          }
          addLog(`> Server error: ${errMsg}`);
          setMessage(errMsg);
        }
        setLoading(false);
        return;
      }
      
      // Refresh explorer after upload success
      fetchFiles();
      
      // Try parsing JSON response
      let result: any;
      try {
        // Check if response might be HTML before trying to parse
        if (xhr.responseText.trim().startsWith('<!DOCTYPE') || 
            xhr.responseText.trim().startsWith('<html')) {
          addLog('> Warning: Server returned HTML instead of JSON');
          setIsError(true);
          setUploadStatus('error');
          setMessage('Server returned invalid response format. Please contact support.');
          setLoading(false);
          return;
        }
        
        result = JSON.parse(xhr.responseText);
      } catch (e) {
        // No valid JSON, but since status is 200 assume success
        const errorMessage = e instanceof Error ? e.message : String(e);
        addLog(`> JSON parse error: ${errorMessage}`);
        addLog('> Response starts with: ' + xhr.responseText.substring(0, 50) + '...');
        addLog('> No valid JSON response; upload assumed successful');
        setIsError(false);
        setUploadStatus('success');
        setMessage('Leads file uploaded successfully.');
        formEl.reset();
        fetchFiles();
        setLoading(false);
        // Hide console and clear selected file name on success
        setShowConsole(false);
        setSelectedFileName('No file chosen');
        return;
      }
      
      // If JSON parsed
      if (result.success) {
        setIsError(false);
        setUploadStatus('success');
        addLog('> Server response: Success');
        setMessage('Leads file uploaded successfully.');
        formEl.reset();
        fetchFiles();
        // Hide console and clear selected file name on success
        setShowConsole(false);
        setSelectedFileName('No file chosen');
      } else {
        setIsError(true);
        setUploadStatus('error');
        const errMsg = xhr.status === 409 ? 'This file has already been uploaded.' : result.message || 'Upload failed.';
        addLog(`> Server error: ${errMsg}`);
        setMessage(errMsg);
      }
      setLoading(false);
    };
    xhr.onerror = () => {
      setIsError(true);
      addLog('> Network error during upload');
      setMessage('Network error during upload.');
      setLoading(false);
    };
    xhr.send(formData);
  };

  // Determine logs to display: show all on error, last 5 lines on success
  const displayLogs = isError ? logs : logs.slice(-5);

  // Use leet theme classes when the theme is active
  const leetConsoleClass = isLeetTheme ? 'leet-console' : '';
  const leetButtonClass = isLeetTheme ? 'leet-btn' : '';
  const leetLabelClass = isLeetTheme ? 'leet-label' : '';

  return (
    <div className="w-full mx-auto px-4 flex flex-col gap-4">
      {/* Explorer: hierarchical file/folder tree */}
      <div className={`w-full bg-black text-green-400 font-mono p-4 rounded overflow-x-auto whitespace-pre ${isLeetTheme ? 'leet-console' : ''}`}>
        <div>lead-imports/</div>
        {loadingFiles ? (
          <div className="italic text-gray-500">Loading...</div>
        ) : files.length === 0 ? (
          <div className="italic text-gray-500">No files in bucket</div>
        ) : (
          renderTree(fileTree)
        )}
      </div>
      {/* Upload form and logs */}
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} encType="multipart/form-data" className="flex flex-col gap-4">
          <div className="flex items-center gap-4 min-w-0 w-full">
            <label
              htmlFor="fileInput"
              className={`inline-flex items-center justify-center flex-shrink-0 ${
                isLeetTheme 
                  ? 'leet-btn' 
                  : 'text-green-400 font-mono text-lg border border-green-400 rounded-none h-10 px-4 py-2'
              }`}>
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
            <span className={`flex-1 ${isLeetTheme ? 'text-green-400 font-mono' : 'text-gray-400 font-mono'} text-lg truncate`}>
              {selectedFileName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="flat"
              size="md"
              disabled={loading}
              className={isLeetTheme 
                ? 'leet-btn h-10' 
                : 'font-mono text-lg border border-green-400 text-green-400 bg-transparent hover:bg-green-400 hover:text-black rounded-none flex-shrink-0 h-10 !px-4 !py-2'
              }
            >
              [UPLOAD]
            </Button>
            {/* External spinner icon when loading */}
            {loading && (
              <span className={`ml-2 font-mono text-lg ${isLeetTheme ? 'text-green-400' : 'text-green-400'}`}>⏳</span>
            )}
            {/* Success icon and message */}
            {!loading && message && !isError && (
              <span className="flex items-center ml-2">
                <span className={isLeetTheme ? 'leet-status-success' : 'text-green-400 font-mono text-lg'}>✓</span>
                <span className={isLeetTheme ? 'leet-status-success ml-1' : 'text-green-400 font-mono text-lg ml-1 whitespace-nowrap'}>{message}</span>
              </span>
            )}
            {/* Error toggle icon */}
            {!loading && isError && (
              <span
                onClick={() => setShowConsole((v) => !v)}
                className={`ml-2 cursor-pointer ${isLeetTheme ? 'leet-status-error' : 'text-red-500 font-mono text-lg'} flex-shrink-0 whitespace-nowrap`}
              >{showConsole ? '[x]' : '[!] '}</span>
            )}
          </div>
        </form>
        {/* Log console, animated fade-in items */}
        {showConsole && (
        <div className={`bg-black text-green-400 font-mono p-4 rounded max-h-40 overflow-auto whitespace-pre ${isLeetTheme ? 'leet-console' : ''}`}>
          {displayLogs.map((line, idx) => (
            <div key={idx} className="transition-opacity duration-500" style={{ animation: 'fadeIn 1s ease-out' }}>
              {line}
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}