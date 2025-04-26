import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateSession } from "@/lib/security";

export async function POST(
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

    // Parse request body
    const body = await req.json();
    const { status } = body;

    if (!status || !["ACTIVE", "PAUSED", "DRAFT", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value. Must be one of: ACTIVE, PAUSED, DRAFT, COMPLETED" },
        { status: 400 }
      );
    }

    // Update campaign status in database
    const { data, error } = await supabaseAdmin
      .from("campaigns")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error updating campaign status:", error);
      return NextResponse.json(
        { message: "Failed to update campaign status" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Campaign status updated successfully", status },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in campaign status update:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}