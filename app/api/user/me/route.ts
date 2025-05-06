import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireSuperAdmin } from '@/lib/api-guard'; 

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request); // Add super-admin access check
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from('lead-uploads') // Bucket for lead uploads
      .list()
      .order('created_at', { ascending: false }); // Adjust query as needed, removing any user-specific filters

    if (error) {
      console.error('Error listing leads:', error);
      return NextResponse.json({ error: error.message || 'Failed to list leads' }, { status: 500 });
    }
    return NextResponse.json({ files: data || [] });
  } catch (err: any) {
    console.error('[API /leads/list] unexpected error:', err);
    return NextResponse.json({ files: [], error: err.message || 'Unexpected server error' }, { status: 500 });
  }
}