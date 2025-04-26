import { NextRequest, NextResponse } from 'next/server';
import { getGmailAuthUrl } from '@/actions/auth.action';

export async function GET(request: NextRequest) {
  try {
    // Get sender ID from query parameters
    const senderId = request.nextUrl.searchParams.get('sender_id');
    
    if (!senderId) {
      return NextResponse.redirect('/accounts?error=Missing_sender_id');
    }
    
    // Generate a new Gmail OAuth URL for the existing sender
    const authUrl = await getGmailAuthUrl(senderId);
    
    // Redirect to Gmail authorization flow
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error refreshing Gmail authorization:', error);
    return NextResponse.redirect('/accounts?error=Failed_to_refresh_authorization');
  }
}