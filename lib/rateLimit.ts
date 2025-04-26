import { NextRequest, NextResponse } from 'next/server';
import * as logger from './logger';

interface RateLimitConfig {
  maxRequests: number;      // Maximum requests allowed during the window
  windowMs: number;         // Time window in milliseconds
  keyGenerator?: (req: NextRequest) => Promise<string>; // Function to generate rate limit key (made async)
  skipIfUnauthorized?: boolean; // Skip rate limiting if unauthorized
  statusCode?: number;      // Status code to return when rate limited
  message?: string;         // Message to return when rate limited
}

// Service-specific rate limit configurations
const SERVICE_CONFIGS: Record<string, RateLimitConfig> = {
  default: {
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    statusCode: 429,
    message: 'Too many requests, please try again later'
  },
  gmail: {
    maxRequests: parseInt(process.env.RATE_LIMIT_GMAIL_API_MAX || '50'),
    windowMs: parseInt(process.env.RATE_LIMIT_GMAIL_API_WINDOW_MS || '120000'), // 2 minutes
    statusCode: 429,
    message: 'Gmail API rate limit exceeded, please try again later'
  },
  webhook: {
    maxRequests: 200,
    windowMs: 60000, // 1 minute
    statusCode: 429,
    message: 'Webhook rate limit exceeded, please try again later'
  }
};

// In-memory storage for rate limiting
// Should be replaced with Redis or similar for multi-instance deployments
const hitStore: Record<string, { count: number; resetAt: number }> = {};

// In-memory storage for backoff tracking
const backoffStore: Record<string, { attempts: number; nextAttemptTime: number }> = {};

// Default rate limit config - can be overridden
const DEFAULT_CONFIG: RateLimitConfig = SERVICE_CONFIGS.default;

/**
 * Clean up expired rate limit entries
 * Run this periodically to avoid memory leaks
 */
