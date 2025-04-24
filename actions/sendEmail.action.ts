"use server";

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getOAuthCredentials, getSenderTokens } from '@/lib/oauthCredentials';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachmentPath?: string;
  senderEmail?: string; // Optional email to determine which token to use
  trackingId?: string; // Used for email open tracking
}

interface EmailResult {
  success: boolean;
  message: string;
  emailId?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, body, attachmentPath, senderEmail, trackingId } = params;
  
  try {
    // Load OAuth tokens using our secure credentials manager
    let credentials;
    
    // If senderEmail is provided, try to find a specific token for it
    if (senderEmail) {
      credentials = getSenderTokens(senderEmail);
    }
    
    // If no specific credentials found, use the default credentials
    if (!credentials) {
      try {
        credentials = getOAuthCredentials();
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
    
    // Add tracking pixel to body if trackingId is provided
    let enhancedBody = body;
    if (trackingId) {
      // Create app URL based on environment
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://dealpig.vercel.app'
        : 'http://localhost:3000';
      
      // Add invisible tracking pixel at the end of email body
      const trackingPixel = `<img src="${baseUrl}/api/tracking?id=${trackingId}" width="1" height="1" alt="" style="display:none" />`;
      
      // Check if body contains HTML
      if (body.includes('</')) {
        // If it ends with '</html>', insert before that
        if (body.trim().endsWith('</html>')) {
          enhancedBody = body.replace('</html>', `${trackingPixel}</html>`);
        } else {
          // Otherwise just append to the end
          enhancedBody = body + trackingPixel;
        }
      } else {
        // Just append if not HTML
        enhancedBody = body + trackingPixel;
      }
    }
    
    // Create email with proper MIME structure
    let messageParts = [
      `To: ${to}`,
      `From: ${senderEmail || 'DealPig <noreply@dealpig.com>'}`,
      'Content-Type: multipart/mixed; boundary="boundary"',
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      '',
      '--boundary',
      'Content-Type: text/html; charset=utf-8',
      '',
      enhancedBody,
    ];

    // Add attachment if specified
    if (attachmentPath) {
      // Check if the attachment exists
      if (!fs.existsSync(attachmentPath)) {
        // If path starts with /, it might be relative to the public directory
        const fullPath = path.join(process.cwd(), 'public', attachmentPath.replace(/^\//, ''));
        if (!fs.existsSync(fullPath)) {
          throw new Error(`Attachment file not found at: ${attachmentPath}`);
        }
        
        // Update the attachment path to the full path
        attachmentPath = fullPath;
      }
      
      const attachment = fs.readFileSync(attachmentPath);
      const filename = path.basename(attachmentPath);
      const mimeType = attachmentPath.endsWith('.docx')
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : attachmentPath.endsWith('.pdf')
        ? 'application/pdf'
        : 'application/octet-stream';
      
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
    
    return {
      success: true,
      message: `Email sent successfully to ${to}`,
      emailId: response.data.id,
    };
    
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}