import { NextRequest, NextResponse } from 'next/server';
import { getTokens, getUserInfo } from '@/lib/gmail';
import { getSenderById } from '@/lib/database';
import { createAdminClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { requireSuperAdmin } from '@/lib/api-guard'; 

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  try {
    // Get the authorization code from the query parameters
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // Get the state parameter which contains our sender ID
    
    if (!code) {
      const error = searchParams.get('error') || 'Missing authorization code';
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${encodeURIComponent(error)}`);
    }
    
    console.log('Received auth code from Google, exchanging for tokens...');
    
    // Exchange the code for access and refresh tokens
    const tokens = await getTokens(code);
    
    if (!tokens || !tokens.access_token) {
      console.error('Failed to obtain tokens from Google:', tokens);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${encodeURIComponent('Failed to obtain access token')}`);
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
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${encodeURIComponent('OAuth state missing sender ID')}`);
    }
    
    console.log(`Processing tokens for sender ID: ${pendingSenderId}`);
    
    try {
      // Verify the sender exists using admin client to bypass RLS
      const admin = createAdminClient();
      const { data: sender, error: fetchError } = await admin
        .from('senders')
        .select('*')
        .eq('id', pendingSenderId)
        .single();
      if (fetchError || !sender) {
        console.error(`Sender with ID ${pendingSenderId} not found:`, fetchError);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${encodeURIComponent('Sender not found in database')}`);
      }
      
      console.log(`Found sender: ${sender.name} <${sender.email}>`);
      
      // Get user info from Google to verify email
      const userInfo = await getUserInfo(tokens.access_token);
      const primaryEmail = userInfo.emailAddresses?.find(email => email.metadata?.primary)?.value;
      
      if (!primaryEmail) {
        console.error('Could not retrieve email from Google account');
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${encodeURIComponent('Could not retrieve email from Google account')}`);
      }
      
      console.log(`Google account email: ${primaryEmail}`);
      
      // Store the tokens in the database for the sender via admin client
      const { error: updateError } = await admin
        .from('senders')
        .update({ oauth_token: tokens.access_token, refresh_token: tokens.refresh_token || '', updated_at: new Date().toISOString() })
        .eq('id', pendingSenderId);
      if (updateError) throw updateError;
      
      console.log('Successfully saved tokens to database for sender');
      
      // Redirect back to the accounts page with success message
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?success=true`);
    } catch (error: any) {
      // Log the actual error object for better debugging
      let errorMsg = '';
      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === 'object') {
        try {
          errorMsg = JSON.stringify(error, null, 2);
        } catch (e) {
          errorMsg = String(error);
        }
      } else {
        errorMsg = String(error);
      }
      console.error('Error during token processing:', errorMsg);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${encodeURIComponent('Failed during token processing: ' + errorMsg)}`);
    }
  } catch (error: any) {
    console.error('Error completing Gmail OAuth:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/accounts?error=${encodeURIComponent('Failed to complete Gmail authentication')}`);
  }
}