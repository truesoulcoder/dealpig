import { NextRequest, NextResponse } from 'next/server';
import { uploadLeads } from '@/actions/leadUpload.action';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const result = await uploadLeads(formData);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in uploadLeads route:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}