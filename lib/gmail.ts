import { google } from 'googleapis';
import { Sender } from '@/helpers/types';

// Configure OAuth2 client with proper scopes for email sending and profile access
export function getOAuth2Client(redirectUrl?: string) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const defaultRedirect = process.env.GMAIL_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`;
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUrl || defaultRedirect
  );
}

// Generate authorization URL for initial OAuth consent
export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  
  const scopes = [
    'https://www.googleapis.com/auth/gmail.send', // Permission to send emails
    'https://www.googleapis.com/auth/userinfo.email', // Access to user's email
    'https://www.googleapis.com/auth/userinfo.profile', // Access to user's profile
  ];
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Get a refresh token for future access
    prompt: 'consent', // Force showing the consent screen
    scope: scopes,
  });
}

// Exchange auth code for tokens after user grants permission
export async function getTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Get authenticated client using an access token
export function getAuthenticatedClient(accessToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

// Get authenticated client from a sender object
export function getClientFromSender(sender: Sender) {
  const oauth2Client = getOAuth2Client();
  
  if (!sender.oauth_token) {
    throw new Error(`Sender ${sender.email} has no OAuth token`);
  }
  
  oauth2Client.setCredentials({
    access_token: sender.oauth_token,
    refresh_token: sender.refresh_token || undefined,
  });
  
  return oauth2Client;
}

// Get user profile info from an access token
export async function getUserInfo(accessToken: string) {
  const auth = getAuthenticatedClient(accessToken);
  const people = google.people({ version: 'v1', auth });
  
  try {
    const userInfo = await people.people.get({
      resourceName: 'people/me',
      personFields: 'emailAddresses,names,photos',
    });
    
    return userInfo.data;
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

// Refresh an expired access token
export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

// Send an email through Gmail API
export async function sendMail({
  auth,
  to,
  subject,
  text,
  html,
  from,
  replyTo,
  attachments = [],
}: {
  auth: any;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    encoding?: 'base64' | 'binary' | 'hex';
  }>;
}) {
  const gmail = google.gmail({ version: 'v1', auth });
  
  // Create email MIME message
  let raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
  ];
  
  // Set From header if provided
  if (from) {
    raw.push(`From: ${from}`);
  }
  
  // Set Reply-To header if provided
  if (replyTo) {
    raw.push(`Reply-To: ${replyTo}`);
  }
  
  // Add content headers and body
  if (attachments.length > 0) {
    // Create multipart email with attachments
    const boundary = `boundary_${Date.now().toString()}`;
    raw.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    raw.push('');
    
    // Add HTML or text part
    raw.push(`--${boundary}`);
    raw.push('Content-Type: text/html; charset="UTF-8"');
    raw.push('Content-Transfer-Encoding: quoted-printable');
    raw.push('');
    raw.push(html || text || '');
    
    // Add each attachment
    for (const attachment of attachments) {
      const { filename, content, encoding = 'base64' } = attachment;
      raw.push(`--${boundary}`);
      raw.push(`Content-Type: application/octet-stream; name="${filename}"`);
      raw.push('Content-Transfer-Encoding: base64');
      raw.push(`Content-Disposition: attachment; filename="${filename}"`);
      raw.push('');
      
      // Convert content to base64 if it's a Buffer or string
      const base64Content = Buffer.isBuffer(content)
        ? content.toString('base64')
        : encoding === 'base64'
        ? content
        : Buffer.from(content).toString('base64');
      
      raw.push(base64Content);
    }
    
    raw.push(`--${boundary}--`);
  } else {
    // Simple email without attachments
    raw.push('Content-Type: text/html; charset="UTF-8"');
    raw.push('');
    raw.push(html || text || '');
  }
  
  const rawEmail = Buffer.from(raw.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  try {
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawEmail,
      },
    });
    
    return {
      messageId: response.data.id,
      threadId: response.data.threadId,
    };
  } catch (error) {
    console.error('Error sending email via Gmail API:', error);
    throw error;
  }
}

// Check Gmail quota and sending limits
export async function checkEmailQuota(auth: any) {
  try {
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Get the user's profile which includes emailAddress
    const profile = await gmail.users.getProfile({ userId: 'me' });
    
    return {
      email: profile.data.emailAddress,
      // In a real implementation, we would track daily quota based on our own
      // database records since Gmail API doesn't expose direct quota information
      // This is handled through our database senders table
    };
  } catch (error) {
    console.error('Error checking email quota:', error);
    throw error;
  }
}

// Monitor for email replies (webhook/push notifications would be better)
// This is a simplified polling approach - a production app would use Gmail push notifications
export async function checkForReplies(auth: any, query = 'in:inbox is:unread') {
  const gmail = google.gmail({ version: 'v1', auth });
  
  try {
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 10,
    });
    
    if (!response.data.messages || response.data.messages.length === 0) {
      return [];
    }
    
    // Return message IDs of unread emails
    return response.data.messages;
  } catch (error) {
    console.error('Error checking for replies:', error);
    throw error;
  }
}

// Format sender name and email for Gmail
export function formatSenderString(name: string, email: string): string {
  return `${name} <${email}>`;
}

// Add a tracking pixel to an HTML email
export function addTrackingPixel(html: string, trackingId: string): string {
  const trackingUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/tracking/${trackingId}/pixel.png`;
  const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`;
  
  return html.includes('</body>')
    ? html.replace('</body>', `${trackingPixel}</body>`)
    : `${html}${trackingPixel}`;
}