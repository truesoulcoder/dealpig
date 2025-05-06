import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireSuperAdmin } from '@/lib/api-guard';

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const admin = createAdminClient();
  const bucket = 'lead-uploads';
  try {
    const { data, error } = await admin.storage.from(bucket).list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    // return list of filenames
    return NextResponse.json(data.map(file => ({ name: file.name, updated_at: file.updated_at })));
  } catch (err: any) {
    console.error('[API /leads/files] unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected server error' }, { status: 500 });
  }
}