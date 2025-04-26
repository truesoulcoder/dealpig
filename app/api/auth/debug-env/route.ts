import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check environment variables (without exposing actual keys)
    const envCheck = {
      supabase_url_available: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      supabase_url_valid: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith('http')),
      service_role_key_available: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      service_role_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      node_env: process.env.NODE_ENV,
    };

    // Output to server console too
    console.log("Environment debug check:", envCheck);
    
    return NextResponse.json(
      { success: true, environment: envCheck },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}