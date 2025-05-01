import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth/callback', // Supabase auth callback
  '/favicon.ico',
  '/dealpig.svg',
  '/logo.png',
];

// Check if the path is public, an API route, or a static asset
function isPublicOrApiOrAsset(path: string) {
  if (publicPaths.includes(path)) return true;
  if (path.startsWith('/api/')) return true; // API routes handle their own auth or are public
  if (path.startsWith('/_next/')) return true; // Next.js internals
  if (path.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/i)) return true; // Static assets
  return false;
}


export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request and response cookies
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - important!
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl;

  // If it's not a public/api/asset path and there's no session, redirect to login
  if (!isPublicOrApiOrAsset(pathname) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Optionally add redirectTo query param if needed
    // url.search = `redirectTo=${encodeURIComponent(pathname)}`;
    console.log(`[Middleware] No session, redirecting to login from ${pathname}`);
    return NextResponse.redirect(url);
  }

  // If it's an auth page (like /login) and the user IS logged in, redirect to the app root
  if (['/login', '/register', '/forgot-password', '/reset-password'].includes(pathname) && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/'; // Redirect to home page or dashboard
    console.log(`[Middleware] Session found, redirecting from auth page ${pathname} to /`);
    return NextResponse.redirect(url);
  }

  // If we reach here, the user is either authenticated for a protected route,
  // or accessing a public/api/asset route. Allow the request and ensure the
  // session cookie is potentially refreshed in the response.
  return response
}

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