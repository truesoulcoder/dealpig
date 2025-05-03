import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '25', 10);
  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);
  if (!table) {
    return NextResponse.json({ error: 'Missing table param' }, { status: 400 });
  }
  // Safety: allow only normalized_ prefix
  if (!/^normalized_[a-z0-9_]+_[0-9]+$/.test(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
  }
  const admin = createAdminClient();
  // Fetch paginated data
  const { data, error, count } = await admin
    .from(table)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data: data || [], total: count ?? 0 });
}