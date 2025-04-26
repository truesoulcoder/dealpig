import { NextRequest, NextResponse } from 'next/server';
import { decodeTrackingData, trackEmailEvent } from '@/lib/emailTrackingService';
import logger from '@/lib/logger';

/**
 * API Route to handle email tracking pixel requests
 * Tracks when an email is opened
 */
export async function GET(request: NextRequest) {
  try {
    // Get the encrypted tracking data from the query parameter
    const url = new URL(request.url);
    const encodedData = url.searchParams.get('d');
    
    if (!encodedData) {
      return new NextResponse('Bad request', { status: 400 });
    }
    
    // Decode the tracking data
    const trackingData = decodeTrackingData(encodedData);
    
    // Track the open event
    await trackEmailEvent({
      email_id: trackingData.id,
      timestamp: new Date().toISOString(),
      event: 'opened',
      recipient: trackingData.r,
      campaign_id: trackingData.c,
      user_agent: request.headers.get('user-agent') || undefined,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0] || request.ip
    });

    // Return a transparent 1x1 pixel GIF
    const TRANSPARENT_GIF_BUFFER = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    logger.error('Error in tracking pixel', error, 'emailTracking');
    
    // Still return a transparent pixel to avoid errors in email clients
    const TRANSPARENT_GIF_BUFFER = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(TRANSPARENT_GIF_BUFFER, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}