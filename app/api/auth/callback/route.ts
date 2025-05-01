import { createServerRouteHandlerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Import helper functions if they are needed and don't create their own clients
// import { ensureProfile } from '@/actions/auth.action'; 

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  console.log('[Callback Route] Received request. Code:', code, 'Error:', error);

  if (error) {
    console.error('[Callback Route] OAuth Error:', error, 'Description:', errorDescription);
    // Redirect to an error page showing the error
    return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?error=${error}&error_description=${errorDescription || 'Unknown error'}`);
  }

  if (code) {
    console.log('[Callback Route] Auth code received. Exchanging for session...');
    const cookieStore = cookies();
    const supabase = createServerRouteHandlerClient({ cookies: () => cookieStore }); // Use route handler client

    try {
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        console.error('[Callback Route] Error exchanging code for session:', exchangeError);
        // Redirect to an error page
        return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?error=exchange_failed&error_description=${exchangeError.message}`);
      }

      console.log('[Callback Route] Session exchanged successfully. User:', data.user?.id);

      // Session is now stored in cookies by createServerRouteHandlerClient
      // Optionally, ensure profile exists here if needed, passing the client
      // if (data.session) {
      //   await ensureProfile(data.session.user.id, {
      //     email: data.session.user.email,
      //     full_name: data.session.user.user_metadata?.full_name || data.session.user.user_metadata?.name,
      //   }, supabase); // Pass the client if ensureProfile expects it
      // }


      // Redirect to the home page or intended destination after login
      console.log('[Callback Route] Redirecting to /');
      return NextResponse.redirect(requestUrl.origin); // Redirect to home page

    } catch (catchError: any) {
       console.error('[Callback Route] Unexpected error during code exchange:', catchError);
       return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?error=unexpected_error&error_description=${catchError.message}`);
    }
  } else {
     console.warn('[Callback Route] No code or error received.');
     // Redirect to an error page if no code is present without an error
     return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error?error=missing_code&error_description=Authorization code not found in callback request.`);
  }
}