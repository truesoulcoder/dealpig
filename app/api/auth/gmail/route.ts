import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail';
import { createSender } from '@/lib/database';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get sender details from query params
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const title = searchParams.get('title');
    const dailyQuota = searchParams.get('dailyQuota') ?? '100';
    
    console.log(`Starting Gmail OAuth flow for: ${name} <${email}>`);
    
    // Validate required parameters
    if (!email || !name) {
      return NextResponse.json(
        { error: 'Email and name are required' },
        { status: 400 }
      );
    }
    
    // Get current user ID from cookie - await the cookies() function
    const cookieStore = await cookies();
    const userId = cookieStore.get('user-id')?.value;
    
    // In production, cookies might not be working as expected
    // If no user ID is found, use a default user ID for now
    const effectiveUserId = userId || process.env.DEFAULT_ADMIN_USER_ID || '00000000-0000-0000-0000-000000000000';
    
    if (!userId) {
      console.warn('No user ID found in cookies, using default user:', effectiveUserId);
    }
    
    console.log(`Creating sender record for user ID: ${userId}`);
    
    // Create the sender in the database
    let senderId;
    try {
      senderId = await createSender({
        name,
        email,
        title: title || undefined,
        daily_quota: parseInt(dailyQuota),
      });
    } catch (dbError) {
      console.error('Error creating sender in database:', dbError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Failed to create sender record')}`);
    }
    
    console.log(`Sender created with ID: ${senderId}`);
    
    // Get OAuth URL and redirect to Google consent screen
    let authUrl;
    try {
      // Pass the sender ID as state parameter in OAuth URL
      authUrl = getAuthUrl(senderId);
      console.log(`Redirecting to Google OAuth: ${authUrl}`);
    } catch (oauthError) {
      console.error('Error generating Google OAuth URL:', oauthError);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Failed to connect to Google OAuth: ' + (oauthError instanceof Error ? oauthError.message : String(oauthError)))}`);
    }
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error details:', errorMessage);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Failed to initiate Gmail authentication')}`);
  }
}