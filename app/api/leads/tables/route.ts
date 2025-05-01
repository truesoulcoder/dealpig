import { NextRequest, NextResponse } from 'next/server';
import { getNormalizedTables } from '@/actions/leads.action';

export async function GET(req: NextRequest) {
  try {
    const tables = await getNormalizedTables();
    return NextResponse.json(tables);
  } catch (error) {
    console.error('Error listing normalized tables:', error);
    return NextResponse.json([], { status: 200 });
  }
}