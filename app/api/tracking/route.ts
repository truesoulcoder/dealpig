import { NextRequest, NextResponse } from 'next/server';
import { updateEmailStatus } from '@/lib/database';

/**
 * API route for tracking email opens through 1x1 pixel image
 * This is called when a 1x1 transparent tracking pixel is loaded in an email
 */
export async function GET(request: NextRequest) {
  try {
    // Get the tracking ID from the query string
    const url = new URL(request.url);
    const trackingId = url.searchParams.get('id');
    
    if (!trackingId) {
      return new NextResponse(null, { status: 400 });
    }
    
    // Record the email open
    await recordEmailOpen(trackingId);
    
    // Return a transparent 1x1 PNG
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
  } catch (error) {
    console.error('Error tracking email open:', error);
    return new NextResponse(null, { status: 500 });
  }
}

/**
 * API route for tracking email bounces and replies
 * This would be called by a webhook setup with your email provider
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the request
    if (!data || !data.event || !data.trackingId) {
      return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
    }
    
    const { event, trackingId, reason } = data;
    
    // Process based on the event type
    if (event === 'bounce') {
      await recordEmailBounce(trackingId, reason || 'Unknown reason');
      return NextResponse.json({ success: true, message: 'Bounce recorded' });
    } else if (event === 'reply') {
      await recordEmailReply(trackingId);
      return NextResponse.json({ success: true, message: 'Reply recorded' });
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