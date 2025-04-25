import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuthCredentials } from '@/lib/oauthCredentials';
import { createSender } from '@/lib/database';

// Gmail OAuth scopes we need for sending emails and monitoring responses
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify',
];

// Route handler for starting the OAuth flow
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const name = url.searchParams.get('name');
    const title = url.searchParams.get('title') || '';
    const dailyQuota = url.searchParams.get('dailyQuota') || '100';

    // Validate required fields
    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required' },
        { status: 400 }
      );
    }

    // Create a new sender record in the database first
    const sender = await createSender({
      email,
      name,
      title,
      daily_quota: parseInt(dailyQuota, 10)
    });

    if (!sender) {
      return NextResponse.json(
        { success: false, message: 'Failed to create sender record' },
        { status: 500 }
      );
    }

    // Get OAuth credentials from our secure credentials manager
    const credentials = await getOAuthCredentials();

    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
    );

    // Generate the authorization URL with the right scopes
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      // Force prompt to ensure we get a refresh token every time
      prompt: 'consent',
      // Store user email and sender ID in state parameter
      state: JSON.stringify({
        email,
        senderId: sender.id
      })
    });

    // Redirect to the Google authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error starting Gmail OAuth flow:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}