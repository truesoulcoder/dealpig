import { NextRequest, NextResponse } from 'next/server';
import { processCampaigns } from '@/lib/campaignScheduler';
import { rateLimit } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth';

// Define a rate limiter specifically for campaign processing
const limiter = rateLimit({
  uniqueTokenPerInterval: 1, // Only 1 unique token per interval
  interval: 60 * 1000, // 1 minute
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

    // Apply rate limiting - only allow 1 request per minute
    try {
      await limiter.check(1, 'campaign-processor'); // 1 request per minute
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Process campaigns
    const result = await processCampaigns();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error processing campaigns:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}