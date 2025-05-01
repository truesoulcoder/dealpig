import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'; // Default redirect to '/'

  console.log(`[Auth Callback] Received request. Code: ${code ? 'present' : 'missing'}, Origin: ${origin}, Next: ${next}`);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    console.log('[Auth Callback] Exchanging code for session...');
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectUrl = `${origin}${next}`;
      console.log(`[Auth Callback] Code exchange successful. Redirecting to: ${redirectUrl}`);
      // Redirect to the specified path or default to root
      return NextResponse.redirect(redirectUrl);
    } else {
      // Log the specific error during code exchange
      console.error('[Auth Callback] Error exchanging code for session:', error.message);
      // Redirect to error page if code exchange fails
      return NextResponse.redirect(`${origin}/auth/auth-code-error?error=exchange_failed&error_description=${encodeURIComponent(error.message)}`);
    }
  } else {
    // Log if no code is present in the request
    console.error('[Auth Callback] No code found in request query parameters.');
    const errorParam = searchParams.get('error');
    const errorDescParam = searchParams.get('error_description');
    // Redirect to error page if code is missing or other OAuth error occurred
    return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${errorParam || 'missing_code'}&error_description=${encodeURIComponent(errorDescParam || 'Authorization code not found in callback URL.')}`);
  }
}