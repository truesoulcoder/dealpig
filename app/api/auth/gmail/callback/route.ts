import { NextRequest, NextResponse } from 'next/server';
import { getTokens, getUserInfo } from '@/lib/gmail';
import { updateSenderTokens } from '@/lib/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    
    if (!code) {
      const error = searchParams.get('error') || 'Missing authorization code';
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent(error)}`);
    }
    
    // Exchange the code for access and refresh tokens
    const tokens = await getTokens(code);
    
    if (!tokens || !tokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to obtain access token')}`);
    }
    
    // Get pending sender ID from cookie - await the cookies() function
    const cookieStore = await cookies();
    const pendingSenderId = cookieStore.get('pending-sender-id')?.value;
    
    if (!pendingSenderId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('No pending sender found')}`);
    }
    
    // Verify that the authorized email matches the one we're expecting
    // This prevents users from authenticating with a different Gmail account
    try {
      const userInfo = await getUserInfo(tokens.access_token);
      const primaryEmail = userInfo.emailAddresses?.find(email => email.metadata?.primary)?.value;
      
      if (!primaryEmail) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Could not retrieve email from Google account')}`);
      }
      
      // Store the tokens in the database for the sender
      await updateSenderTokens(pendingSenderId, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || '',
      });
      
      // Clear the pending sender ID cookie
      cookieStore.delete('pending-sender-id');
      
      // Redirect back to the accounts page with success message
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?success=true`);
    } catch (error) {
      console.error('Error verifying user email:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to verify email')}`);
    }
  } catch (error) {
    console.error('Error completing Gmail OAuth:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to complete Gmail authentication')}`);
  }
}