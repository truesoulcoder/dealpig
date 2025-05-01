import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table');
  if (!table) {
    return NextResponse.json({ error: 'Missing table param' }, { status: 400 });
  }
  // Safety: allow only normalized_ prefix
  if (!/^normalized_[a-z0-9_]+_[0-9]+$/.test(table)) {
    return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data, error } = await admin.from(table).select('*');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data || []);
}