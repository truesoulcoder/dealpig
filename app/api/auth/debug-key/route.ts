import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, message: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }
    
    // Create a Supabase client with the service role key
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Test a simple query that requires admin privileges
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      return NextResponse.json(
        { 
          success: false, 
          message: error.message,
          details: {
            key_length: supabaseServiceRoleKey.length,
            url_domain: new URL(supabaseUrl).hostname,
            error_code: error.code
          }
        },
        { status: 400 }
      );
    }
    
    // Return success with minimal user info
    return NextResponse.json({
      success: true,
      message: "Service role key is valid",
      user_count: data.users.length
    });
    
  } catch (error: any) {
    console.error("Debug key error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}