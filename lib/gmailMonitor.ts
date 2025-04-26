"use server";

import { google } from 'googleapis';
import { getValidSenderTokens } from './oauthCredentials';
import { updateEmailStatus, getEmailsByLeadId, getAllActiveSenders, getEmailsByMessageId } from '@/lib/database';

interface GmailMonitorResult {
  success: boolean;
  message: string;
  processed?: number;
}

/**
 * Monitors Gmail inbox for replies to campaign emails
 * This should be run on a schedule (e.g., every 30 minutes)
 */
export async function monitorEmailResponses(): Promise<GmailMonitorResult> {
  try {
    console.log('Starting Gmail response monitoring...');
    
    // Get all sender emails that need monitoring
    const senderEmails = await getSenderEmails();
    
    if (!senderEmails || senderEmails.length === 0) {
      return {
        success: true,
        message: 'No sender emails to monitor',
        processed: 0
      };
    }
    
    let totalProcessed = 0;
    
    // Process each sender's inbox
    for (const email of senderEmails) {
      try {
        const processed = await processInbox(email);
        totalProcessed += processed;
      } catch (error) {
        console.error(`Error processing inbox for ${email}:`, error);
      }
    }
    
    return {
      success: true,
      message: `Processed ${totalProcessed} email responses across ${senderEmails.length} inboxes`,
      processed: totalProcessed
    };
    
  } catch (error) {
    console.error('Error monitoring email responses:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get all sender emails that should be monitored
 */
async function getSenderEmails(): Promise<string[]> {
  try {
    // Get active senders from database instead of scanning files
    const senders = await getAllActiveSenders();
    return senders.map((sender: { email: string }) => sender.email);
  } catch (error) {
    console.error('Error getting sender emails:', error);
    return [];
  }
}

/**
 * Process a sender's inbox for email responses
 */
async function processInbox(senderEmail: string): Promise<number> {
  try {
    // Use our token refresh mechanism instead of reading from files
    const credentials = await getValidSenderTokens(senderEmail);
    
    if (!credentials || !credentials.refresh_token) {
      console.warn(`No valid credentials found for ${senderEmail}`);
      return 0;
    }
    
    const oAuth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );
    
    oAuth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    });
    
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    
    // Get messages received in the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const query = `after:${yesterday.getTime() / 1000} is:inbox`;
    
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });
    
    const messages = res.data.messages || [];
    let processedCount = 0;
    
    for (const msg of messages) {
      try {
        // Get full message details
        const msgDetails = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!
        });
        
        // Check if this is a reply to a campaign email
        const isReply = await processMessageForTracking(msgDetails.data, senderEmail);
        
        if (isReply) {
          processedCount++;
        }
      } catch (error) {
        console.error(`Error processing message ${msg.id}:`, error);
      }
    }
    
    console.log(`Processed ${processedCount} replies for ${senderEmail}`);
    return processedCount;
    
  } catch (error) {
    console.error(`Error processing inbox for ${senderEmail}:`, error);
    return 0;
  }
}

/**
 * Process a single message to check if it's a reply to a tracked email
 */
async function processMessageForTracking(message: any, senderEmail: string): Promise<boolean> {
  try {
    // Extract headers
    const headers = message.payload?.headers || [];
    const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '';
    const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
    const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
    const references = headers.find((h: any) => h.name.toLowerCase() === 'references')?.value || '';
    const inReplyTo = headers.find((h: any) => h.name.toLowerCase() === 'in-reply-to')?.value || '';
    
    // Check if this is a response to an email we sent
    if (!to.includes(senderEmail)) {
      return false;
    }
    
    // Extract message ID from References or In-Reply-To
    const messageIds = [
      ...extractMessageIds(references),
      ...extractMessageIds(inReplyTo)
    ];
    
    if (messageIds.length === 0) {
      return false;
    }
    
    // For each extracted message ID, check if it matches any of our sent emails
    let matchFound = false;
    for (const messageId of messageIds) {
      // Find if we have a tracking record for this message ID
      const trackingResult = await updateEmailStatusByMessageId(messageId, 'REPLIED', {
        replied_at: new Date().toISOString()
      });
      
      if (trackingResult) {
        console.log(`Found and updated tracking for message ID: ${messageId}`);
        matchFound = true;
      }
    }
    
    return matchFound;
    
  } catch (error) {
    console.error('Error processing message for tracking:', error);
    return false;
  }
}

/**
 * Extract Gmail message IDs from a string
 */
function extractMessageIds(text: string): string[] {
  if (!text) return [];
  
  // Gmail message IDs are surrounded by angle brackets
  const messageIdRegex = /<([^>]+)>/g;
  const matches: string[] = [];
  let match;
  
  while ((match = messageIdRegex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

/**
 * Update email status by message ID 
 * This function is needed for reply tracking
 */
async function updateEmailStatusByMessageId(
  messageId: string, 
  status: string, 
  additionalData?: any
): Promise<boolean> {
  try {
    // Get emails with this message ID
    const emails = await getEmailsByMessageId(messageId);
    
    if (!emails || emails.length === 0) {
      return false;
    }
    
    // Update the status of each matching email
    for (const email of emails) {
      await updateEmailStatus(email.id!, status, additionalData);
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating email status for message ID ${messageId}:`, error);
    return false;
  }
}