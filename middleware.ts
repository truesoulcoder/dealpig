import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { csrfProtection } from "./lib/csrf";
import { authLimiter, apiLimiter, standardLimiter } from "./lib/rateLimit";
import { applySecurityHeaders } from "./lib/security";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
