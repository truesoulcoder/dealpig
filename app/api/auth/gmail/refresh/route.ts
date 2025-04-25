import { NextRequest, NextResponse } from 'next/server';
import { getSenderById } from '@/lib/database';
import { google } from 'googleapis';
import { getOAuthCredentials } from '@/lib/oauthCredentials';

export async function GET(request: NextRequest) {
  try {
    // Get sender ID from query parameter
    const url = new URL(request.url);
    const senderId = url.searchParams.get('sender_id');
    
    if (!senderId) {
      return NextResponse.redirect(new URL('/senders?error=missing_sender_id', request.url));
    }

    // Get sender details from the database
    const sender = await getSenderById(senderId);
    
    if (!sender) {
      return NextResponse.redirect(new URL('/senders?error=sender_not_found', request.url));
    }

    // Get OAuth credentials
    const credentials = await getOAuthCredentials();
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
    );

    // Define required scopes
    const SCOPES = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ];

    // Generate the authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      // Force prompt to ensure we get a refresh token
      prompt: 'consent',
      // Store user email and sender ID in state parameter
      state: JSON.stringify({
        email: sender.email,
        senderId: sender.id
      })
    });

    // Redirect to the Google authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error refreshing Gmail OAuth:', error);
    return NextResponse.redirect(
      new URL(`/senders?error=${encodeURIComponent(String(error))}`, request.url)
    );
  }
}