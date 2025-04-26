"use server";

import { createClient } from '@supabase/supabase-js';
import logger from './logger';
import { withBackoff } from './rateLimit';
import { encrypt, decrypt } from './encryption';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Email status types
export type EmailStatus = 
  | 'queued'         // Email is queued for sending
  | 'sent'           // Email has been sent to the mail server
  | 'delivered'      // Email was successfully delivered to recipient's mail server
  | 'opened'         // Email was opened by the recipient
  | 'bounced'        // Email bounced (couldn't be delivered)
  | 'spam'           // Email was marked as spam
  | 'rejected'       // Email was rejected by recipient's mail server
  | 'failed'         // Failed to send email
  | 'unsubscribed';  // Recipient unsubscribed

// Email event data
export interface EmailEvent {
  email_id: string;
  timestamp: string;
  event: EmailStatus;
  recipient: string;
  campaign_id?: string;
  metadata?: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
}

/**
 * Generate a tracking pixel URL for an email
 * @param emailId Unique identifier for the email
 * @param recipientEmail Email address of the recipient
 * @param campaignId Optional campaign ID
 * @returns HTML for the tracking pixel to embed in email
 */
export async function generateTrackingPixel(
  emailId: string, 
  recipientEmail: string, 
  campaignId?: string
): Promise<string> {
  // Encrypt the tracking data
  const trackingData = await encrypt(JSON.stringify({ 
    id: emailId, 
    r: recipientEmail,
    c: campaignId
  }));
  
  const encodedData = encodeURIComponent(trackingData);
  const pixelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/pixel?d=${encodedData}`;
  
  return `<img src="${pixelUrl}" width="1" height="1" alt="" style="display: none;" />`;
}

/**
 * Process email tracking events
 * @param eventData Email event data
 */
export async function trackEmailEvent(eventData: EmailEvent): Promise<boolean> {
  try {
    // Use backoff strategy for database operations
    const result = await withBackoff(
      async () => {
        const { data, error } = await supabase
          .from('email_events')
          .insert([
            {
              email_id: eventData.email_id,
              event_type: eventData.event,
              recipient_email: eventData.recipient,
              campaign_id: eventData.campaign_id,
              metadata: eventData.metadata,
              user_agent: eventData.user_agent,
              ip_address: eventData.ip_address,
              created_at: eventData.timestamp // Use the timestamp from the event data
            }
          ]);
          
        if (error) throw error;
        return data;
      },
      `email-tracking-${eventData.email_id}`
    );
    
    // Update email status in the emails table
    await supabase
      .from('emails')
      .update({ 
        status: eventData.event, 
        last_status_update: eventData.timestamp // Use the timestamp from the event data
      })
      .eq('id', eventData.email_id);
    
    logger.info(`Email tracking event recorded: ${eventData.event}`, 'emailTracking', {
      emailId: eventData.email_id,
      recipient: eventData.recipient,
      event: eventData.event,
      timestamp: eventData.timestamp
    });
    
    return true;
  } catch (error) {
    logger.error('Failed to track email event', error as Error, 'emailTracking', {
      emailId: eventData.email_id,
      event: eventData.event
    });
    return false;
  }
}

/**
 * Decode tracking data from pixel
 * @param encryptedData Encrypted tracking data
 * @returns Decoded tracking data
 */
export async function decodeTrackingData(encryptedData: string): Promise<{
  id: string;
  r: string; // recipient
  c?: string; // campaign
}> {
  try {
    const decrypted = await decrypt(encryptedData);
    return JSON.parse(decrypted);
  } catch (error) {
    logger.error('Failed to decode tracking data', error as Error, 'emailTracking');
    throw new Error('Invalid tracking data');
  }
}

/**
 * Get summary statistics for email campaign
 * @param campaignId Campaign identifier
 */
export async function getEmailCampaignStats(campaignId: string): Promise<{
  sent: number;
  delivered: number;
  opened: number;
  bounced: number;
  failed: number;
  uniqueOpens: number;
}> {
  try {
    // Get all events for this campaign
    const { data: events, error } = await supabase
      .from('email_events')
      .select('*')
      .eq('campaign_id', campaignId);
      
    if (error) throw error;
    
    // Calculate stats
    const stats = {
      sent: events.filter(e => e.event_type === 'sent').length,
      delivered: events.filter(e => e.event_type === 'delivered').length,
      opened: events.filter(e => e.event_type === 'opened').length,
      bounced: events.filter(e => e.event_type === 'bounced').length,
      failed: events.filter(e => e.event_type === 'failed').length,
      uniqueOpens: new Set(events.filter(e => e.event_type === 'opened').map(e => e.recipient_email)).size
    };
    
    return stats;
  } catch (error) {
    logger.error('Failed to get email campaign stats', error as Error, 'emailTracking', { campaignId });
    throw error;
  }
}

/**
 * Process webhook data from email service providers
 * @param provider Email service provider name
 * @param payload Webhook payload
 */
export async function processEmailWebhook(
  provider: 'gmail' | 'sendgrid' | 'mailgun',
  payload: any
): Promise<boolean> {
  try {
    let event: EmailEvent;
    
    switch (provider) {
      case 'sendgrid':
        event = parseSendgridWebhook(payload);
        break;
      case 'mailgun':
        event = parseMailgunWebhook(payload);
        break;
      case 'gmail':
        event = parseGmailWebhook(payload);
        break;
      default:
        throw new Error(`Unsupported email provider: ${provider}`);
    }
    
    // If event is null (meaning it was a click event that we're ignoring),
    // just return true without processing further
    if (!event) {
      logger.info(`Skipping click event from ${provider}`, 'emailWebhooks');
      return true;
    }
    
    return await trackEmailEvent(event);
  } catch (error) {
    logger.error('Failed to process email webhook', error as Error, 'emailWebhooks', { provider });
    return false;
  }
}

/**
 * Parse SendGrid webhook data
 */
function parseSendgridWebhook(payload: any): EmailEvent {
  // Implementation specific to SendGrid's webhook format
  const eventData = Array.isArray(payload) ? payload[0] : payload;
  
  // Map SendGrid event types to our system's types
  const eventTypeMap: Record<string, EmailStatus> = {
    'processed': 'queued',
    'delivered': 'delivered',
    'open': 'opened',
    'bounce': 'bounced',
    'blocked': 'rejected',
    'dropped': 'failed',
    'spamreport': 'spam',
    'unsubscribe': 'unsubscribed',
    'deferred': 'queued'
  };
  
  return {
    email_id: eventData.email_id || eventData.sg_message_id,
    timestamp: new Date(eventData.timestamp * 1000).toISOString(),
    event: eventTypeMap[eventData.event] || 'sent',
    recipient: eventData.email,
    campaign_id: eventData.campaign_id,
    metadata: {
      sg_event_id: eventData.sg_event_id,
      sg_message_id: eventData.sg_message_id,
      reason: eventData.reason,
      status: eventData.status
    },
    user_agent: eventData.useragent,
    ip_address: eventData.ip
  };
}

/**
 * Parse Mailgun webhook data
 */
function parseMailgunWebhook(payload: any): EmailEvent {
  // Implementation specific to Mailgun's webhook format
  const eventTypeMap: Record<string, EmailStatus> = {
    'delivered': 'delivered',
    'opened': 'opened',
    'failed': 'failed',
    'complained': 'spam',
    'unsubscribed': 'unsubscribed',
    'accepted': 'sent'
  };
  
  const eventData = payload['event-data'] || payload;
  
  return {
    email_id: eventData.message.headers['message-id'],
    timestamp: new Date(eventData.timestamp * 1000).toISOString(),
    event: eventTypeMap[eventData.event] || 'sent',
    recipient: eventData.recipient,
    campaign_id: eventData['campaign-id'],
    metadata: {
      delivery_status: eventData.delivery_status,
      message_id: eventData.message.headers['message-id'],
      tags: eventData.tags
    },
    user_agent: eventData['user-variables'] ? eventData['user-variables']['user-agent'] : undefined,
    ip_address: eventData.ip
  };
}

/**
 * Parse Gmail webhook data
 * (Note: Gmail doesn't have official webhooks; this would be for a custom implementation)
 */
function parseGmailWebhook(payload: any): EmailEvent {
  // Implementation would depend on how you structure your custom Gmail notifications
  
  return {
    email_id: payload.emailId,
    timestamp: payload.timestamp || new Date().toISOString(), // Use timestamp from payload if available
    event: payload.status as EmailStatus,
    recipient: payload.recipient,
    campaign_id: payload.campaignId,
    metadata: payload.metadata
  };
}