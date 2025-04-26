import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Simplified middleware to fix "No fetch event listeners found" error

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
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set(name, value, options) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            request.cookies.delete({
              name,
              ...options,
            });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.delete({
              name,
              ...options,
            });
          },
        },
      }
    );

    return { supabase, response };
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return { supabase: null, response };
  }
};

export async function middleware(request: NextRequest) {
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
  
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)",
    "/api/:path*"
  ],
};
