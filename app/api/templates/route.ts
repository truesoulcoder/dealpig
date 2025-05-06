import { createServerClient } from '@/lib/supabase/server';
import { Template } from '@/helpers/types';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireSuperAdmin } from '@/lib/api-guard'; // Corrected import path

export async function GET(request: NextRequest) {
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
    const { data: templates, error } = await supabase
      .from('templates')
      .select('id, name, type, subject') // Select relevant columns for listing
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(templates || []);
  } catch (err: any) {
    console.error('Unexpected error fetching templates:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
    const body = await request.json();

    // Basic validation (add more robust validation as needed, e.g., using Zod)
    if (!body.name || !body.type || !body.body) {
      return NextResponse.json({ error: 'Missing required fields: name, type, body' }, { status: 400 });
    }
    if (body.type === 'EMAIL' && !body.subject) {
        return NextResponse.json({ error: 'Subject is required for EMAIL templates' }, { status: 400 });
    }

    const newTemplate: Omit<Template, 'id' | 'created_at' | 'updated_at'> = {
      name: body.name,
      type: body.type,
      subject: body.subject || null, // Ensure subject is null if not provided/needed
      body: body.body,
      // user_id: could be added if templates should be user-specific
    };

    const { data, error } = await supabase
      .from('templates')
      .insert(newTemplate)
      .select()
      .single(); // Return the created template

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error creating template:', err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
