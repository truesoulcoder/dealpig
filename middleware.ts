import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { csrfProtection } from '@/lib/csrf';

// Helper function to create Supabase client
export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      return { supabase: null, response };
    }
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Set cookie in request
            request.cookies.set({
              name: name,
              value: value,
              ...options,
            });
            
            // Create new response
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            
            // Set cookie in response
            response.cookies.set({
              name: name,
              value: value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            // Remove cookie from request
            request.cookies.delete({
              name: name,
              ...options,
            });
            
            // Create new response
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            
            // Remove cookie from response
            response.cookies.delete({
              name: name,
              ...options,
            });
          },
        }
      }
    );

    return { supabase, response };
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return { supabase: null, response };
  }
};

// The middleware function that Next.js will call
export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Initialize Supabase client for middleware
  const { response } = createClient(request);

  // Handle authentication redirects with simplified logic
  if ((pathname === "/login" || pathname === "/register") && request.cookies.has("userAuth")) {
    return NextResponse.redirect(new URL("/", request.url));
  } 
  
  if ((pathname === "/" || pathname === "/accounts") && !request.cookies.has("userAuth")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  // CSRF protection for API routes
  if (pathname.startsWith('/api/') && 
      !pathname.startsWith('/api/auth/') && 
      !pathname.startsWith('/api/webhooks/') && 
      !pathname.startsWith('/api/tracking/') &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    
    // Apply CSRF protection to mutation requests
    return csrfProtection(request);
  }
  
  return response;
}

// Keep the config export
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
    "/api/:path*"
  ],
};
