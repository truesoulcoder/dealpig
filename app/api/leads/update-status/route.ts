import { NextResponse } from 'next/server';
import { updateLead } from '@/lib/database';

export async function POST(request: Request) {
  try {
    const { leadId, status } = await request.json();

    if (!leadId || !status) {
      return NextResponse.json(
        { error: 'Lead ID and status are required' },
        { status: 400 }
      );
    }

    const updatedLead = await updateLead(leadId, { status });

    if (!updatedLead) {
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error) {
    console.error('Error updating lead status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}