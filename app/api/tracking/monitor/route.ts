import { NextRequest, NextResponse } from 'next/server';
import { monitorEmailResponses } from '@/lib/gmailMonitor';
import { rateLimit } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';

// Rate limiter for email monitoring
const limiter = rateLimit({
  uniqueTokenPerInterval: 2,
  interval: 60 * 1000 * 15, // 15 minutes
});

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

    // Apply rate limiting - only allow 1 request every 15 minutes
    try {
      await limiter.check(1, 'email-monitor');
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
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