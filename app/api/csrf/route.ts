import { generateToken } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';

// API route to generate and provide a CSRF token
export async function GET(request: NextRequest) {
  try {
    const token = await generateToken();
    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}