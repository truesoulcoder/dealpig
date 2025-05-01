'use client';

import React, { useState, useEffect } from 'react';
import { listStorageFiles } from '@/actions/storage.action';
import { FileObject } from '@supabase/storage-js';
import { Spinner } from '@heroui/react'; // Assuming Spinner exists

interface FileExplorerProps {
  // Define props later if needed, e.g., refresh trigger
}

const FileExplorer: React.FC<FileExplorerProps> = (props) => {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedFiles = await listStorageFiles();
        setFiles(fetchedFiles);
      } catch (err: any) {
        console.error('Failed to fetch storage files:', err);
        setError(err.message || 'Failed to load files.');
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
    // Add dependency array if props are added for refresh
  }, []);

  return (
    <div className="border p-4 rounded h-full flex flex-col">
      <h3 className="font-semibold mb-2 flex-shrink-0">Storage Explorer (lead-imports)</h3>
      <div className="flex-grow overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Spinner size="md" />
            <span className="ml-2 text-sm text-gray-500">Loading files...</span>
          </div>
        )}
        {error && <p className="text-sm text-red-600">Error: {error}</p>}
        {!loading && !error && (
          <ul className="space-y-1">
            {files.length === 0 ? (
              <li className="text-sm text-gray-500 italic">No files found in bucket.</li>
            ) : (
              files.map((file) => (
                <li key={file.id || file.name} className="text-sm text-gray-700 p-1 hover:bg-gray-50 rounded">
                  {/* Basic file icon - replace with better icon later if needed */}
                  <span>📄 </span> 
                  {file.name}
                  {/* Optionally display size or date */}
                  {/* <span className="text-xs text-gray-400 ml-2">({(file.metadata?.size / 1024).toFixed(1)} KB)</span> */}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
