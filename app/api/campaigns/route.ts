import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Campaign } from '@/helpers/types';
import { requireSuperAdmin } from '@/lib/api-guard'; // Corrected import path

// Fetch all campaigns
export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, status, total_leads, leads_worked, created_at') // Select fields for listing
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error fetching campaigns:', error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Create a new campaign
export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const body: Partial<Campaign> = await request.json();

    // Basic validation - expand as needed (Zod recommended)
    if (!body.name || !body.email_template_id) {
      return NextResponse.json({ error: 'Missing required fields: name, email_template_id' }, { status: 400 });
    }

    const newCampaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'total_leads' | 'leads_worked'> = {
      name: body.name!,
      description: body.description ?? '',
      status: body.status ?? 'DRAFT',
      email_template_id: body.email_template_id!,
      loi_template_id: body.loi_template_id ?? null,
      leads_per_day: body.leads_per_day ?? 100,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      min_interval_minutes: body.min_interval_minutes ?? 60,
      company_logo_path: body.company_logo_path ?? null,
      email_subject: body.email_subject ?? '',
      email_body: body.email_body ?? '',
    };

    const { data, error: insertError } = await supabase
      .from('campaigns')
      .insert(newCampaignData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating campaign:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error creating campaign:', error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}