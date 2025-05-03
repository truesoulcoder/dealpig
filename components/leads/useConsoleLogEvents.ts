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
  const data: LogEvent[] = await res.json();
  return data.sort((a, b) => a.timestamp - b.timestamp);
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
          // Use a ref to keep track of the latest messages
          setMessages((prev: LogEvent[]) => {
            if (prev.some((e: LogEvent) => e.timestamp === (payload.new as LogEvent).timestamp)) return prev;
            return [...prev, payload.new as LogEvent];
          });
        }
      })
      .subscribe();

    // Fallback polling every 2s in case real-time fails
    let pollInterval: NodeJS.Timeout | null = setInterval(() => {
      fetchConsoleLogEvents().then(events => { if (mounted) setMessages(events); });
    }, 2000);

    return () => {
      mounted = false;
      channel.unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [setMessages]);
}

