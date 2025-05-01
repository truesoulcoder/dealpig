import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers'; // Keep for reading initial cookies if needed, but response modification is key
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  console.log(`[Auth Callback] Received request. Code: ${code ? 'present' : 'missing'}, Origin: ${origin}, Next: ${next}`);

  if (code) {
    // Prepare potential response objects early
    const redirectUrl = `${origin}${next}`;
    const errorRedirectUrl = `${origin}/auth/auth-code-error`;
    let response = NextResponse.redirect(redirectUrl); // Assume success initially

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            // Read from the incoming request cookies
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            // Set cookies on the outgoing response object
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            // Set cookies on the outgoing response object
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    console.log('[Auth Callback] Exchanging code for session...');
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log(`[Auth Callback] Code exchange successful. Redirecting to: ${redirectUrl}`);
      // The response object (already set for success redirect) will be returned
    } else {
      console.error('[Auth Callback] Error exchanging code for session:', error.message);
      // Change the response to redirect to the error page
      const url = new URL(errorRedirectUrl);
      url.searchParams.set('error', 'exchange_failed');
      url.searchParams.set('error_description', error.message);
      response = NextResponse.redirect(url);
    }
    // Return the response object, which contains the redirect AND the Set-Cookie headers
    return response;

  } else {
    // Handle case where code is missing
    console.error('[Auth Callback] No code found in request query parameters.');
    const errorParam = searchParams.get('error');
    const errorDescParam = searchParams.get('error_description');
    const url = new URL(`${origin}/auth/auth-code-error`);
    url.searchParams.set('error', errorParam || 'missing_code');
    url.searchParams.set('error_description', errorDescParam || 'Authorization code not found in callback URL.');
    return NextResponse.redirect(url);
  }
}