import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Security headers based on OWASP recommendations
export const securityHeaders = {
  // Prevents the browser from attempting to guess the type of content
  'X-Content-Type-Options': 'nosniff',
  
  // Controls how much information the browser includes when navigating
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Helps prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Controls iframe embedding
  'X-Frame-Options': 'DENY',
  
  // Prevents browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  
  // Content Security Policy
  'Content-Security-Policy': generateCSP(),
};

// Helper to generate CSP string
function generateCSP() {
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  // Consider tightening this in production
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https://*'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'connect-src': ["'self'", 'https://api.supabase.io', 'https://*.vercel.app'],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  // Convert directives object to CSP string
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

// Apply security headers to a response
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Middleware function to apply security headers
export function securityMiddleware(request: NextRequest) {
  // Get the response from the next middleware or route handler
  const response = NextResponse.next();
  
  // Apply security headers
  return applySecurityHeaders(response);
}