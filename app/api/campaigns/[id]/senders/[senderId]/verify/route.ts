import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateSession } from "@/lib/security";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string, senderId: string } }
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

    // Get campaign and sender IDs from params
    const { id: campaignId, senderId } = params;
    if (!campaignId || !senderId) {
      return NextResponse.json(
        { message: "Campaign ID and Sender ID are required" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { verified } = body;

    if (verified === undefined) {
      return NextResponse.json(
        { message: "Verified status is required" },
        { status: 400 }
      );
    }

    // Check if the sender exists for this campaign
    const { data: existingRecord, error: checkError } = await supabaseAdmin
      .from("campaign_senders")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("sender_id", senderId)
      .single();

    if (checkError) {
      console.error("Error checking campaign sender:", checkError);
      return NextResponse.json(
        { message: "Sender not found for this campaign" },
        { status: 404 }
      );
    }

    // Update the verification status
    const { error: updateError } = await supabaseAdmin
      .from("campaign_senders")
      .update({ verified, updated_at: new Date().toISOString() })
      .eq("campaign_id", campaignId)
      .eq("sender_id", senderId);

    if (updateError) {
      console.error("Error updating sender verification:", updateError);
      return NextResponse.json(
        { message: "Failed to update sender verification status" },
        { status: 500 }
      );
    }

    // Check if all senders for this campaign are now verified
    const { data: campaignSenders, error: allSendersError } = await supabaseAdmin
      .from("campaign_senders")
      .select("verified")
      .eq("campaign_id", campaignId);

    if (allSendersError) {
      console.error("Error checking all campaign senders:", allSendersError);
      // We'll still return success for the individual update
    } else {
      // If all senders are verified, we can update a campaign flag if needed
      const allVerified = campaignSenders.every(s => s.verified === true);
      
      if (allVerified) {
        await supabaseAdmin
          .from("campaigns")
          .update({ 
            senders_verified: true, 
            updated_at: new Date().toISOString() 
          })
          .eq("id", campaignId);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "Sender verification status updated",
        verified
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating sender verification:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}