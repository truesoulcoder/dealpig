'use client';

import React, { useState } from 'react';
import { Button } from '@heroui/react'; // Assuming Button is from here or adjust import
import { v4 as uuidv4 } from 'uuid';
import supabase from '@/lib/supabase/client'; // Use client instance
import { ingestLeadSource, normalizeLeadsForSource } from '@/actions/leadIngestion.action'; // Import Plan A actions
import toast from 'react-hot-toast';

interface UploadFormProps {
  onUploadComplete: (sourceId: string) => void; // Callback after successful upload and initial registration
}

const UploadForm: React.FC<UploadFormProps> = ({ onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState('No file chosen');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showFullLogs, setShowFullLogs] = useState(false);

  const addLog = (message: string) => {
    console.log(message); // Also log to browser console
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedFileName(file.name);
      setLogs([]); // Clear logs on new file selection
      setProgress(0);
    } else {
      setSelectedFile(null);
      setSelectedFileName('No file chosen');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setProgress(0);
    setLogs([]);
    const sourceId = uuidv4();
    const storagePath = `lead-imports/${sourceId}_${selectedFile.name}`;

    try {
      addLog(`Starting upload for ${selectedFile.name}...`);
      addLog(`Generated Source ID: ${sourceId}`);
      addLog(`Storage Path: ${storagePath}`);

      // 1. Upload to Supabase Storage
      addLog('Uploading file to storage...');
      const { error: uploadError } = await supabase.storage
        .from('lead-imports') // Bucket name
        .upload(storagePath.replace('lead-imports/', ''), selectedFile, { // Remove bucket prefix for upload path
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files with the same name
        });

      if (uploadError) {
        throw new Error(`Storage Upload Error: ${uploadError.message}`);
      }
      setProgress(33);
      addLog('File uploaded successfully.');

      // 2. Register Lead Source (Simplified - directly calling action, assuming Plan A handles DB entry)
      // Note: Plan A's ingestLeadSource *updates* the record, it doesn't create it initially.
      // We need an initial creation step here.
      addLog('Registering lead source in database...');
      const createdAt = new Date().toISOString();
      const sourceName = `${sourceId}_${selectedFile.name}`;
      const { error: dbError } = await supabase
        .from('lead_sources')
        .insert({
          id: sourceId,
          name: sourceName,
          file_name: selectedFile.name,
          storage_path: storagePath,
          record_count: 0, // Initial count
          is_active: true,
          last_imported: createdAt,
          created_at: createdAt,
          updated_at: createdAt,
          metadata: null // Metadata added by ingest step
        });

      if (dbError) {
        // Attempt to clean up storage if DB insert fails
        addLog(`Database registration failed: ${dbError.message}. Cleaning up storage...`);
        await supabase.storage.from('lead-imports').remove([storagePath.replace('lead-imports/', '')]);
        throw new Error(`Database Registration Error: ${dbError.message}`);
      }
      addLog(`Lead source ${sourceId} registered.`);
      onUploadComplete(sourceId); // Notify parent about the new source
      setProgress(50);

      // 3. Trigger Ingestion (Plan A)
      addLog(`Starting ingestion process for source ${sourceId}...`);
      // We call the server action directly
      const ingestResult = await ingestLeadSource(sourceId);
      // Assuming ingestLeadSource throws on error or returns specific structure
      addLog(`Ingestion complete. Raw rows processed: ${ingestResult.count}`);
      setProgress(75);

      // 4. Trigger Normalization (Plan A)
      addLog(`Starting normalization process for source ${sourceId}...`);
      const normalizeResult = await normalizeLeadsForSource(sourceId);
      // Assuming normalizeLeadsForSource throws on error or returns { success: boolean, inserted: number }
      if (!normalizeResult.success) {
         throw new Error('Normalization failed. Check server logs.');
      }
      addLog(`Normalization complete. Leads created: ${normalizeResult.inserted}`);
      setProgress(100);
      toast.success(`Successfully processed ${selectedFile.name}`);

    } catch (error: any) {
      addLog(`ERROR: ${error.message}`);
      toast.error(`Processing failed: ${error.message}`);
      setProgress(0); // Reset progress on error
    } finally {
      setLoading(false);
    }
  };

  const displayedLogs = showFullLogs ? logs : logs.slice(-5);

  return (
    <div className="border p-4 rounded space-y-4">
      <h3 className="font-semibold">Upload & Process Leads</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="lead-file-input"
            className="cursor-pointer px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200 text-sm"
          >
            Choose CSV File
          </label>
          <input
            id="lead-file-input"
            type="file"
            accept=".csv"
            required
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="text-sm text-gray-600 truncate flex-1" title={selectedFileName}>{selectedFileName}</span>
        </div>

        <Button
          type="submit"
          color="primary"
          disabled={loading || !selectedFile}
          isLoading={loading}
        >
          Upload & Process
        </Button>
      </form>

      {/* Progress Bar */}
      {loading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Log Console */}
      {logs.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Processing Logs</h4>
            {logs.length > 5 && (
              <Button size="sm" variant="ghost" onClick={() => setShowFullLogs(!showFullLogs)}>
                {showFullLogs ? 'Show Less' : 'Show All'}
              </Button>
            )}
          </div>
          <div className="bg-gray-900 text-green-400 font-mono text-xs p-3 rounded max-h-60 overflow-y-auto">
            {displayedLogs.map((log, index) => (
              <p key={index}>{log}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
