import { createServerClient } from '@/lib/supabase/server';
import { Template } from '@/helpers/types';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/api-guard';
import { cookies } from 'next/headers';

// Fetch a single template by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const templateId = params.id;
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
  try {
    const cookieStore = cookies(); // Fix lint error: @typescript-eslint/no-unnecessary-call-expression
    const supabase = createServerClient(cookieStore);
    const { data: template, error } = await supabase
      .from('templates')
      .select('*') // Select all columns for viewing/editing
      .eq('id', templateId)
      .single();

    if (error) {
      console.error(`Error fetching template ${templateId}:`, error);
      if (error.code === 'PGRST116') { // Not found
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error(`Unexpected error fetching template ${templateId}:`, error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update a template by ID
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const templateId = params.id;
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
  try {
    const cookieStore = cookies(); // Fix lint error: @typescript-eslint/no-unnecessary-call-expression
    const supabase = createServerClient(cookieStore);
    const body = await request.json();

    // Basic validation
    if (!body.name || !body.type || !body.body) {
      return NextResponse.json({ error: 'Missing required fields: name, type, body' }, { status: 400 });
    }
    if (body.type === 'EMAIL' && !body.subject) {
        return NextResponse.json({ error: 'Subject is required for EMAIL templates' }, { status: 400 });
    }

    const updatedFields: Partial<Template> = {
      name: body.name,
      type: body.type,
      subject: body.subject || null,
      body: body.body,
      updated_at: new Date().toISOString(), // Manually update timestamp
    };

    const { data, error } = await supabase
      .from('templates')
      .update(updatedFields)
      .eq('id', templateId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating template ${templateId}:`, error);
      if (error.code === 'PGRST116') { // Not found during update
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error(`Unexpected error updating template ${templateId}:`, error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete a template by ID
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const templateId = params.id;
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
  try {
    const cookieStore = cookies(); // Fix lint error: @typescript-eslint/no-unnecessary-call-expression
    const supabase = createServerClient(cookieStore);
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      console.error(`Error deleting template ${templateId}:`, error);
      // Check if the error is because the template doesn't exist (optional, delete is often idempotent)
       if (error.code === 'PGRST116') { 
         return NextResponse.json({ error: 'Template not found' }, { status: 404 });
       }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Template deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error: any) {
    console.error(`Unexpected error deleting template ${templateId}:`, error);
    const message = error.message || 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
