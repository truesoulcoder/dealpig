import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Campaign } from '@/helpers/types';
import { requireSuperAdmin } from '@/lib/api-guard';

interface Params {
  id: string;
}

// Fetch a single campaign by ID
export async function GET(req: NextRequest, { params }: { params: Params }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  try {
    await requireSuperAdmin(req);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      console.error(`Error fetching campaign ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Unexpected error fetching campaign ${id}:`, error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update a campaign
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  try {
    await requireSuperAdmin(req);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }
  try {
    const body: Partial<Campaign> = await req.json();
    const updateData: Partial<Campaign> = {};
    const allowedUpdateFields: (keyof Campaign)[] = ['name', 'description', 'status', 'email_template_id', 'loi_template_id', 'leads_per_day', 'start_time', 'end_time', 'min_interval_minutes', 'max_interval_minutes', 'attachment_type', 'tracking_enabled', 'company_logo_path', 'email_subject', 'email_body'];
    const allowedUpdateFieldsSet = new Set(allowedUpdateFields);
    for (const key in body) {
      if (Object.prototype.hasOwnProperty.call(body, key) && allowedUpdateFieldsSet.has(key as keyof Campaign)) {
        const campaignKey = key as keyof Campaign;
        if (body[campaignKey] !== undefined && body[campaignKey] !== null) {
          updateData[campaignKey] = body[campaignKey] as any;  // Type assertion to any to resolve assignment error
        }
      }
    }
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }
    updateData.updated_at = new Date().toISOString();
    const { data, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      console.error(`Error updating campaign ${id}:`, updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: 'Campaign not found or update failed unexpectedly' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Unexpected error updating campaign ${id}:`, error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete a campaign
export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  try {
    await requireSuperAdmin(req);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }
  try {
    const { error: deleteError, count } = await supabase
      .from('campaigns')
      .delete({ count: 'exact' })
      .eq('id', id);
    if (deleteError) {
      console.error(`Error deleting campaign ${id}:`, deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    if (count === 0) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error: any) {
    console.error(`Unexpected error deleting campaign ${id}:`, error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
