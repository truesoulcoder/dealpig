import { NextRequest, NextResponse } from 'next/server';
import { monitorEmailResponses } from '@/lib/gmailMonitor';
import { apiLimiter } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const rateLimitResult = await apiLimiter(request);
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    // Process emails
    const result = await monitorEmailResponses();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error monitoring emails:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}