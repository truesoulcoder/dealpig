import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/auth/callback',
  '/favicon.ico',
  '/dealpig.svg',
  '/logo.png',
];

// Check if the path is a public path or starts with /api/
function isPublic(path: string) {
  if (publicPaths.includes(path)) return true;
  
  // Check if it's an API route (only checking auth for frontend routes)
  if (path.startsWith('/api/')) return true;
  
  // Check for static files
  if (path.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/i)) return true;
  
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }
  
  // Check if user is authenticated by looking for the access token
  const accessToken = request.cookies.get('sb-access-token');
  
  // If no token is found, redirect to login
  if (!accessToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `redirectTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

// Configure matcher to run middleware on specific paths
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (static files)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /dealpig.svg, etc. (static files at root)
     */
    '/((?!api|_next|_static|_vercel|favicon.ico).*)',
  ],
};