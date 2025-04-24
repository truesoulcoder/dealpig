import { NextRequest, NextResponse } from 'next/server';
import rateLimit from 'express-rate-limit';
import { IncomingMessage, ServerResponse } from 'http';

// In-memory store for rate limiting
// Note: For production with multiple servers, consider using Redis or another shared store
const limiters: Record<string, any> = {};

export function createRateLimiter(options: {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  message?: string; // Message to return when rate limit is exceeded
  path?: string; // Path for the rate limiter (to create different limiters for different routes)
}) {
  const {
    windowMs = 60 * 1000, // Default: 1 minute
    max = 60, // Default: 60 requests per minute
    message = 'Too many requests, please try again later.',
    path = 'default',
  } = options;

  // Create a limiter for this path if it doesn't exist
  if (!limiters[path]) {
    limiters[path] = rateLimit({
      windowMs,
      max,
      message,
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });
  }

  return limiters[path];
}

export async function rateLimiterMiddleware(
  req: NextRequest,
  options: {
    windowMs?: number;
    max?: number;
    message?: string;
    path?: string;
  } = {}
) {
  // Create the path-specific limiter
  const limiter = createRateLimiter({
    ...options,
    path: options.path || req.nextUrl.pathname,
  });

  // Adapt the NextRequest to express-like request and response objects
  const ip = req.ip || 'unknown';
  const method = req.method;
  const url = req.url;
  
  const mockReq = {
    ip,
    method,
    url,
    headers: Object.fromEntries(req.headers),
  } as IncomingMessage;
  
  let statusCode = 200;
  let responseHeaders = new Headers();
  let responseBody: any;
  
  const mockRes = {
    setHeader: (name: string, value: string) => {
      responseHeaders.set(name, value);
      return mockRes;
    },
    status: (code: number) => {
      statusCode = code;
      return mockRes;
    },
    send: (body: any) => {
      responseBody = body;
    },
    end: () => {},
  } as unknown as ServerResponse;
  
  // Apply the rate limiter
  return new Promise<NextResponse | undefined>((resolve) => {
    limiter(mockReq, mockRes, () => {
      // If the rate limiter calls next(), the request is allowed
      resolve(undefined);
    });
    
    // If the rate limiter doesn't call next(), it set a status code
    if (statusCode !== 200) {
      resolve(
        NextResponse.json(
          { error: responseBody || 'Rate limit exceeded' },
          { 
            status: statusCode,
            headers: responseHeaders,
          }
        )
      );
    }
  });
}

// Predefined rate limiters for common use cases
export const standardLimiter = (req: NextRequest) => 
  rateLimiterMiddleware(req, { 
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
  });

export const authLimiter = (req: NextRequest) => 
  rateLimiterMiddleware(req, { 
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per 15 minutes
    path: 'auth',
  });

export const apiLimiter = (req: NextRequest) => 
  rateLimiterMiddleware(req, { 
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    path: 'api',
  });