import { NextRequest, NextResponse } from 'next/server';
import { updateEmailStatus } from '@/lib/database';
import { decodeTrackingData, trackEmailEvent, EmailStatus } from '@/lib/emailTrackingService';

/**
 * API route for tracking email opens through 1x1 pixel image
 * This is called when a 1x1 transparent tracking pixel is loaded in an email
 */
export async function GET(request: NextRequest) {
  try {
    // Get the tracking data from the query string
    const url = new URL(request.url);
    const path = url.pathname;
    
    // Handle tracking pixel
    if (path.includes('/tracking/pixel')) {
      return handleTrackingPixel(request);
    } else {
      // Legacy support for direct ID-based tracking
      const trackingId = url.searchParams.get('id');
      
      if (!trackingId) {
        return new NextResponse(null, { status: 400 });
      }
      
      // Record the email open
      await recordEmailOpen(trackingId);
      
      // Return a transparent 1x1 PNG
      return serveTransparentPixel();
    }
  } catch (error) {
    console.error('Error tracking email event:', error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * Handle tracking pixel requests (for email opens)
 */
async function handleTrackingPixel(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const encryptedData = url.searchParams.get('d');
    
    if (!encryptedData) {
      return new NextResponse(null, { status: 400 });
    }
    
    // Decode the tracking data
    const trackingData = decodeTrackingData(encryptedData);
    
    // Get additional data from request
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Record the email open event
    await trackEmailEvent({
      email_id: trackingData.id,
      timestamp: new Date().toISOString(),
      event: 'opened',
      recipient: trackingData.r,
      campaign_id: trackingData.c,
      user_agent: userAgent,
      ip_address: typeof ip === 'string' ? ip : ip[0],
      metadata: {
        referrer: request.headers.get('referer') || undefined
      }
    });
    
    // Return a transparent 1x1 PNG
    return serveTransparentPixel();
  } catch (error) {
    console.error('Error handling tracking pixel:', error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * Return a transparent 1x1 pixel image
 */
function serveTransparentPixel() {
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 
    'base64'
  );
  
  return new NextResponse(pixel, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}

/**
 * API route for tracking email bounces and replies
 * This would be called by a webhook setup with your email provider
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Check if this is a webhook from a specific email provider
    const provider = request.headers.get('x-email-provider');
    
    if (provider) {
      // For provider-specific webhooks, use the emailTrackingService to process
      const { processEmailWebhook } = await import('@/lib/emailTrackingService');
      const success = await processEmailWebhook(
        provider as 'gmail' | 'sendgrid' | 'mailgun', 
        data
      );
      
      if (success) {
        return NextResponse.json({ success: true, message: 'Webhook processed successfully' });
      } else {
        return NextResponse.json({ success: false, message: 'Failed to process webhook' }, { status: 500 });
      }
    }
    
    // Handle our custom event format
    if (!data || !data.event || !data.trackingId) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }
    
    const { event, trackingId, reason, recipient, campaignId } = data;
    
    // Process based on the event type
    if (event === 'bounce') {
      await recordEmailBounce(trackingId, reason || 'Unknown reason');
      return NextResponse.json({ success: true, message: 'Bounce recorded' });
    } else if (event === 'reply') {
      await recordEmailReply(trackingId);
      return NextResponse.json({ success: true, message: 'Reply recorded' });
    } else if (['SENT', 'DELIVERED', 'OPENED', 'SPAM'].includes(event.toUpperCase())) {
      // Use the tracking service for standard events
      await trackEmailEvent({
        email_id: trackingId,
        timestamp: new Date().toISOString(),
        event: event.toUpperCase() as EmailStatus,
        recipient: recipient || 'unknown',
        campaign_id: campaignId,
        metadata: data.metadata
      });
      
      return NextResponse.json({ success: true, message: `${event} event recorded` });
    } else {
      return NextResponse.json({ success: false, message: 'Unsupported event type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error tracking email event:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Record an email open event
 * @deprecated Use trackEmailEvent instead
 */
async function recordEmailOpen(trackingId: string): Promise<void> {
  try {
    const result = await updateEmailStatus(trackingId, 'OPENED', { opened_at: new Date().toISOString() });
    
    if (!result) {
      console.error(`Failed to record open for tracking ID: ${trackingId}`);
    }
  } catch (error) {
    console.error(`Error recording email open for tracking ID ${trackingId}:`, error);
  }
}

/**
 * Record an email bounce event
 * @deprecated Use trackEmailEvent instead
 */
async function recordEmailBounce(trackingId: string, reason: string): Promise<void> {
  try {
    const result = await updateEmailStatus(trackingId, 'BOUNCED', { 
      bounced_at: new Date().toISOString(),
      bounce_reason: reason
    });
    
    if (!result) {
      console.error(`Failed to record bounce for tracking ID: ${trackingId}`);
    }
  } catch (error) {
    console.error(`Error recording email bounce for tracking ID ${trackingId}:`, error);
  }
}

/**
 * Record an email reply event
 * @deprecated Use trackEmailEvent instead
 */
async function recordEmailReply(trackingId: string): Promise<void> {
  try {
    const result = await updateEmailStatus(trackingId, 'REPLIED', { 
      replied_at: new Date().toISOString() 
    });
    
    if (!result) {
      console.error(`Failed to record reply for tracking ID: ${trackingId}`);
    }
  } catch (error) {
    console.error(`Error recording email reply for tracking ID ${trackingId}:`, error);
  }
}