import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("Missing Supabase environment variables!");
      return NextResponse.json(
        { success: false, message: "Server configuration error" },
        { status: 500 }
      );
    }
    
    // Debug log (without revealing full key)
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`Service role key available: ${Boolean(supabaseServiceRoleKey)}`);
    
    try {
      // Create a fresh Supabase client instance with the service role key
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      
      // Use the correct API to create a user with the admin client
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name
        }
      });
      
      if (error) {
        console.error("User creation failed:", error);
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 400 }
        );
      }
      
      if (!data || !data.user) {
        return NextResponse.json(
          { success: false, message: "User creation failed - no data returned" },
          { status: 500 }
        );
      }
      
      console.log("User created successfully:", data.user.id);
      
      // Try to create profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: name,
          email: email
        });
      
      if (profileError) {
        console.error("Profile creation error:", profileError);
        // Don't fail the whole process just because profile creation failed
      }
      
      return NextResponse.json({
        success: true,
        message: "User registered successfully",
        userId: data.user.id
      });
      
    } catch (innerError: any) {
      console.error("Supabase operation error:", innerError);
      return NextResponse.json(
        { success: false, message: innerError.message || "Error creating user" },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error("Registration API unexpected error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}