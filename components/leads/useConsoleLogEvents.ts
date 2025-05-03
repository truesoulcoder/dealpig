import { useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface LogEvent {
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: number;
}

// Fetches log events from API once
export async function fetchConsoleLogEvents(): Promise<LogEvent[]> {
  const res = await fetch('/api/leads/events');
  const response = await res.json();
  // Check if the response has an events property (our API returns {events: [...]})
  const events: LogEvent[] = response.events || [];
  return events.sort((a, b) => {
    // Handle both string timestamps and numeric timestamps
    const timeA = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : a.timestamp;
    const timeB = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : b.timestamp;
    return timeB - timeA; // Sort newest first
  });
}


