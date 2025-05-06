import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Campaign } from '@/helpers/types';

interface Params {
  id: string;
}

// Fetch a single campaign by ID
export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*') // Select all fields for viewing/editing
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // PostgREST error code for no rows found
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
      }
      console.error(`Error fetching campaign ${id}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Optional: Check if the user owns the campaign
    const { data: { user } } = await supabase.auth.getUser();
    if (data.user_id !== user?.id) {
        // Decide on behaviour: return 404 or 403 (Forbidden)
        console.warn(`User ${user?.id} attempted to access campaign ${id} owned by ${data.user_id}`);
        return NextResponse.json({ error: 'Campaign not found or permission denied' }, { status: 404 }); 
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(`Unexpected error fetching campaign ${id}:`, err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Update a campaign
export async function PUT(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    const body: Partial<Campaign> = await request.json();

    // Ensure user owns the campaign or has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Construct update object dynamically from provided body fields
    const updateData: Partial<Campaign> = {};
    // Define allowed fields to prevent updating protected fields like id, user_id, timestamps
    const allowedUpdateFields: (keyof Campaign)[] = [
      'name', 'description', 'status', 'email_template_id', 'loi_template_id',
      'leads_per_day', 'start_time', 'end_time', 'min_interval_minutes', 'max_interval_minutes',
      'attachment_type', 'tracking_enabled', 'company_logo_path', 'email_subject', 'email_body'
    ];

    // Use a Set for efficient lookup of allowed fields
    const allowedUpdateFieldsSet = new Set<string>(allowedUpdateFields);

    // Iterate through keys present in the request body
    for (const key in body) {
      // Check if the key is a direct property of body and is in our allowed list
      if (Object.prototype.hasOwnProperty.call(body, key) && allowedUpdateFieldsSet.has(key)) {
        const campaignKey = key as keyof Campaign;
        // Assign the value only if it's not explicitly undefined
        // This allows setting fields to `null` if the type permits
        if (body[campaignKey] !== undefined) {
          // @ts-ignore - Supabase client handles partial updates with null correctly based on schema
          updateData[campaignKey] = body[campaignKey];
        }
      } 
    }
    
    // Don't update if no valid fields provided
    if (Object.keys(updateData).length === 0) { 
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }
    
    // Manually update the timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only update their own campaigns
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') { // Not found or permission denied
        // Check if the campaign exists but belongs to another user
        const { data: existingCampaign, error: checkError } = await supabase.from('campaigns').select('id, user_id').eq('id', id).maybeSingle();
        if (checkError) { // Handle potential error during the check
            console.error(`Error checking existence/ownership for campaign ${id} during update:`, checkError);
            // Fallback to a generic error or the original update error
            return NextResponse.json({ error: 'Failed to verify campaign ownership during update.' }, { status: 500 });
        }
        if (existingCampaign) {
             console.warn(`User ${user?.id} attempted to update campaign ${id} owned by ${existingCampaign.user_id}`);
             return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        } else {
             return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
      }
      console.error(`Error updating campaign ${id}:`, updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (!data) {
       // This case might be redundant due to the checks above, but kept for safety
       return NextResponse.json({ error: 'Campaign not found or update failed unexpectedly' }, { status: 404 });
    }

    return NextResponse.json(data);

  } catch (err) {
    console.error(`Unexpected error updating campaign ${id}:`, err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete a campaign
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = params;
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);

  if (!id) {
    return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 });
  }

  try {
    // Ensure user owns the campaign or has permission
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Transaction recommended for deleting related data and the campaign
    // Example using a Supabase function (preferred) or sequential deletes:
    /*
    const { error: rpcError } = await supabase.rpc('delete_campaign_and_relations', { campaign_id_to_delete: id, user_id_check: user.id });
    if (rpcError) { 
        console.error(`Error deleting campaign ${id} via RPC:`, rpcError);
        // Handle specific RPC errors if possible 
        return NextResponse.json({ error: 'Failed to delete campaign and related data.' }, { status: 500 });
    }
    */
    
    // Simple delete (without handling relations explicitly here):
    const { error: deleteError, count } = await supabase
      .from('campaigns')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user can only delete their own campaigns

    if (deleteError) {
      console.error(`Error deleting campaign ${id}:`, deleteError);
      // TODO: Check for foreign key constraint errors if relations weren't handled
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (count === 0) {
        // Check if the campaign exists but belongs to another user
        const { data: existingCampaign, error: checkError } = await supabase.from('campaigns').select('id, user_id').eq('id', id).maybeSingle();
        if (checkError) {
             console.error(`Error checking existence/ownership for campaign ${id} during delete:`, checkError);
             return NextResponse.json({ error: 'Failed to verify campaign ownership during delete.' }, { status: 500 });
        }
        if (existingCampaign) {
             console.warn(`User ${user?.id} attempted to delete campaign ${id} owned by ${existingCampaign.user_id}`);
             return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        } else {
             return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }
    }

    // If using RPC, the success response might come from there
    return NextResponse.json({ message: 'Campaign deleted successfully' }, { status: 200 });

  } catch (err) {
    console.error(`Unexpected error deleting campaign ${id}:`, err);
    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
