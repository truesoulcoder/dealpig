import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    
    // Get status filter from query params if available
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Build query
    let query = admin.from('campaigns').select('*');
    
    // Add status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    // Execute query with sorting
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('[API /campaigns] query error:', error);
      return NextResponse.json(
        { message: 'Error fetching campaigns', error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (err) {
    console.error('[API /campaigns] unexpected error:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}