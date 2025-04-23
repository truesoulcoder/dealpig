import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { loadTokensForEmail, saveTokensForEmail } from '../utils/tokenLoader';
import { environment } from '../config/environment';

export class GmailService {
  private oauth2Client: OAuth2Client;
  private senderEmail: string;
  private senderName: string;

  constructor(senderEmail: string, senderName: string) {
    this.oauth2Client = new OAuth2Client(
      environment.gmailClientId,
      environment.gmailClientSecret,
      environment.gmailRedirectUri
    );

    this.senderEmail = senderEmail;
    this.senderName = senderName;
  }

  async initialize() {
    const tokens = await loadTokensForEmail(this.senderEmail);
    if (tokens) {
      this.oauth2Client.setCredentials(tokens);
    } else {
      throw new Error(`No authentication tokens found for ${this.senderEmail}`);
    }
  }

  async sendEmail(
    to: string[], 
    subject: string, 
    htmlBody: string, 
    attachmentBuffer?: Buffer,
    attachmentName?: string
  ): Promise<{ id: string }> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    const boundary = 'boundary_' + Date.now().toString();
    
    let message = [
      `From: ${this.senderName} <${this.senderEmail}>`,
      `To: ${to.join(', ')}`,
      'MIME-Version: 1.0',
      `Subject: ${subject}`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlBody,
      ''
    ];

    if (attachmentBuffer && attachmentName) {
      message = [
        ...message,
        `--${boundary}`,
        'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Transfer-Encoding: base64',
        `Content-Disposition: attachment; filename="${attachmentName}"`,
        '',
        attachmentBuffer.toString('base64'),
        ''
      ];
    }

    message.push(`--${boundary}--`);

    const encodedMessage = Buffer.from(message.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      if (!response.data.id) {
        throw new Error('Failed to get message ID from Gmail API response');
      }

      return { id: response.data.id };
    } catch (error: any) {
      if (error.code === 401) {
        // Token expired, try to refresh and retry
        await this.refreshAccessToken();
        return this.sendEmail(to, subject, htmlBody, attachmentBuffer, attachmentName);
      }
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      await saveTokensForEmail(this.senderEmail, {
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token!,
        scope: credentials.scope!,
        token_type: credentials.token_type!,
        expiry_date: credentials.expiry_date!
      });
      return credentials;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }
}