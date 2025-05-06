'use client';

import { useState, useTransition, useRef, useEffect } from 'react';

// Define the expected response structure from the upload API
interface UploadResponse {
  ok: boolean;
  error?: string;
  message?: string; // Optional success message from API
}

interface LeadUploaderProps {
  onUploadSuccess?: (filename: string) => void; // Callback with filename on successful upload
  addMessage?: (type: 'info' | 'error' | 'success', message: string) => void; // Callback to send messages to parent
  isProcessing?: boolean; // To disable uploader during parent's processing (e.g., normalization)
}

export default function LeadUploader({ onUploadSuccess, addMessage, isProcessing }: LeadUploaderProps) {
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
          const successMsg = result.message || 'Upload successful!';
          setMessage(successMsg); // Show API message or default
          if (addMessage) addMessage('success', successMsg); // Call parent's addMessage
          if (onUploadSuccess && selectedFile) onUploadSuccess(selectedFile.name); // Call with filename
          // Play success sound
          if (successAudioRef.current) {
            try {
              await successAudioRef.current.play();
            } catch (err) {
              console.warn('Success audio error:', err);
            }
          }
        } else {
          const errorMsg = result.error || 'Unknown upload error';
          const fullErrorMsg = `Upload failed: ${errorMsg}`;
          setMessage(fullErrorMsg);
          if (addMessage) addMessage('error', fullErrorMsg); // Call parent's addMessage
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
        const errorMsg = err instanceof Error ? err.message : String(err);
        const fullErrorMsg = `Upload failed: ${errorMsg}`;
        setMessage(fullErrorMsg);
        if (addMessage) addMessage('error', fullErrorMsg); // Call parent's addMessage
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
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isPending || isProcessing} // Disable if uploading or parent is processing
        />
        <button 
          type="submit" 
          disabled={!selectedFile || isPending || isProcessing} // Disable if no file, uploading, or parent is processing
          className="w-full px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Uploading...' : 'Upload Leads CSV'}
        </button>
        {/* Display local message state */}
        {message && (
          <p className={`mt-2 text-sm ${message.startsWith('Upload failed') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </form>
    </>
  );
}