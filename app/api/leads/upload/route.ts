import { NextRequest, NextResponse } from 'next/server';
import { uploadLeads } from '@/actions/leadUpload.action';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const result = await uploadLeads(formData);
  return NextResponse.json(result);
}