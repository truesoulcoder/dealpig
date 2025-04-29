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
    
    if (!userId) {
      console.error('No user ID found in cookies');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    console.log(`Creating sender record for user ID: ${userId}`);
    
    // Create the sender in the database
    const senderId = await createSender({
      name,
      email,
      title: title || undefined,
      daily_quota: parseInt(dailyQuota),
      user_id: userId,
    });
    
    console.log(`Sender created with ID: ${senderId}`);
    
    // Store sender ID in session for the callback - use cookieStore after awaiting
    
    // Get OAuth URL and redirect to Google consent screen
    // Pass the sender ID as state parameter in OAuth URL
    const authUrl = getAuthUrl(senderId);
    console.log(`Redirecting to Google OAuth: ${authUrl}`);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/app/accounts?error=${encodeURIComponent('Failed to initiate Gmail authentication')}`);
  }
}