import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { EmailStatus } from '@/helpers/types';
import { requireSuperAdmin } from '@/lib/api-guard';

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
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(cookieStore);
    const payload = await request.json();
    // Parse the webhook payload
    
    // Extract event data
    const { event, emailId, trackingId, timestamp, metadata, messageId } = payload;
    
    if (!trackingId && !emailId && !messageId) {
      return NextResponse.json({ error: 'Missing required identifiers' }, { status: 400 });
    }
    
    // Find the email record
    let emailQuery = supabase.from('emails').select('*');
    
    if (trackingId) {
      emailQuery = emailQuery.eq('tracking_id', trackingId);
    } else if (emailId) {
      emailQuery = emailQuery.eq('id', emailId);
    } else if (messageId) {
      // If using Gmail, you might store message_id in the email record
      emailQuery = emailQuery.eq('message_id', messageId);
    }
    
    const { data: email, error: emailError } = await emailQuery.single();
    
    if (emailError || !email) {
      console.error('Email not found for webhook event:', emailError);
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }
    
    // Process based on event type
    let updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    switch (event) {
      case 'delivered':
        // Email was successfully delivered
        // No status change needed if already SENT
        break;
        
      case 'bounced':
        updateData.status = EmailStatus.BOUNCED;
        updateData.bounced_at = timestamp || new Date().toISOString();
        updateData.bounce_reason = metadata?.reason || 'Unknown bounce reason';
        break;
        
      case 'complained':
        // User marked as spam or complained
        updateData.status = 'COMPLAINED';
        updateData.complained_at = timestamp || new Date().toISOString();
        break;
        
      case 'replied':
        // Recipient replied to the email
        updateData.status = EmailStatus.REPLIED;
        updateData.replied_at = timestamp || new Date().toISOString();
        break;
        
      default:
        // Log unknown event types but don't update the record
        console.log(`Unknown email event type: ${event}`);
        return NextResponse.json({ status: 'ignored' });
    }
    
    // Update the email record
    const { error: updateError } = await supabase
      .from('emails')
      .update(updateData)
      .eq('id', email.id);
    
    if (updateError) {
      console.error('Error updating email status:', updateError);
      return NextResponse.json({ error: 'Error updating status' }, { status: 500 });
    }
    
    // Record the event in email_events table
    const { error: eventError } = await supabase
      .from('email_events')
      .insert({
        email_id: email.id,
        event_type: event,
        recipient_email: email.recipient_email || '',
        campaign_id: email.campaign_id,
        metadata: metadata || {},
        user_agent: request.headers.get('user-agent') || null,
        ip_address: request.headers.get('x-forwarded-for') || null,
        created_at: new Date().toISOString()
      });
    
    if (eventError) {
      console.error('Error recording email event:', eventError);
    }
    
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error processing email webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}