import { NextRequest, NextResponse } from 'next/server';
import { 
  triggerCampaignProcessorManually,
  triggerDailyStatsResetManually
} from '@/lib/cronJobs';
import { refreshAllTokens } from '@/lib/tokenRefresher';
import { monitorEmailResponses } from '@/lib/gmailMonitor';
import getLogger from '@/lib/logger';

// Simple security check using a shared secret
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Webhook endpoint for executing background jobs
 * Can be triggered by external cron job services
 */
export async function POST(request: NextRequest) {
  // Get the logger instance
  const logger = await getLogger();
  
  try {
    // Validate the request with a simple security check
    const authHeader = request.headers.get('authorization');
    
    if (!CRON_SECRET || !authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get job type from query parameter
    const jobType = request.nextUrl.searchParams.get('job') || '';
    let result;
    
    // Run the requested job
    switch (jobType) {
      case 'token-refresh':
        // Handle token refresh job
        await logger.info('Running token refresh job', 'cron');
        result = await refreshAllTokens();
        break;
      case 'email-monitor':  
        // Handle email monitoring job
        await logger.info('Running email monitoring job', 'cron');
        result = await monitorEmailResponses();
        break;
      case 'campaign-processor':
        // This is now manual only
        result = await triggerCampaignProcessorManually();
        break;
      case 'reset-daily-stats':
        result = await triggerDailyStatsResetManually();
        break;
      default:
        return NextResponse.json({ 
          error: 'Invalid job type specified'
        }, { status: 400 });
    }
    
    await logger.info(`Cron job ${jobType} executed successfully`, 'api:cron');
    
    return NextResponse.json({
      success: true,
      job: jobType,
      result
    });
  } catch (error) {
    const logger = await getLogger();
    await logger.error(`Error running cron job: ${error instanceof Error ? error.message : String(error)}`, 'api:cron');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}