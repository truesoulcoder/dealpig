import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { apiLimiter } from '@/lib/rateLimit';

interface BounceNotification {
  email: string;
  campaign_id?: string;
  bounce_type: 'hard' | 'soft';
  bounce_code?: string;
  description?: string;
  timestamp: string;
  message_id?: string;
}

/**
 * Webhook handler for email bounce notifications
 * This endpoint receives bounce notifications from email service providers
 * and updates the campaign analytics and lead status accordingly
 */
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting to prevent abuse
    const rateLimitResult = await apiLimiter(req);
    if (rateLimitResult) {
      return rateLimitResult; // Rate limit exceeded
    }

    // Validate the request signature (implementation depends on your email provider)
    // This is a simplified example - you should implement proper validation
    const authHeader = req.headers.get('authorization');
    const signature = req.headers.get('x-webhook-signature');

    if (!authHeader || !process.env.WEBHOOK_API_KEY || 
        authHeader !== `Bearer ${process.env.WEBHOOK_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse bounce notification data
    const data = await req.json() as BounceNotification;
    
    // Validate required fields
    if (!data.email || !data.bounce_type || !data.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Record the bounce in database
    const { error: bounceError } = await supabaseAdmin
      .from('email_bounces')
      .insert({
        email: data.email,
        campaign_id: data.campaign_id,
        bounce_type: data.bounce_type,
        bounce_code: data.bounce_code,
        description: data.description,
        timestamp: data.timestamp,
        message_id: data.message_id
      });

    if (bounceError) {
      console.error('Error recording bounce:', bounceError);
      return NextResponse.json(
        { error: 'Failed to record bounce' },
        { status: 500 }
      );
    }

    // Update campaign stats if campaign_id is provided
    if (data.campaign_id) {
      // First get current campaign stats
      const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('stats')
        .eq('id', data.campaign_id)
        .single();

      if (campaignError) {
        console.error('Error fetching campaign:', campaignError);
      } else if (campaign) {
        // Update campaign stats
        const stats = campaign.stats || {};
        const bounced = (stats.bounced || 0) + 1;
        const delivered = Math.max(0, (stats.delivered || 0) - 1);
        
        // Update hard or soft bounce count
        if (data.bounce_type === 'hard') {
          stats.hard_bounces = (stats.hard_bounces || 0) + 1;
        } else {
          stats.soft_bounces = (stats.soft_bounces || 0) + 1;
        }
        
        // Calculate bounce rate
        const totalSent = stats.total_emails_sent || 0;
        const bounce_rate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
        
        // Update stats
        stats.bounced = bounced;
        stats.delivered = delivered;
        stats.bounce_rate = parseFloat(bounce_rate.toFixed(2));
        
        // Save updated stats
        await supabaseAdmin
          .from('campaigns')
          .update({ stats })
          .eq('id', data.campaign_id);
      }
    }

    // Update lead status for hard bounces to prevent future sends
    if (data.bounce_type === 'hard') {
      await supabaseAdmin
        .from('leads')
        .update({ 
          status: 'invalid',
          last_bounce_at: new Date().toISOString(),
          bounce_reason: data.description || 'Hard bounce detected'
        })
        .eq('email', data.email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}