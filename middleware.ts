import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { csrfProtection } from "./lib/csrf";
import { authLimiter, apiLimiter, standardLimiter } from "./lib/rateLimit";
import { applySecurityHeaders } from "./lib/security";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    response = NextResponse.next();
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
