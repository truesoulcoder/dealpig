import { NextRequest, NextResponse } from 'next/server';
import { saveGmailCredentials } from '@/actions/auth.action';

export async function GET(request: NextRequest) {
  try {
    // Extract the authorization code from the URL parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    
    if (!code) {
      return NextResponse.redirect('/accounts?error=No_authorization_code');
    }
    
    if (!stateParam) {
      return NextResponse.redirect('/accounts?error=Missing_state_parameter');
    }
    
    // Decode state parameter to get the sender ID
    const state = JSON.parse(Buffer.from(stateParam, 'base64').toString());
    const { senderId } = state;
    
    if (!senderId) {
      return NextResponse.redirect('/accounts?error=Invalid_state_parameter');
    }
    
    // Exchange the code for access and refresh tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GMAIL_CLIENT_ID || '',
        client_secret: process.env.GMAIL_CLIENT_SECRET || '',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/gmail/callback`,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      console.error('Token error:', tokenData);
      return NextResponse.redirect(`/accounts?error=${encodeURIComponent(tokenData.error || 'Token_exchange_failed')}`);
    }
    
    const { access_token, refresh_token } = tokenData;
    
    // Get user profile info
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${access_token}`,
      },
    });
    
    const profileData = await userInfoResponse.json();
    
    // Save tokens and profile info to the database
    await saveGmailCredentials(senderId, access_token, refresh_token, profileData);
    
    // Redirect back to the accounts page with success message
    return NextResponse.redirect(`/accounts?success=Gmail_authorization_successful`);
  } catch (error) {
    console.error('Gmail OAuth callback error:', error);
    return NextResponse.redirect('/accounts?error=Authorization_failed');
  }
}