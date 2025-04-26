import { NextRequest, NextResponse } from 'next/server';
import { 
  initializeBackgroundJobs,
  cleanupBackgroundJobs,
  triggerCampaignProcessorManually,
  triggerDailyStatsResetManually
} from '@/lib/cronJobs';
import logger from '@/lib/logger';

// Simple security check using a shared secret
const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Webhook endpoint for executing background jobs
 * Can be triggered by external cron job services
 */
export async function POST(request: NextRequest) {
  try {
    // Validate the request with a simple security check
    const authHeader = request.headers.get('authorization');
    
    if (!CRON_SECRET || !authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse the request to determine which job to run
    const body = await request.json().catch(() => ({ job: 'all' }));
    const jobType = body?.job || 'all';
    
    let result;
    
    // Run the requested job
    switch (jobType) {
      case 'initialize':
        await initializeBackgroundJobs();
        result = { message: 'Background jobs initialized successfully' };
        break;
      case 'cleanup':
        cleanupBackgroundJobs();
        result = { message: 'Background jobs cleaned up successfully' };
        break;
      case 'campaign-processor':
        result = await triggerCampaignProcessorManually();
        break;
      case 'reset-daily-stats':
        result = await triggerDailyStatsResetManually();
        break;
      case 'all':
      default:
        // Initialize all background jobs if they're not already running
        await initializeBackgroundJobs();
        // Also trigger campaign processor manually
        await triggerCampaignProcessorManually();
        result = { message: 'All jobs triggered successfully' };
        break;
    }
    
    logger.info(`Cron job ${jobType} executed successfully`, 'api:cron');
    
    return NextResponse.json({
      success: true,
      job: jobType,
      result
    });
  } catch (error) {
    logger.error(`Error running cron job: ${error instanceof Error ? error.message : String(error)}`, 'api:cron');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}