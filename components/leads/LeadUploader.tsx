'use client';

import { useState, useTransition, useRef, useEffect } from 'react';

// Define the expected response structure from the upload API
interface UploadResponse {
  ok: boolean;
  error?: string;
  message?: string; // Optional success message from API
}

interface LeadUploaderProps {
  onUpload?: () => void; // Callback to refresh parent data
}

export default function LeadUploader({ onUpload }: LeadUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;

    setMessage(`Uploading file: ${selectedFile.name}...`); // Use local message state

    const formData = new FormData();
    formData.append('file', selectedFile);

    start(async () => {
      try {
        const res = await fetch('/api/leads/upload', { method: 'POST', body: formData });
        const result: UploadResponse = await res.json(); // Type the result

        if (result.ok) {
          setMessage(result.message || 'Upload successful!'); // Show API message or default
          if (onUpload) onUpload(); // Trigger parent refresh
          // Play success sound
          if (successAudioRef.current) {
            try {
              await successAudioRef.current.play();
            } catch (err) {
              console.warn('Success audio error:', err);
            }
          }
        } else {
          const msg = result.error || 'Unknown upload error';
          setMessage(`Upload failed: ${msg}`);
          // Play failure sound
          if (failureAudioRef.current) {
            try {
              await failureAudioRef.current.play();
            } catch (err) {
              console.warn('Failure audio error:', err);
            }
          }
        }
      } catch (err) {
        console.error('Upload fetch error:', err);
        const msg = err instanceof Error ? err.message : String(err);
        setMessage(`Upload failed: ${msg}`);
        // Play failure sound
        if (failureAudioRef.current) {
          try {
            await failureAudioRef.current.play();
          } catch (err) {
            console.warn('Failure audio error:', err);
          }
        }
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
        {/* Display local message state */}
        {message && 
          <p className={`mt-2 text-sm ${message.startsWith('Upload failed:') ? 'text-danger-500' : 'text-gray-700'}`}>
            {message}
          </p>}
      </form>
    </>
  );
}