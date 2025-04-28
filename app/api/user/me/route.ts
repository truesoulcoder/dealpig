import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the user's session
    const admin = createAdminClient();
    const { data: { user }, error: authError } = await admin.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the user's profile with additional details
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('[API /user/me] profile fetch error:', profileError);
      return NextResponse.json(
        { email: user.email, name: user.user_metadata?.name || 'User' },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: profile?.name || user.user_metadata?.name || 'User',
      ...profile
    });
  } catch (err) {
    console.error('[API /user/me] unexpected error:', err);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}