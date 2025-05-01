import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const admin = createAdminClient();
  const bucket = 'lead-uploads';
  const { data, error } = await admin.storage.from(bucket).list('', { limit: 100, sortBy: { column: 'name', order: 'desc' } });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // return list of filenames
    return NextResponse.json(data.map(file => ({ name: file.name, updated_at: file.updated_at })));
  }