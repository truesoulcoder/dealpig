import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireSuperAdmin } from '@/lib/api-guard';

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
    await requireSuperAdmin(req);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ success: false, message: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }
  try {
    // Always clear normalized_leads and leads BEFORE processing new data
    const sb = createAdminClient();
    await postLogEvent('info', 'Clearing normalized_leads and leads tables BEFORE normalization...');
    // Clear tables before normalization (use DELETE FROM to respect foreign keys)
    const { error: clearNormError } = await sb.rpc('run_sql', { sql: 'DELETE FROM public.normalized_leads; DELETE FROM public.leads;' });
    if (clearNormError) {
      await postLogEvent('error', `Error clearing tables before normalization: ${clearNormError.message}`);
      // Not fatal, continue
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
