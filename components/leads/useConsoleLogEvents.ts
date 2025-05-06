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

    const fetchInitialEvents = async () => {
      if (!supabase) return;

      const query = supabase
        .from('console_log_events')
        .select('type, message, timestamp')
        .order('timestamp', { ascending: false });

      console.log('Supabase query object (useConsoleLogEvents):', query); // DEBUGGING LOG

      query.then(async ({ data, error }) => {
        if (error) {
          console.error(
            'Error fetching initial console events. Message:', (error as any).message, 
            'Details:', (error as any).details, 
            'Hint:', (error as any).hint, 
            'Code:', (error as any).code, 
            'Full Error Object:', error
          );
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
    };

    fetchInitialEvents();

    const subscription = supabase
      ?.channel('console-log-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'console_log_events' }, ({ new: payload }) => {
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
