"use server";

import { NextRequest, NextResponse } from 'next/server';
import getLogger from './logger';

// Create a local loggerPromise to avoid multiple instances
const loggerPromise = getLogger();

// Helper function to get logger instance
async function getLoggerInstance() {
  return await loggerPromise;
}

/**
 * Security headers to help protect against common web vulnerabilities
 */
const _securityHeaders = {
  'X-DNS-Prefetch-Control': 'on',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Content-Security-Policy is application-specific and should be carefully configured
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://*.vercel-insights.com;
    style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    img-src 'self' blob: data: https://*.amazonaws.com;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://*.vercel-insights.com https://*.sentry.io;
    frame-ancestors 'self';
  `.replace(/\s+/g, ' ').trim(),
};

/**
 * Get security headers
 * @returns Object with security headers
 */
export async function getSecurityHeaders() {
  return _securityHeaders;
}

/**
 * Apply security headers to a response
 * @param response The NextResponse object
 * @returns NextResponse with security headers
 */
export async function applySecurityHeaders(response: NextResponse): Promise<NextResponse> {
  const headers = await getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/**
 * Validates and sanitizes input data to prevent common injection attacks
 * @param data Input data (string or object)
 * @returns Sanitized data
 */
export async function sanitizeInput(data: any): Promise<any> {
  if (typeof data === 'string') {
    // Basic XSS protection by removing potentially dangerous HTML
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } else if (data && typeof data === 'object') {
    // Recursively sanitize objects
    const sanitized: any = Array.isArray(data) ? [] : {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = await sanitizeInput(data[key]);
      }
    }
    return sanitized;
  }
  return data;
}

/**
 * Validates a token against CSRF attacks
 * @param request The incoming request
 * @param csrfToken The CSRF token to validate
 * @returns Boolean indicating if the token is valid
 */
export async function validateCsrfToken(request: NextRequest, csrfToken: string): Promise<boolean> {
  try {
    // This would typically call your CSRF validation logic
    // For example: return await csrfProtection.validate(request, csrfToken);
    
    // Implementation depends on your CSRF approach
    const storedToken = request.cookies.get('csrf_token')?.value;
    
    if (!storedToken || !csrfToken) {
      const logger = await getLoggerInstance();
      await logger.warn('Missing CSRF token in request', 'security');
      return false;
    }
    
    // Use a timing-safe comparison to prevent timing attacks
    const crypto = require('crypto');
    return crypto.timingSafeEqual(
      Buffer.from(storedToken),
      Buffer.from(csrfToken)
    );
  } catch (error: unknown) {
    const logger = await getLoggerInstance();
    await logger.error('CSRF validation failed', error instanceof Error ? error : String(error), 'security');
    return false;
  }
}

/**
 * Rate limiting function to prevent abuse
 * @param ip Client IP address
 * @param endpoint API endpoint being accessed
 * @returns Boolean indicating if the request should proceed
 */
export async function checkRateLimit(ip: string, endpoint: string): Promise<boolean> {
  // This should use your full rate limiting implementation
  // For now, return true to allow the request
  return true;
}

/**
 * Detects potential security threats in a request
 * @param request The incoming request
 * @returns Boolean indicating if a threat was detected
 */
export async function detectSecurityThreats(request: NextRequest): Promise<boolean> {
  const url = request.nextUrl.toString();
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  
  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /exec(\s|\+)+(s|x)p\w+/i,
  ];
  
  // Check for path traversal attempts
  const pathTraversalPatterns = [
    /(\.\.\/)/i,
    /(\.\.\\)/i,
    /(%2e%2e%2f)/i,
  ];
  
  // Check for suspicious user agents
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nessus/i,
    /nmap/i,
    /masscan/i,
    /zollard/i,
  ];
  
  // Perform the checks
  if (sqlInjectionPatterns.some(pattern => pattern.test(url))) {
    await (await getLoggerInstance()).warn(`Potential SQL injection detected: ${url}`, 'security');
    return true;
  }
  
  if (pathTraversalPatterns.some(pattern => pattern.test(url))) {
    await (await getLoggerInstance()).warn(`Potential path traversal detected: ${url}`, 'security');
    return true;
  }
  
  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    await (await getLoggerInstance()).warn(`Suspicious user agent detected: ${userAgent}`, 'security');
    return true;
  }
  
  return false;
}

/**
 * Validates the current user session
 * @returns Boolean or session object indicating if the session is valid
 */
export async function validateSession() {
  // This would connect to your auth provider to validate the session
  // For now, return a mock session to allow development
  return {
    user: {
      id: 'mock-user-id',
      email: 'user@example.com',
      role: 'admin'
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
}