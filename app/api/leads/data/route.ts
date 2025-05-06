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

  const { searchParams } = new URL(req.url);
  const tableName = searchParams.get('table');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const sortBy = searchParams.get('sortBy') || 'id'; // Default sort by 'id' or a common column
  const sortOrder = searchParams.get('sortOrder') || 'asc'; // Default sort order 'asc'

  if (!tableName) {
    return NextResponse.json({ error: 'Missing table name parameter' }, { status: 400 });
  }

  // Validate table name to prevent SQL injection and ensure it's a 'normal_' table
  if (!/^normal_[a-zA-Z0-9_]+$/.test(tableName)) {
    return NextResponse.json({ error: 'Invalid table name format. Must start with "normal_" and contain only alphanumeric characters and underscores.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const offset = (page - 1) * pageSize;

  try {
    // First, get total count
    const { count, error: countError } = await admin
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`Error counting rows for table ${tableName}:`, countError);
      return NextResponse.json({ error: `Failed to count rows: ${countError.message}` }, { status: 500 });
    }

    // Then get paginated data
    const { data, error: dataError } = await admin
      .from(tableName)
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + pageSize - 1);

    if (dataError) {
      console.error(`Error fetching data for table ${tableName}:`, dataError);
      return NextResponse.json({ error: `Failed to fetch data: ${dataError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        pageSize,
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (err: any) {
    console.error(`[API /leads/data] unexpected error for table ${tableName}:`, err);
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
    const { tableName, id, updates } = await req.json();

    if (!tableName || !id || !updates || typeof updates !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid required parameters: tableName, id, or updates (must be an object)' },
        { status: 400 }
      );
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'Updates object cannot be empty.' }, { status: 400 });
    }

    // Validate table name
    if (!/^normal_[a-zA-Z0-9_]+$/.test(tableName)) {
      return NextResponse.json(
        { error: 'Invalid table name format. Must start with "normal_" and contain only alphanumeric characters and underscores.' },
        { status: 400 }
      );
    }

    // Ensure 'id' is not part of the updates object, as it's used for the WHERE clause
    const { id: _, ...updateFields } = updates; // Destructure to exclude id from updates if present

    if (Object.keys(updateFields).length === 0 && !updates.hasOwnProperty('id')) {
        // This case might happen if 'updates' only contained 'id'
        return NextResponse.json({ error: 'No fields to update were provided.' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from(tableName)
      .update(updateFields) // Use updateFields which doesn't have id
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating lead in table ${tableName} with id ${id}:`, error);
      return NextResponse.json({ error: `Failed to update lead: ${error.message}` }, { status: 500 });
    }

    if (!data) {
        return NextResponse.json({ error: `Lead with id ${id} not found in table ${tableName} or no changes made.` }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lead updated successfully', data });
  } catch (err: any) {
    console.error('[API /leads/data POST] unexpected error:', err);
    if (err instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}