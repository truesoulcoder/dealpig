import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for rate limiting
// Note: This will be reset when the server restarts
// For production with multiple instances/servers, consider a different approach like Redis
interface RateLimit {
  count: number;
  resetTime: number;
}

type RateLimitStore = {
  [key: string]: RateLimit
};

// Stores for different types of limiters
const standardStore: RateLimitStore = {};
const authStore: RateLimitStore = {};
const apiStore: RateLimitStore = {};

// Helper function to get IP address from request
function getIP(request: NextRequest): string {
  // Try to get the real IP behind proxies
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    // Get the first IP if multiple are present (client, proxy1, proxy2, etc)
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  // Default to the direct connection IP or a placeholder if not available
  return request.ip || 'unknown';
}

// Generic rate limiting function
async function rateLimit(
  request: NextRequest, 
  store: RateLimitStore,
  { windowMs, limit }: { windowMs: number; limit: number }
): Promise<NextResponse | undefined> {
  const ip = getIP(request);
  const key = `${ip}:${request.nextUrl.pathname}`;
  const now = Date.now();
  
  // Initialize or get existing entry
  if (!store[key] || store[key].resetTime < now) {
    store[key] = { count: 0, resetTime: now + windowMs };
  }
  
  // Increment request count
  store[key].count += 1;
  
  // Calculate remaining requests and time to reset
  const remaining = Math.max(0, limit - store[key].count);
  const reset = Math.ceil((store[key].resetTime - now) / 1000); // in seconds
  
  // Set rate limit headers
  const headers = new Headers({
    'RateLimit-Limit': limit.toString(),
    'RateLimit-Remaining': remaining.toString(),
    'RateLimit-Reset': reset.toString()
  });
  
  // If limit exceeded, return error response
  if (store[key].count > limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429, 
        headers
      }
    );
  }
  
  // Otherwise, request is allowed
  return undefined;
}

// Predefined rate limiters for common use cases
export async function standardLimiter(req: NextRequest) {
  return rateLimit(req, standardStore, { 
    windowMs: 60 * 1000, // 1 minute
    limit: 60 // 60 requests per minute
  });
}

export async function authLimiter(req: NextRequest) {
  return rateLimit(req, authStore, { 
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10 // 10 requests per 15 minutes
  });
}

export async function apiLimiter(req: NextRequest) {
  return rateLimit(req, apiStore, { 
    windowMs: 60 * 1000, // 1 minute
    limit: 100 // 100 requests per minute
  });
}