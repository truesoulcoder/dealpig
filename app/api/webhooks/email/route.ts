import { NextRequest, NextResponse } from 'next/server';
import { processEmailWebhook } from '@/lib/emailTrackingService';
import { webhookLimiter } from '@/lib/rateLimit';
import logger from '@/lib/logger';

/**
 * API Route to handle webhooks from email service providers
 * This endpoint receives and processes delivery status notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await webhookLimiter(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Get provider from URL path or header
    const provider = request.nextUrl.searchParams.get('provider') || 
                    request.headers.get('x-webhook-source') || 
                    'unknown';
    
    if (!['sendgrid', 'mailgun', 'gmail'].includes(provider)) {
      logger.warn(`Unknown email provider webhook: ${provider}`, 'webhooks');
      return new NextResponse('Unsupported provider', { status: 400 });
    }
    
    // Validate webhook signature if available
    if (provider === 'sendgrid') {
      const signature = request.headers.get('x-sendgrid-signature');
      if (!signature) {
        logger.warn('Missing SendGrid signature', 'webhooks');
        return new NextResponse('Invalid signature', { status: 401 });
      }
      
      // TODO: Add signature validation for SendGrid
      // This would involve comparing the signature with HMAC using your signing key
    }
    
    if (provider === 'mailgun') {
      const signature = request.headers.get('x-mailgun-signature');
      const timestamp = request.headers.get('x-mailgun-timestamp');
      const token = request.headers.get('x-mailgun-token');
      
      if (!signature || !timestamp || !token) {
        logger.warn('Missing Mailgun signature components', 'webhooks');
        return new NextResponse('Invalid signature', { status: 401 });
      }
      
      // TODO: Add signature validation for Mailgun
      // This would involve comparing the signature with HMAC using your API key
    }
    
    // Parse the payload
    let payload;
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData);
    } else {
      logger.warn(`Unsupported content type: ${contentType}`, 'webhooks');
      return new NextResponse('Unsupported content type', { status: 415 });
    }
    
    // Process the webhook data with appropriate provider handler
    const success = await processEmailWebhook(provider as any, payload);
    
    if (!success) {
      return new NextResponse('Processing error', { status: 500 });
    }
    
    // Return success
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error', error, 'webhooks');
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}