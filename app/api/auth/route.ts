import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic'; // Ensure dynamic behavior

export async function GET(request: NextRequest) {
  const supabase = createServerClient();

  const { searchParams } = new URL(request.url);
  // Determine the redirect URL for after the *entire* OAuth flow completes successfully
  // This is different from NEXT_PUBLIC_AUTH_CALLBACK_URL, which is where Google sends the user back *to our app*.
  let postAuthRedirectTo = searchParams.get('next') || process.env.NEXT_PUBLIC_AUTH_REDIRECT_TO || '/';
  if (!postAuthRedirectTo.startsWith('http')) {
    const host = request.headers.get('host') || 'localhost:3000'; // Fallback for safety
    const protocol = host.includes('localhost') ? 'http' : 'https';
    // Ensure it's a full URL for the 'redirectTo' option if it's a path
    postAuthRedirectTo = `${protocol}://${host}${postAuthRedirectTo.startsWith('/') ? '' : '/'}${postAuthRedirectTo}`;
  }

  const callbackUrl = process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL;
  if (!callbackUrl) {
    console.error('[API Auth GET] Misconfiguration: NEXT_PUBLIC_AUTH_CALLBACK_URL is not set.');
    return NextResponse.redirect(new URL('/auth/error?message=Server misconfiguration: Missing callback URL', request.url));
  }

  console.log('[API Auth GET] Attempting Google OAuth sign-in...');
  console.log(`[API Auth GET] Using OAuth Callback URL (where Google redirects back to us): ${callbackUrl}`);
  console.log(`[API Auth GET] Final redirect after successful auth (postAuthRedirectTo): ${postAuthRedirectTo}`);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl, // This is where Google sends the user after they authenticate with Google.
      // Supabase internally uses this plus the 'next' param from cookie/storage for final redirect if PKCE is used.
      // We can also pass queryParams if needed, e.g., for prompt: 'consent'
      // queryParams: { access_type: 'offline', prompt: 'consent' }
    },
  });

  if (error) {
    console.error('[API Auth GET] Error during Google OAuth sign-in initiation:', error);
    return NextResponse.redirect(new URL(`/auth/error?message=${encodeURIComponent(error.message)}&code=${error.code || ''}`, request.url));
  }

  if (data.url) {
    // This URL is the one Supabase/Google provides for the user to start the OAuth dance.
    // It includes the necessary PKCE challenges etc.
    // Supabase will set its cookies (like the PKCE verifier) on this redirect.
    console.log(`[API Auth GET] Redirecting to external OAuth provider URL: ${data.url}`);
    return NextResponse.redirect(data.url);
  }

  console.error('[API Auth GET] No URL returned from Supabase OAuth initiation.');
  return NextResponse.redirect(new URL('/auth/error?message=OAuth initiation failed: No provider URL', request.url));
}
