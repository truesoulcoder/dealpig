import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    console.log("Direct registration API: Attempting to register user:", email);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase environment variables!");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }
    
    // Make direct API call to Supabase Auth API
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseServiceRoleKey,
        "Authorization": `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: name }
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Direct registration API error:", data);
      return NextResponse.json(
        { success: false, message: data.msg || "Failed to register user" },
        { status: response.status }
      );
    }
    
    console.log("Direct registration API: User created successfully", data.id);
    
    // Return success
    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      userId: data.id
    });
    
  } catch (error: any) {
    console.error("Direct registration API: Unexpected error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}