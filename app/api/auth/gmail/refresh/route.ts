import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/gmail';
import { getSenderById, updateSenderTokens } from '@/lib/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get sender ID from query params
    const searchParams = request.nextUrl.searchParams;
    const senderId = searchParams.get('sender_id');
    
    if (!senderId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Missing sender ID')}`);
    }
    
    // Check user authentication - await the cookies() function
    const cookieStore = await cookies();
    const userId = cookieStore.get('user-id')?.value;
    
    if (!userId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login`);
    }
    
    // Get sender details
    const sender = await getSenderById(senderId);
    
    if (!sender) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Sender not found')}`);
    }
    
    if (!sender.refresh_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('No refresh token available for this sender. Please re-authorize.')}`);
    }
    
    // Refresh the access token
    const newTokens = await refreshAccessToken(sender.refresh_token);
    
    if (!newTokens || !newTokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to refresh access token')}`);
    }
    
    // Update tokens in database
    await updateSenderTokens(senderId, {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || sender.refresh_token, // Keep old refresh token if no new one
    });
    
    // Redirect back to accounts page with success message
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?success=true&message=${encodeURIComponent('Authorization refreshed successfully')}`);
  } catch (error) {
    console.error('Error refreshing Gmail OAuth token:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to refresh authorization')}`);
  }
}