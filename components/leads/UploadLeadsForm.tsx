'use client';

import { Button } from '@heroui/react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import supabase from '@/lib/supabase/client'; // Import the singleton client
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

// Define props interface
interface UploadLeadsFormProps {
  onUploadSuccess?: () => void; // Optional callback prop
}

export default function UploadLeadsForm({ onUploadSuccess }: UploadLeadsFormProps) { // Destructure the prop
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
      setIsError(true);
      setLoading(false);
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setIsError(true);
      setMessage('Only CSV files are supported');
      addLog('Error: Only CSV files are supported.');
      setLoading(false);
      return;
    }

    const fileName = file.name;
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    addLog(`Starting upload of ${fileName} (${fileSizeMB}MB)...`);
    setProgress(10);

    // Generate a unique path/name for the file in storage
    const uniqueId = uuidv4();
    const storagePath = `lead-imports/${uniqueId}`; // Use UUID as the object name

    try {
      addLog(`Uploading file directly to Supabase Storage at: ${storagePath}`);
      setProgress(20);

      // Use Supabase client to upload directly
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('lead-imports')
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
          contentType: 'text/csv'
        });

      setProgress(70);

      if (uploadError) {
        console.error('Supabase upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('Storage upload failed: No path returned from Supabase.');
      }
      
      addLog(`File successfully uploaded to storage: ${uploadData.path}`);
      addLog('Registering lead source with backend...');
      setProgress(80);

      // Call the new backend endpoint to create the lead_sources record
      const registerResponse = await fetch('/api/leads/register-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          storagePath: uploadData.path, // Pass the actual path returned by storage
          originalFileName: fileName,
          sourceId: uniqueId // Pass the generated UUID
        }),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok || !registerResult.success) {
        addLog(`Error registering source: ${registerResult.message || 'Unknown error'}. Attempting to remove uploaded file...`);
        await supabase.storage.from('lead-imports').remove([storagePath]);
        addLog('Uploaded file removed due to registration error.');
        throw new Error(registerResult.message || 'Failed to register lead source after upload.');
      }

      setMessage(registerResult.message || 'Leads file uploaded and registered successfully.');
      addLog('Lead source registered successfully.');
      setProgress(100);
      form.reset();
      setSelectedFileName('No file chosen');

      fetchFiles();
      if (typeof onUploadSuccess === 'function') {
        onUploadSuccess();
      }

    } catch (err) {
      console.error('Upload process error:', err);
      setIsError(true);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during upload.';
      setMessage(errorMessage);
      addLog(`Error: ${errorMessage}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

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
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              {loading ? `UPLOADING... ${progress}%` : 'UPLOAD'}
            </Button>
          </form>

          {(logs.length > 0 || message) && (
            <div className={`p-4 rounded border ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-700 border-gray-200'} font-mono text-xs space-y-1 max-h-40 overflow-y-auto`}>
              {message && <p className={`font-bold ${isError ? 'text-red-800' : 'text-green-800'}`}>{message}</p>}
              {logs.map((log, index) => (
                <p key={index}>{log}</p>
              ))}
              <div ref={logEndRef} />
            </div>
          )}

          {loading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}