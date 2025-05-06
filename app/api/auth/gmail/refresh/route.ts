import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/gmail';
import { getSenderById, updateSenderTokens } from '@/lib/database';
import { cookies } from 'next/headers';
import { requireSuperAdmin } from '@/lib/api-guard';

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
  } catch (error: any) {
    if (error.message === 'Unauthorized: User not authenticated') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Unauthorized access')}`, { status: 401 });
    } else if (error.message === 'Forbidden: Not a super admin') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Forbidden access')}`, { status: 403 });
    }
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Access denied')}`, { status: 403 });
  }
  try {
    const searchParams = request.nextUrl.searchParams;
    const senderId = searchParams.get('sender_id');
    if (!senderId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Missing sender ID')}`);
    }
    const sender = await getSenderById(senderId);
    if (!sender) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Sender not found')}`);
    }
    if (!sender.refresh_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('No refresh token available for this sender. Please re-authorize.')}`);
    }
    const newTokens = await refreshAccessToken(sender.refresh_token);
    if (!newTokens || !newTokens.access_token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to refresh access token')}`);
    }
    await updateSenderTokens(senderId, {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || sender.refresh_token,
    });
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?success=true&message=${encodeURIComponent('Authorization refreshed successfully')}`);
  } catch (error: any) {
    console.error('Error refreshing Gmail OAuth token:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/app/accounts?error=${encodeURIComponent('Failed to refresh authorization')}`);
  }
}