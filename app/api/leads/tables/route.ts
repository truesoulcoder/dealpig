import { NextRequest, NextResponse } from 'next/server';
import { getNormalizedTables } from '@/actions/leads.action';

export async function GET(req: NextRequest) {
  const tables = await getNormalizedTables();
  return NextResponse.json(tables);
}