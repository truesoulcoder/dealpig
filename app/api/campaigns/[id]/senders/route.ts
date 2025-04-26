import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateSession } from "@/lib/security";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate user session
    const session = await validateSession();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get campaign ID from params
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { message: "Campaign ID is required" },
        { status: 400 }
      );
    }

    // Get all senders assigned to the campaign
    const { data: campaignSenders, error: campaignSendersError } = await supabaseAdmin
      .from("campaign_senders")
      .select("sender_id, verified, test_sent, test_sent_at")
      .eq("campaign_id", id);

    if (campaignSendersError) {
      console.error("Error fetching campaign senders:", campaignSendersError);
      return NextResponse.json(
        { message: "Failed to fetch campaign senders" },
        { status: 500 }
      );
    }

    // Get sender details for each assigned sender
    const senderIds = campaignSenders.map(cs => cs.sender_id);
    
    if (senderIds.length === 0) {
      return NextResponse.json({ senders: [] }, { status: 200 });
    }

    const { data: sendersData, error: sendersError } = await supabaseAdmin
      .from("senders")
      .select("id, name, email")
      .in("id", senderIds);

    if (sendersError) {
      console.error("Error fetching sender details:", sendersError);
      return NextResponse.json(
        { message: "Failed to fetch sender details" },
        { status: 500 }
      );
    }

    // Combine sender details with verification data
    const senders = sendersData.map(sender => {
      const campaignSender = campaignSenders.find(cs => cs.sender_id === sender.id);
      return {
        id: sender.id,
        name: sender.name,
        email: sender.email,
        verified: campaignSender?.verified || false,
        test_sent: campaignSender?.test_sent || false,
        test_sent_at: campaignSender?.test_sent_at || null
      };
    });

    return NextResponse.json({ senders }, { status: 200 });
  } catch (error) {
    console.error("Error in get campaign senders:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}