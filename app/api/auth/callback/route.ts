import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createAuthCookie } from '@/actions/auth.action';
import logger from '@/lib/logger';

/**
 * Handler for OAuth callback from Google
 * This endpoint processes the OAuth response and establishes the user session
 */
export async function GET(request: NextRequest) {
  try {
    // Get the callback URL parameters
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const error = requestUrl.searchParams.get('error');
    
    if (error) {
      logger.error('OAuth callback error', error, 'auth');
      // Redirect to login page with error
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Authentication failed')}`
      );
    }
    
    if (!code) {
      logger.error('No code in OAuth callback', null, 'auth');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Missing authentication code')}`
      );
    }
    
    // Initialize Supabase client
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: any) {
            cookieStore.delete(name, options);
          },
        },
      }
    );
    
    // Exchange the code for a session
    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError || !data.session) {
      logger.error('Failed to exchange code for session', sessionError, 'auth');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Authentication failed')}`
      );
    }
    
    // Set up the cookie using our existing function
    await createAuthCookie(data.session);
    
    // Check if it's a new user
    const isNewUser = data.user?.app_metadata?.provider === 'google' && 
                      data.user?.created_at === data.user?.last_sign_in_at;
    
    if (isNewUser) {
      // For new Google users, create a profile record if it doesn't exist
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
          email: data.user.email || '',
          avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || '',
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        logger.error('Error creating profile for new Google user', profileError, 'auth');
        // Continue anyway, as authentication was successful
      }
    }
    
    // Redirect to the main application
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);
    
  } catch (error) {
    logger.error('Unexpected error in OAuth callback handler', error, 'auth');
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login?error=${encodeURIComponent('Authentication error')}`
    );
  }
}