async function cleanupRateLimitStore(): Promise<void> {
  const now = Date.now();
  
  for (const key in hitStore) {
    if (hitStore[key].resetAt <= now) {
      delete hitStore[key];
    }
  }
  
  for (const key in backoffStore) {
    if (backoffStore[key].nextAttemptTime <= now) {
      delete backoffStore[key];
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(async () => {
    await cleanupRateLimitStore();
  }, 5 * 60 * 1000);
}

/**
 * Default key generator function uses IP address as rate limit key
 */
async function defaultKeyGenerator(req: NextRequest): Promise<string> {
  // Try to get real IP address from various headers
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')?.[0] ||
    req.headers.get('x-real-ip') ||
    req.nextUrl.hostname ||
    'unknown-ip';
  
  const url = req.nextUrl.pathname;
  return `${ip}:${url}`;
}

/**
 * Rate limiting middleware for Next.js API routes
 * @param config Rate limit configuration options or service name
 * @returns A middleware handler function
 */
export async function rateLimit(config: Partial<RateLimitConfig> | string = {}): Promise<(req: NextRequest) => Promise<NextResponse | null>> {
  // Handle string service name
  let options: RateLimitConfig;
  if (typeof config === 'string') {
    options = { ...SERVICE_CONFIGS[config] || DEFAULT_CONFIG };
  } else {
    // Combine default config with provided config
    options = { ...DEFAULT_CONFIG, ...config };
  }
  
  const keyGeneratorFn = options.keyGenerator || defaultKeyGenerator;
  
  return async function rateLimitMiddleware(req: NextRequest): Promise<NextResponse | null> {
    try {
      // Skip rate limiting for non-production environments if desired
      if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DEV_RATE_LIMIT !== 'true') {
        return null;
      }
      
      // Skip if unauthorized and skipIfUnauthorized is true
      if (options.skipIfUnauthorized && !req.cookies.has('userAuth')) {
        return null;
      }
      
      // Generate rate limit key
      const key = await keyGeneratorFn(req);
      const now = Date.now();
      
      // Get current hit count or initialize
      const hitRecord = hitStore[key] || { count: 0, resetAt: now + options.windowMs };
      
      // Reset if window has expired
      if (hitRecord.resetAt <= now) {
        hitRecord.count = 1;
        hitRecord.resetAt = now + options.windowMs;
      } else {
        // Increment hit count
        hitRecord.count++;
      }
      
      // Store updated record
      hitStore[key] = hitRecord;
      
      // Check if rate limit exceeded
      if (hitRecord.count > options.maxRequests) {
        // Log rate limit hit
        await logger.warn(`Rate limit exceeded for ${key}`, 'rateLimit', {
          key,
          count: hitRecord.count,
          limit: options.maxRequests,
          resetsIn: Math.ceil((hitRecord.resetAt - now) / 1000)
        });
        
        // Return rate limit response
        return NextResponse.json(
          { error: options.message },
          { 
            status: options.statusCode,
            headers: {
              'Retry-After': Math.ceil((hitRecord.resetAt - now) / 1000).toString(),
              'X-RateLimit-Limit': options.maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': Math.ceil(hitRecord.resetAt / 1000).toString()
            }
          }
        );
      }
      
      // Not rate limited, add rate limit headers and continue
      const originalResponse = null; // Let Next.js continue processing
      
      // We're returning null to allow the request to continue in middleware
      return originalResponse;
    } catch (err) {
      // Log error but don't block requests on rate limit failure
      await logger.error('Rate limit error', err as Error, 'rateLimit');
      return null;
    }
  };
}

// Create API limiter functions - converted from exported variables to functions
export async function apiLimiter(req: NextRequest): Promise<NextResponse | null> {
  const limiterFn = await rateLimit();
  return limiterFn(req);
}

export async function gmailApiLimiter(req: NextRequest): Promise<NextResponse | null> {
  const limiterFn = await rateLimit('gmail');
  return limiterFn(req);
}

export async function webhookLimiter(req: NextRequest): Promise<NextResponse | null> {
  const limiterFn = await rateLimit('webhook');
  return limiterFn(req);
}

/**
 * Check if a specific operation is rate limited without blocking
 * Useful for checking rate limits in server components or actions
 */
export async function isRateLimited(key: string, config: Partial<RateLimitConfig> = {}): Promise<boolean> {
  try {
    const options: RateLimitConfig = {
      ...DEFAULT_CONFIG,
      ...config
    };
    
    const now = Date.now();
    const hitRecord = hitStore[key] || { count: 0, resetAt: now + options.windowMs };
    
    // Reset if window has expired
    if (hitRecord.resetAt <= now) {
      hitRecord.count = 1;
      hitRecord.resetAt = now + options.windowMs;
      hitStore[key] = hitRecord;
      return false;
    }
    
    // Check if rate limit exceeded
    if (hitRecord.count >= options.maxRequests) {
      return true;
    }
    
    // Increment and store
    hitRecord.count++;
    hitStore[key] = hitRecord;
    return false;
  } catch (err) {
    await logger.error('Rate limit check error', err as Error, 'rateLimit');
    return false; // Fail open to avoid blocking legitimate requests
  }
}

/**
 * Implements exponential backoff for retrying failed API calls
 * @param key Unique identifier for the operation being retried
 * @param maxAttempts Maximum number of retry attempts
 * @returns Object with information about current backoff state
 */
export async function getBackoffDelay(key: string, maxAttempts = 5): Promise<{
  shouldRetry: boolean;
  delayMs: number;
  attempts: number;
}> {
  const now = Date.now();
  const backoffRecord = backoffStore[key] || { attempts: 0, nextAttemptTime: 0 };
  
  // If we've exceeded max attempts, don't retry
  if (backoffRecord.attempts >= maxAttempts) {
    return {
      shouldRetry: false,
      delayMs: 0,
      attempts: backoffRecord.attempts
    };
  }
  
  // If we're still in backoff period, return remaining time
  if (backoffRecord.nextAttemptTime > now) {
    return {
      shouldRetry: true,
      delayMs: backoffRecord.nextAttemptTime - now,
      attempts: backoffRecord.attempts
    };
  }
  
  // Calculate delay using exponential backoff with jitter
  // Base: 100ms, Max: ~3 minutes
  const baseDelayMs = 100;
  const attemptCount = backoffRecord.attempts + 1;
  let delayMs = Math.min(baseDelayMs * Math.pow(2, attemptCount), 180000);
  
  // Add jitter (±30%) to prevent thundering herd
  const jitterFactor = 0.7 + (Math.random() * 0.6); // Between 0.7 and 1.3
  delayMs = Math.floor(delayMs * jitterFactor);
  
  // Update backoff record
  backoffStore[key] = {
    attempts: attemptCount,
    nextAttemptTime: now + delayMs
  };
  
  return {
    shouldRetry: true,
    delayMs,
    attempts: attemptCount
  };
}

/**
 * Reset backoff counter after successful operation
 */
export async function resetBackoff(key: string): Promise<void> {
  delete backoffStore[key];
}

/**
 * Utility to retry an async operation with exponential backoff
 * @param operation Function to retry
 * @param key Unique identifier for this operation
 * @param maxAttempts Maximum number of retry attempts
 * @returns Result of the operation
 */
export async function withBackoff<T>(
  operation: () => Promise<T>,
  key: string,
  maxAttempts = 5
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();
      await resetBackoff(key); // Reset backoff after success
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      await logger.warn(
        `Operation '${key}' failed (attempt ${attempt}/${maxAttempts})`, 
        'backoff',
        { error: lastError.message }
      );
      
      if (attempt < maxAttempts) {
        const { delayMs } = await getBackoffDelay(key, maxAttempts);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // If we get here, all attempts failed
  throw lastError || new Error(`All ${maxAttempts} attempts failed for operation '${key}'`);
}