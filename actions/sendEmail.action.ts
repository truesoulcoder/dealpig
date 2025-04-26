"use server";

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getOAuthCredentials, getSenderTokens } from '@/lib/oauthCredentials';
import { generateTrackingPixel, trackEmailEvent } from '@/lib/emailTrackingService';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachmentPath?: string;
  attachments?: Array<{path: string, filename: string}>;
  senderEmail?: string; // Optional email to determine which token to use
  trackingId?: string; // Used for email open tracking
  trackingEnabled?: boolean; // Whether to enable tracking
  senderId?: string; // ID of the sender in the database
  senderName?: string; // Name of the sender
  userId?: string; // ID of the user sending the email
  campaignId?: string; // ID of the campaign if sent as part of a campaign
}

interface EmailResult {
  success: boolean;
  message: string;
  emailId?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, body, senderEmail, trackingId, trackingEnabled, campaignId } = params;
  // Create a modifiable copy of attachmentPath
  let attachmentFilePath = params.attachmentPath;
  
  try {
    // Load OAuth tokens using our secure credentials manager
    let credentials;
    
    // If senderEmail is provided, try to find a specific token for it
    if (senderEmail) {
      credentials = await getSenderTokens(senderEmail);
    }
    
    // If no specific credentials found, use the default credentials
    if (!credentials) {
      try {
        credentials = await getOAuthCredentials();
        if (!credentials) {
          throw new Error("Failed to retrieve OAuth credentials");
        }
      } catch (error) {
        console.error('Failed to load OAuth credentials:', error);
        return {
          success: false,
          message: 'Failed to load email authentication credentials',
        };
      }
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
    
    // Process the body content for tracking if enabled
    let enhancedBody = body;
    
    if (trackingEnabled !== false && trackingId && to) {
      // Add tracking pixel using our advanced tracking service
      const trackingPixel = generateTrackingPixel(trackingId, to, campaignId);
      
      // Add the tracking pixel at the end of the body
      if (enhancedBody.includes('</html>')) {
        enhancedBody = enhancedBody.replace('</html>', `${trackingPixel}</html>`);
      } else if (enhancedBody.includes('</body>')) {
        enhancedBody = enhancedBody.replace('</body>', `${trackingPixel}</body>`);
      } else {
        // If not HTML or no closing tags, just append
        enhancedBody = `${enhancedBody}${trackingPixel}`;
      }
    }
    
    // Create email with proper MIME structure
    let messageParts = [
      `To: ${to}`,
      `From: ${params.senderName ? `"${params.senderName}" <${senderEmail}>` : (senderEmail || 'DealPig <noreply@dealpig.com>')}`,
      'Content-Type: multipart/mixed; boundary="boundary"',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      '--boundary',
      'Content-Type: text/html; charset=utf-8',
      '',
      enhancedBody,
    ];

    // Add attachment if specified via single attachmentPath
    if (attachmentFilePath) {
      // Check if the attachment exists
      if (!fs.existsSync(attachmentFilePath)) {
        // If path starts with /, it might be relative to the public directory
        const fullPath = path.join(process.cwd(), 'public', attachmentFilePath.replace(/^\//, ''));
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Attachment file not found at: ${attachmentFilePath}`);
        }
        
        // Update the attachment path to the full path
        attachmentFilePath = fullPath;
      }
      
      const attachment = fs.readFileSync(attachmentFilePath);
      const filename = path.basename(attachmentFilePath);
      const mimeType = determineFileMimeType(attachmentFilePath);
      
      messageParts = [
        ...messageParts,
        '',
        '--boundary',
        `Content-Type: ${mimeType}; name="${filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${filename}"`,
        '',
        attachment.toString('base64'),
      ];
    }
    
    // Add attachments if specified via attachments array
    if (params.attachments && params.attachments.length > 0) {
      for (const attachment of params.attachments) {
        let attachPath = attachment.path;
        
        // Check if the attachment exists
        if (!fs.existsSync(attachPath)) {
          // If path starts with /, it might be relative to the public directory
          const fullPath = path.join(process.cwd(), 'public', attachPath.replace(/^\//, ''));
          if (!fs.existsSync(fullPath)) {
            throw new Error(`Attachment file not found at: ${attachPath}`);
          }
          
          // Update the attachment path to the full path
          attachPath = fullPath;
        }
        
        const fileContent = fs.readFileSync(attachPath);
        const filename = attachment.filename || path.basename(attachPath);
        const mimeType = determineFileMimeType(attachPath);
        
        messageParts = [
          ...messageParts,
          '',
          '--boundary',
          `Content-Type: ${mimeType}; name="${filename}"`,
          'Content-Transfer-Encoding: base64',
          `Content-Disposition: attachment; filename="${filename}"`,
          '',
          fileContent.toString('base64'),
        ];
      }
    }

    // Close the boundary
    messageParts.push('', '--boundary--');
    
    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`Email sent successfully to ${to}`);
    
    // Record the 'sent' event in our tracking system if tracking is enabled
    if (trackingEnabled !== false && trackingId && to) {
      await trackEmailEvent({
        email_id: trackingId,
        timestamp: new Date().toISOString(),
        event: 'sent',
        recipient: to,
        campaign_id: campaignId,
        metadata: {
          subject,
          gmail_message_id: response.data.id,
          sender_email: senderEmail,
          sender_id: params.senderId
        }
      });
    }
    
    return {
      success: true,
      message: `Email sent successfully to ${to}`,
      emailId: response.data.id ?? undefined,
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Record the failure if tracking is enabled
    if (trackingEnabled !== false && trackingId && to) {
      try {
        await trackEmailEvent({
          email_id: trackingId,
          timestamp: new Date().toISOString(),
          event: 'failed',
          recipient: to,
          campaign_id: campaignId,
          metadata: {
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      } catch (trackingError) {
        console.error('Failed to record email sending failure:', trackingError);
      }
    }
    
    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

// Helper function to determine the MIME type of a file
function determineFileMimeType(filePath: string): string {
  if (filePath.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (filePath.endsWith('.pdf')) {
    return 'application/pdf';
  } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
    return 'image/jpeg';
  } else if (filePath.endsWith('.png')) {
    return 'image/png';
  } else if (filePath.endsWith('.gif')) {
    return 'image/gif';
  } else {
    return 'application/octet-stream';
  }
}