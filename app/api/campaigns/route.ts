import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Campaign } from '@/helpers/types';

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
  } catch (err) {
    console.error('Unexpected error fetching campaigns:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Create a new campaign
export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const body: Partial<Campaign> = await request.json();

    // Basic validation - expand as needed (Zod recommended)
    if (!body.name || !body.email_template_id) {
      return NextResponse.json({ error: 'Missing required fields: name, email_template_id' }, { status: 400 });
    }

    // Get user ID for association (assuming user is logged in)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error('Auth error creating campaign:', authError);
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const newCampaignData: Omit<Campaign, 'id' | 'created_at' | 'updated_at' | 'total_leads' | 'leads_worked'> & { user_id: string } = {
      name: body.name,
      description: body.description || null,
      status: body.status || 'DRAFT', // Default status
      email_template_id: body.email_template_id,
      loi_template_id: body.loi_template_id || null,
      leads_per_day: body.leads_per_day || 10,
      start_time: body.start_time || '09:00',
      end_time: body.end_time || '17:00',
      min_interval_minutes: body.min_interval_minutes || 5,
      max_interval_minutes: body.max_interval_minutes || 15,
      attachment_type: body.attachment_type || 'NONE',
      tracking_enabled: body.tracking_enabled ?? false,
      company_logo_path: body.company_logo_path || null,
      email_subject: body.email_subject || null, // Can be overridden from template
      email_body: body.email_body || null, // Can be overridden from template
      user_id: user.id, // Associate with the current user
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

  } catch (err) {
    console.error('Unexpected error creating campaign:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}