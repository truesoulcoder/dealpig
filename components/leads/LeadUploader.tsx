'use client';

import { useState, useTransition, useRef, useEffect } from 'react';

interface LeadUploaderProps {
  onUpload?: () => void;
  addMessage?: (type: 'info' | 'error' | 'success', message: string) => void;
}

export default function LeadUploader({ onUpload, addMessage }: LeadUploaderProps) {
  // Polling for console log events every 2 seconds during upload
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const [externalSetMessages, setExternalSetMessages] = useState<((msgs: string[]) => void) | null>(null);

  // Helper to start polling
  function startConsoleLogPolling(setMessages: (msgs: string[]) => void) {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      const events = await fetch('/api/leads/events').then(res => res.json());
      setMessages(events.events?.map((e: any) => e.message) || []);
    }, 2000);
    setExternalSetMessages(() => setMessages);
  }

  // Helper to stop polling
  function stopConsoleLogPolling() {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = null;
    setExternalSetMessages(null);
  }

  useEffect(() => () => stopConsoleLogPolling(), []); // Clean up on unmount

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [isPending, start] = useTransition();
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const failureAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio elements on client only
  useEffect(() => {
    try {
      successAudioRef.current = new Audio('/success.mp3');
      failureAudioRef.current = new Audio('/failed.mp3');
      
      // Preload audio files
      successAudioRef.current.load();
      failureAudioRef.current.load();
    } catch (err) {
      console.warn('Audio initialization error:', err);
    }
  }, []);

  // Helper to add a progress message
  function addProgress(msg: string) {
    setProgressMessages(prev => [...prev, msg]);
  }

  // Poll API for UI refresh after audio
  async function pollAndRefresh() {
    const pollInterval = 1000; // ms
    const maxAttempts = 10;
    let attempts = 0;
    let refreshed = false;
    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Optionally, you could fetch a specific endpoint or just call onUpload
        await new Promise(res => setTimeout(res, pollInterval));
        if (onUpload) {
          onUpload(); // This will refresh tables and logs in LeadsPage
          refreshed = true;
        }
        // Optionally, add a check here to break early if data is ready
      } catch (err) {
        // Ignore polling errors
      }
    }
    if (!refreshed && onUpload) onUpload();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setProgressMessages([`Uploading file: ${selectedFile.name}`]);
    setMessage(null);
    if (addMessage) addMessage('info', `Started upload: ${selectedFile.name}`);
    startConsoleLogPolling(setProgressMessages); // Start polling during upload

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
        stopConsoleLogPolling(); // Stop polling after upload
        if (addMessage) addMessage('success', `✅ Success: ${result.rows ?? result.count} leads imported.`);
        onUpload?.(); // One-time UI refresh
        // Play success sound, then poll API for UI refresh
        if (successAudioRef.current) {
          try {
            await successAudioRef.current.play();
          } catch (err) {
            console.warn('Success audio error:', err);
          }
        }
        // Poll API after audio finishes
        await pollAndRefresh();
      } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : String(err);
        setMessage(`Upload failed: ${msg}`);
        addProgress(`❌ Upload failed: ${msg}`);
        stopConsoleLogPolling(); // Stop polling after upload
        if (addMessage) addMessage('error', `❌ Upload failed: ${msg}`);
        // Play failure sound, then poll API for UI refresh
        if (failureAudioRef.current) {
          try {
            await failureAudioRef.current.play();
          } catch (err) {
            console.warn('Failure audio error:', err);
          }
        }
        // Poll API after audio finishes
        await pollAndRefresh();
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

    </>
  );
}