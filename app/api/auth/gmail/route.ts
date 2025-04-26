import { NextRequest, NextResponse } from 'next/server';
import { getGmailAuthUrl } from '@/actions/auth.action';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Extract sender details from query parameters
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const title = searchParams.get('title');
    const dailyQuota = searchParams.get('dailyQuota');
    
    if (!email || !name) {
      return NextResponse.redirect('/accounts?error=Missing_sender_details');
    }
    
    // First, create a sender record in the database
    const { data: senderData, error: insertError } = await supabaseAdmin
      .from('senders')
      .insert({
        name,
        email,
        title: title || null,
        daily_quota: parseInt(dailyQuota || '100', 10),
        created_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (insertError) {
      console.error('Error creating sender:', insertError);
      return NextResponse.redirect(`/accounts?error=${encodeURIComponent(insertError.message)}`);
    }
    
    // Generate Gmail OAuth URL
    const authUrl = await getGmailAuthUrl(senderData.id);
    
    // Redirect to the Gmail authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Gmail auth route error:', error);
    return NextResponse.redirect('/accounts?error=Failed_to_initialize_authorization');
  }
}