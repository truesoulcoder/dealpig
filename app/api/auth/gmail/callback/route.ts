import { NextRequest, NextResponse } from 'next/server';
import { getTokens, getUserInfo } from '@/lib/gmail';
import { updateSenderTokens, getSenderById } from '@/lib/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Get the state parameter which contains our sender ID
    
    if (!code) {
      const error = searchParams.get('error') || 'Missing authorization code';
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent(error)}`);
    }
    
    console.log('Received auth code from Google, exchanging for tokens...');
    
    // Exchange the code for access and refresh tokens
    const tokens = await getTokens(code);
    
    if (!tokens || !tokens.access_token) {
      console.error('Failed to obtain tokens from Google:', tokens);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Failed to obtain access token')}`);
    }
    
    console.log('Got tokens successfully:', { 
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      tokenExpiry: tokens.expiry_date 
    });
    
    // Use the state parameter as our sender ID
    const pendingSenderId = state;
    
    if (!pendingSenderId) {
      console.error('No sender ID found in state parameter');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('OAuth state missing sender ID')}`);
    }
    
    console.log(`Processing tokens for sender ID: ${pendingSenderId}`);
    
    try {
      // Verify the sender exists
      const sender = await getSenderById(pendingSenderId);
      if (!sender) {
        console.error(`Sender with ID ${pendingSenderId} not found in database`);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Sender not found in database')}`);
      }
      
      console.log(`Found sender: ${sender.name} <${sender.email}>`);
      
      // Get user info from Google to verify email
      const userInfo = await getUserInfo(tokens.access_token);
      const primaryEmail = userInfo.emailAddresses?.find(email => email.metadata?.primary)?.value;
      
      if (!primaryEmail) {
        console.error('Could not retrieve email from Google account');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Could not retrieve email from Google account')}`);
      }
      
      console.log(`Google account email: ${primaryEmail}`);
      
      // Store the tokens in the database for the sender
      await updateSenderTokens(pendingSenderId, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
      });
      
      console.log('Successfully saved tokens to database for sender');
      
      // Redirect back to the accounts page with success message
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?success=true`);
    } catch (error) {
      console.error('Error during token processing:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Failed during token processing: ' + (error instanceof Error ? error.message : String(error)))}`);
    }
  } catch (error) {
    console.error('Error completing Gmail OAuth:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Failed to complete Gmail authentication')}`);
  }
}