import { NextRequest, NextResponse } from 'next/server';
import { getImportProgress } from '@/actions/ingestLeads.action';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const importId = searchParams.get('id');
  
  if (!importId) {
    return NextResponse.json(
      { error: 'Missing import ID' },
      { status: 400 }
    );
  }
  
  try {
    const progress = await getImportProgress(importId);
    
    if (!progress) {
      return NextResponse.json(
        { error: 'Import progress not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error fetching import progress:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve import progress' },
      { status: 500 }
    );
  }
}