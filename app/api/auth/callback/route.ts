import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Error exchanging code for session:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Store session in cookies
    const { session } = data;
    
    if (session) {
      const cookieStore = await cookies();
      
      cookieStore.set({
        name: 'sb-access-token',
        value: session.access_token,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      cookieStore.set({
        name: 'sb-refresh-token',
        value: session.refresh_token,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      
      // Set user ID in a non-HTTP-only cookie for client-side access
      cookieStore.set({
        name: 'user-id',
        value: session.user.id,
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in auth callback:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 