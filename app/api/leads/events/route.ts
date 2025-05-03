import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase/client';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    // Use the imported supabase client (with RLS applied)
    
    // Define interfaces for our data types
    interface ProcessingStatus {
      id: number;
      file: string;
      status: string;
      completed_at: string | null;
      normalized_at: string | null;
      user_id: string | null;
    }
    
    interface ConsoleLogEvent {
      id: string;
      type: 'info' | 'error' | 'success';
      message: string;
      timestamp: number;
      user_id: string | null;
    }
    
    // Fetch the user's processing status events
    const { data, error } = await supabase
      .from('processing_status')
      .select('*')
      .order('completed_at', { ascending: false, nullsFirst: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching processing status:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Also fetch console log events for this user
    const { data: logEvents, error: logError } = await supabase
      .from('console_log_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);
    
    if (logError) {
      console.error('Error fetching console log events:', logError);
      // Continue with just the processing status data
    }
    
    // Combine and format the events for the UI
    const combinedEvents = [
      ...((data as ProcessingStatus[] || []).map(item => ({
        id: item.id,
        type: item.status === 'completed' ? 'success' : item.status === 'error' ? 'error' : 'info',
        message: `File: ${item.file} - Status: ${item.status}`,
        timestamp: item.completed_at || new Date().toISOString(),
        source: 'processing_status'
      }))),
      ...((logEvents as ConsoleLogEvent[] || []).map(item => ({
        id: item.id,
        type: item.type,
        message: item.message,
        timestamp: new Date(item.timestamp).toISOString(),
        source: 'console_log'
      })))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return NextResponse.json({ events: combinedEvents });
  } catch (error: any) {
    console.error('Unexpected error fetching events:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
