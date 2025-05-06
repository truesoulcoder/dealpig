import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define paths that don't require authentication
const publicPaths = [
  '/login',
  '/api/auth/callback',
  '/auth/auth-code-error', // Add error page to public paths
  '/favicon.ico',
  '/dealpig.svg',
  '/logo.png',
];

// Check if the path is public, an API route, or a static asset
function isPublicOrApiOrAsset(path: string) {
  if (publicPaths.includes(path)) return true;
  // Allow all API routes except the specific auth callback which is handled above
  if (path.startsWith('/api/') && path !== '/api/auth/callback') return true; 
  if (path.startsWith('/_next/')) return true; // Next.js internals
  if (path.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/i)) return true; // Static assets
  return false;
}

export async function middleware(request: NextRequest) {
  // Clone the request headers to avoid modifying the original headers object
  const requestHeaders = new Headers(request.headers);
  // Create a response object that will be modified and returned
  let response = NextResponse.next({
    request: {
      // Pass the cloned headers to the new request
      headers: requestHeaders,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Read cookies from the incoming request
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // Set cookies on the outgoing response
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Set cookies on the outgoing response
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Refresh session if expired - this will also read the session from cookies
  console.log('[Middleware] Attempting to get user...');
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error('[Middleware] Error getting user:', error?.message);
    // Allow request to proceed, maybe it's a public page or API route
    // Or handle specific errors if needed
  } else {
    console.log(`[Middleware] User status: ${user ? 'Authenticated' : 'None'}`);
  }

  const { pathname } = request.nextUrl;
  console.log(`[Middleware] Pathname: ${pathname}`);

  // If it's not a public/api/asset path and there's no user, redirect to login
  if (!isPublicOrApiOrAsset(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/api/auth'; // Redirect to our new Google OAuth initiation route
    // Optionally add redirectTo query param if needed to return to the original path after auth
    // For example, you could construct the redirectTo for signInWithOAuth to include the original pathname.
    // url.searchParams.set('redirectTo', pathname); // if /api/auth is set up to handle this
    console.log(`[Middleware] No user for protected route, redirecting to /api/auth from ${pathname}`);
    return NextResponse.redirect(url);
  }

  // If it's an auth page (like /login) and the user IS logged in, redirect to the app root
  if (['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname) && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/'; // Redirect to home page or dashboard
    console.log(`[Middleware] User found, redirecting from auth page ${pathname} to /`);
    return NextResponse.redirect(url);
  }

  // Enforce super-admin email allowlist
  if (user && user.email) {
    const allowedEmails = [
      'chrisphillips@truesoulpartners.com',
      'egoluxinvicta@gmail.com',
    ];
    if (!allowedEmails.includes(user.email)) {
      // Sign out the user and redirect to login with error
      const signOutUrl = new URL('/login', request.nextUrl.origin);
      signOutUrl.searchParams.set('error', 'Access denied: Only super admins may log in.');
      // Optionally, clear cookies or session here if needed
      return NextResponse.redirect(signOutUrl);
    }
  }

  // Allow the request to proceed, returning the potentially modified response (with refreshed cookies)
  console.log(`[Middleware] Allowing request for ${pathname}`);
  return response;
}

// Remove/disable registration and password reset routes from matcher.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /logo.png, /dealpig.svg (other static assets at root)
     * Modify this pattern to ensure it covers necessary paths but avoids unnecessary runs.
     */
    '/((?!_next/static|_next/image|favicon.ico|logo.png|dealpig.svg).*)',
  ],
}