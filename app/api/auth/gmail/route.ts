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
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Create the sender in the database
    const senderId = await createSender({
      name,
      email,
      title: title || undefined,
      daily_quota: parseInt(dailyQuota),
      user_id: userId,
    });
    
    // Store sender ID in session for the callback - use cookieStore after awaiting
    cookieStore.set('pending-sender-id', senderId, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 15, // 15 minutes
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    
    // Get OAuth URL and redirect to Google consent screen
    const authUrl = getAuthUrl();
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Gmail OAuth:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to initiate Gmail authentication')}`);
  }
}