import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getOAuthCredentials, saveSenderTokens } from '@/lib/oauthCredentials';
import { updateSenderProfile } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the callback
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    
    if (!code) {
      return NextResponse.redirect(new URL('/senders?error=no_code', request.url));
    }

    // Parse the state parameter to get email and sender ID
    let email = '';
    let senderId = '';
    
    try {
      if (stateParam) {
        const state = JSON.parse(stateParam);
        email = state.email;
        senderId = state.senderId;
      }
    } catch (error) {
      console.error('Error parsing state parameter:', error);
    }

    if (!email || !senderId) {
      return NextResponse.redirect(new URL('/senders?error=invalid_state', request.url));
    }

    // Get OAuth credentials
    const credentials = await getOAuthCredentials();
    
    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
    );

    // Exchange the code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Set the credentials on the OAuth client
    oauth2Client.setCredentials(tokens);

    // Get user profile info to save profile picture and verified email
    const people = google.people({ version: 'v1', auth: oauth2Client });
    const profile = await people.people.get({
      resourceName: 'people/me',
      personFields: 'photos,emailAddresses,names',
    });

    // Find profile photo URL
    let profilePhotoUrl = '';
    if (profile.data.photos && profile.data.photos.length > 0) {
      profilePhotoUrl = profile.data.photos[0].url || '';
    }

    // Verify the email matches what was provided
    let verifiedEmail = email;
    if (profile.data.emailAddresses && profile.data.emailAddresses.length > 0) {
      const foundEmail = profile.data.emailAddresses.find(e => e.value?.toLowerCase() === email.toLowerCase());
      if (foundEmail && foundEmail.value) {
        verifiedEmail = foundEmail.value;
      }
    }

    // Save the tokens to the database
    const tokenSaved = await saveSenderTokens(email, tokens, senderId);
    
    if (!tokenSaved) {
      return NextResponse.redirect(new URL('/senders?error=token_save_failed', request.url));
    }

    // Update the sender profile with the profile picture
    if (profilePhotoUrl) {
      await updateSenderProfile(senderId, {
        profile_picture: profilePhotoUrl,
        verified_email: verifiedEmail
      });
    }

    // Redirect back to the senders page with success message
    return NextResponse.redirect(new URL('/senders?success=true', request.url));
  } catch (error) {
    console.error('Error in Gmail OAuth callback:', error);
    return NextResponse.redirect(
      new URL(`/senders?error=${encodeURIComponent(String(error))}`, request.url)
    );
  }
}