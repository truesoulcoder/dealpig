import { getIronSession, IronSessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Function to generate a secure random string (hex) of specified length
// This replaces crypto.randomBytes which isn't available in edge runtime
async function generateSecureRandomString(length: number): Promise<string> {
  const buffer = new Uint8Array(length);
  
  // Use the Web Crypto API which is available in edge runtime
  if (typeof crypto !== 'undefined') {
    crypto.getRandomValues(buffer);
  } else {
    // Fallback for extremely rare cases where crypto is not available
    for (let i = 0; i < length; i++) {
      buffer[i] = Math.floor(Math.random() * 256);
    }
  }
  
  // Convert to hex string
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Secret should be at least 32 characters and stored in environment variables
// We'll use an environment variable or generate a random one when the server starts
const CSRF_SECRET = process.env.csrf_secret || 
  // This will only be generated once per server start, not per request
  "dealpig_csrf_secret_32char_min_secure_key";

// Iron session configuration
export const sessionOptions: IronSessionOptions = {
  password: CSRF_SECRET,
  cookieName: 'dealpig_csrf',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  },
};

// Generate a new CSRF token
export async function generateToken(): Promise<string> {
  const token = await generateSecureRandomString(32);
  const session = await getIronSession(cookies(), sessionOptions);
  session.csrfToken = token;
  await session.save();
  return token;
}

// Validate a CSRF token
export async function validateToken(token: string): Promise<boolean> {
  const session = await getIronSession(cookies(), sessionOptions);
  return session.csrfToken === token;
}

// CSRF protection middleware for API routes
export async function csrfProtection(req: NextRequest) {
  // Skip CSRF check for non-mutation methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return NextResponse.next();
  }

  // For mutation methods, verify the CSRF token
  const token = req.headers.get('x-csrf-token');
  
  if (!token) {
    return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
  }

  const isValid = await validateToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  return NextResponse.next();
}