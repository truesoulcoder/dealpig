import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

// Helper to post log events directly to Supabase for realtime UI Console Log
async function postLogEvent(type: 'info' | 'error' | 'success', message: string) {
  try {
    const sb = createAdminClient();
    await sb.from('console_log_events').insert({
      type,
      message,
      timestamp: new Date().getTime(),
    });
  } catch (err: any) {
    console.error('Error posting log event:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Always clear normalized_leads and leads BEFORE processing new data
    const sb = createAdminClient();
    await postLogEvent('info', 'Clearing normalized_leads and leads tables BEFORE normalization...');
    
    // Clear normalized_leads table
    const { error: clearNormalizedError } = await sb.rpc('run_sql', { sql: 'DELETE FROM public.normalized_leads;' });
    if (clearNormalizedError) {
      await postLogEvent('error', `Error clearing normalized_leads table: ${clearNormalizedError.message}`);
      // Not necessarily fatal, but log it. Depending on dependencies, this might need to be fatal.
    }

    // Clear leads table (if normalized_leads has FK to leads, this order is important, otherwise order doesn't matter as much)
    // Assuming normalized_leads might depend on leads, or vice-versa, or they are independent.
    // If there's a FK from leads to normalized_leads, this delete might fail if not cleared first.
    // For now, let's assume they can be cleared independently or normalized_leads is cleared first.
    const { error: clearLeadsError } = await sb.rpc('run_sql', { sql: 'DELETE FROM public.leads;' });
    if (clearLeadsError) {
      await postLogEvent('error', `Error clearing leads table: ${clearLeadsError.message}`);
      // Not necessarily fatal, but log it.
    }

    const { sourceFilename } = await req.json();
    
    if (!sourceFilename) {
      return NextResponse.json({ 
        success: false, 
        message: 'Source filename is required'
      }, { status: 400 });
    }

    // Log the start of the normalization process
    await postLogEvent('info', `Starting lead normalization for ${sourceFilename}`);
    
    // Step 1: Run the normalization function
    await postLogEvent('info', 'Running normalization function...');
    const { error: normError } = await sb.rpc('normalize_staged_leads');
    
    if (normError) {
      await postLogEvent('error', `Normalization error: ${normError.message}`);
      return NextResponse.json({ 
        success: false, 
        message: `Normalization failed: ${normError.message}`
      }, { status: 500 });
    }
    
    // Step 2: Count the normalized leads to report success
    const { data: countData, error: countError } = await sb
      .from('normalized_leads')
      .select('id', { count: 'exact', head: true });
    
    if (countError) {
      await postLogEvent('error', `Error counting normalized leads: ${countError.message}`);
      return NextResponse.json({ 
        success: false, 
        message: `Error counting normalized leads: ${countError.message}`
      }, { status: 500 });
    }
    
    const normalizedCount = countData?.length ?? 0;
    await postLogEvent('success', `Successfully normalized ${normalizedCount} leads from ${sourceFilename}`);
    
    // Step 3: Archive the normalized leads and reset the system
    await postLogEvent('info', 'Archiving normalized leads...');
    const { error: archiveError } = await sb.rpc('archive_normalized_leads', { 
      source_filename: sourceFilename 
    });
    
    if (archiveError) {
      await postLogEvent('error', `Archiving error: ${archiveError.message}`);
      return NextResponse.json({ 
        success: false, 
        message: `Archiving failed: ${archiveError.message}`
      }, { status: 500 });
    }
    
    await postLogEvent('success', 'Lead normalization and archiving completed successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully normalized and archived ${normalizedCount} leads from ${sourceFilename}`,
      count: normalizedCount
    });
  } catch (error: any) {
    console.error('Unexpected error during normalization:', error);
    await postLogEvent('error', `Unexpected error: ${error.message || 'Unknown error'}`);
    
    return NextResponse.json({ 
      success: false, 
      message: 'Unexpected error during normalization',
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
