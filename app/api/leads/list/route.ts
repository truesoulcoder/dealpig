import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from('lead-imports')
      .list('', { limit: 100, sortBy: { column: 'updated_at', order: 'desc' } });
    if (error) {
      console.error('[API /leads/list] storage list error:', error);
      return NextResponse.json({ files: [], error: error.message }, { status: 500 });
    }
    return NextResponse.json({ files: data });
  } catch (err) {
    console.error('[API /leads/list] unexpected error:', err);
    return NextResponse.json({ files: [], error: 'Unexpected server error' }, { status: 500 });
  }
}