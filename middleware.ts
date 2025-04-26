import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { csrfProtection } from "./lib/csrf";
import { authLimiter, apiLimiter, standardLimiter } from "./lib/rateLimit";
import { applySecurityHeaders } from "./lib/security";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// Verify environment variables on startup in production
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

// Only log in production to avoid cluttering development
if (process.env.NODE_ENV === 'production') {
  console.log('Checking environment variables...');
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`⚠️ Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ All required environment variables are set');
    // Log URL format without exposing full URL
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    console.log(`Supabase URL format check: ${url.startsWith('http') ? 'valid' : 'invalid'}`);
    console.log(`Supabase URL length: ${url.length}`);
  }
}

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`Missing Supabase client environment variables: URL: ${!!supabaseUrl}, ANON_KEY: ${!!supabaseAnonKey}`);
    }
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      },
    );

    return { supabase, response: supabaseResponse };
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return { 
      supabase: null, 
      response: NextResponse.next({
        request: {
          headers: request.headers,
        },
      }) 
    };
  }
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Initialize Supabase client for middleware
  const { supabase, response: supabaseResponse } = createClient(request);

  // Apply rate limiting based on the route
  let rateLimitResponse;
  
  if (pathname.startsWith("/api/auth")) {
    // Stricter rate limits for auth endpoints
    rateLimitResponse = await authLimiter(request);
  } else if (pathname.startsWith("/api/")) {
    // Standard API rate limits
    rateLimitResponse = await apiLimiter(request);
  } else if (!pathname.includes("_next") && !pathname.includes("static")) {
    // General rate limits for other routes
    rateLimitResponse = await standardLimiter(request);
  }

  // If rate limit is exceeded, return the response
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Apply CSRF protection to API routes
  if (pathname.startsWith("/api/") && pathname !== "/api/trpc" && pathname !== "/api/csrf") {
    const csrfResponse = await csrfProtection(request);
    if (csrfResponse.status !== 200) {
      return csrfResponse;
    }
  }

  // Handle authentication redirects 
  let response;
  if ((pathname === "/login" || pathname === "/register") && request.cookies.has("userAuth")) {
    response = NextResponse.redirect(new URL("/", request.url));
  } else if ((pathname === "/" || pathname === "/accounts") && !request.cookies.has("userAuth")) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else {
    response = supabaseResponse; // Use the Supabase-aware response
  }

  // Apply security headers to the response
  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
    "/api/:path*"
  ],
};
