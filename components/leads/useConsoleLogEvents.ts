import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase/client';

interface LogEvent {
  type: 'info' | 'error' | 'success';
  message: string;
  timestamp: number;
}

export function useConsoleLogEvents(): LogEvent[] {
  const [events, setEvents] = useState<LogEvent[]>([]);
  useEffect(() => {
    let cancelled = false;
    // Initial load ordered by newest first
    supabase
      .from('processing_status')
      .select('*')
      .order('timestamp', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data && !cancelled) setEvents(data as LogEvent[]);
      });
    // Subscribe to real-time inserts
    const subscription = supabase
      .channel('public:processing_status')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'processing_status' }, ({ new: payload }) => {
        setEvents(prev => [payload as LogEvent, ...prev]);
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, []);
  return events;
}
