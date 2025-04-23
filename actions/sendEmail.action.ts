"use server";

import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachmentPath?: string;
  senderEmail?: string; // Optional email to determine which token to use
}

interface EmailResult {
  success: boolean;
  message: string;
  emailId?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const { to, subject, body, attachmentPath, senderEmail } = params;
  
  try {
    // Load OAuth tokens
    let credentials;
    
    // If senderEmail is provided, try to find a specific token file for it
    if (senderEmail) {
      const normalizedEmail = senderEmail.replace(/[@.]/g, '_');
      const tokenPath = path.join(process.cwd(), 'auth_tokens', `token_${normalizedEmail}.json`);
      
      try {
        credentials = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      } catch (error) {
        console.warn(`No token file found for ${senderEmail}, falling back to environment variables`);
      }
    }
    
    // If no credentials found from file, use environment variables
    if (!credentials) {
      credentials = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      };
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
      body,
    ];

    if (attachmentPath) {
      // Check if the attachment exists
      if (!fs.existsSync(attachmentPath)) {
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

    // Record the email status to database (to be implemented)
    // For now, just log the success
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