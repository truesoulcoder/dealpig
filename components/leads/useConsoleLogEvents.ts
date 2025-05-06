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
      .select('type, message, timestamp')
      .order('timestamp', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching initial console events:', error);
        } else if (data && !cancelled) {
          // Validate data structure slightly before setting state
          const validData = data.filter(item => 
            typeof item.type === 'string' && 
            typeof item.message === 'string' && 
            typeof item.timestamp === 'number'
          ) as LogEvent[];
          setEvents(validData);
        }
      });
    // Subscribe to real-time inserts
    const subscription = supabase
      .channel('public:processing_status')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'processing_status' }, ({ new: payload }) => {
        // Validate payload before adding
        if (payload && 
            typeof payload.type === 'string' && 
            typeof payload.message === 'string' && 
            typeof payload.timestamp === 'number') {
          setEvents(prev => [payload as LogEvent, ...prev]);
        } else {
          console.warn('Received invalid payload from subscription:', payload);
        }
      })
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(subscription);
    };
  }, []);
  return events;
}
