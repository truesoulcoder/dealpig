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

// Real-time log events using Supabase subscription
export function useRealtimeConsoleLogEvents(setMessages: (msgs: LogEvent[]) => void) {
  const supabaseRef = useRef<any>(null);
  useEffect(() => {
    const supabase = createClientComponentClient();
    supabaseRef.current = supabase;
    let mounted = true;

    // Initial fetch
    fetchConsoleLogEvents().then(events => { if (mounted) setMessages(events); });

    // Subscribe to new log events
    const channel = supabase.channel('console_log_events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'console_log_events' }, payload => {
        if (!mounted) return;
        if (payload.new) {
          // Use functional state update to add the new event
          const newEvent = payload.new as LogEvent;
          fetchConsoleLogEvents().then(latestEvents => {
            // Only update if the event isn't already in our list
            if (!latestEvents.some(e => e.timestamp === newEvent.timestamp)) {
              setMessages([...latestEvents, newEvent]);
            } else {
              setMessages(latestEvents);
            }
          });
        }
      })
      .subscribe();

    // Fallback polling every 2s in case real-time fails
    let pollInterval: NodeJS.Timeout | null = setInterval(() => {
      fetchConsoleLogEvents().then(events => { 
        if (mounted) setMessages(events); 
      });
    }, 2000);

    return () => {
      mounted = false;
      channel.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [setMessages]);
}

