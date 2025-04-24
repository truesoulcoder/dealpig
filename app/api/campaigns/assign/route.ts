import { NextRequest, NextResponse } from 'next/server';
import { assignLeadsToCampaignSenders } from '@/lib/leadAssignmentService';
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

    // Parse request body
    const data = await request.json();
    const { campaignId, leadIds } = data;

    if (!campaignId || !leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Assign leads to senders
    const result = await assignLeadsToCampaignSenders(campaignId, leadIds);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error assigning leads:', error);
    return NextResponse.json(
      { success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}