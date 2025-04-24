import { NextRequest, NextResponse } from 'next/server';
import { processCampaigns } from '@/lib/campaignScheduler';
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