import { NextRequest, NextResponse } from 'next/server';
import { getNormalizedTables } from '@/actions/leads.action';
import { requireSuperAdmin } from '@/lib/api-guard';

export async function GET(req: NextRequest) {
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
    const tables = await getNormalizedTables();
    return NextResponse.json(tables);
  } catch (error: any) {
    console.error('Error listing normalized tables:', error);
    return NextResponse.json([], { status: 200 });  // Consider handling errors with a 500 status in future if needed
  }
}