import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { requireSuperAdmin } from '@/lib/api-guard';

export async function GET(req: NextRequest) {
  try {
    await requireSuperAdmin(req);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    const sb = createAdminClient();
    const sql = `
      SELECT json_agg(table_name) AS tables
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE 'normal_%'
    `;
    const { data, error } = await sb.rpc('run_sql', { sql });
    if (error) {
      console.error('[API /leads/tables] run_sql error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    let tables: string[] = [];
    const raw = (data as any)[0]?.tables;
    if (Array.isArray(raw)) {
      tables = raw;
    } else if (typeof raw === 'string') {
      try {
        tables = JSON.parse(raw);
      } catch {
        tables = [];
      }
    }
    tables.sort();
    return NextResponse.json({ tables });
  } catch (err: any) {
    console.error('[API /leads/tables] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}