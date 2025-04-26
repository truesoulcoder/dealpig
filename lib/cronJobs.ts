import { startMonitoring } from './systemMonitor';
import { initializeHealthChecks } from './healthMonitor';
import { processCampaigns } from './campaignScheduler';
import { resetDailySenderStats } from './database';
import logger from './logger';

// Store interval IDs for cleanup
let monitoringIntervalId: NodeJS.Timeout | null = null;
let campaignProcessorIntervalId: NodeJS.Timeout | null = null;
let midnightResetIntervalId: NodeJS.Timeout | null = null;

/**
 * Initialize all background jobs
 */
export async function initializeBackgroundJobs(): Promise<void> {
  try {
    // Initialize health check tables in database
    await initializeHealthChecks();
    
    // Start service monitoring (check every 5 minutes)
    monitoringIntervalId = startMonitoring(5 * 60 * 1000);
    
    // Start campaign processor (runs every 15 minutes)
    campaignProcessorIntervalId = startCampaignProcessor(15 * 60 * 1000);
    
    // Set up midnight stats reset job
    midnightResetIntervalId = setupMidnightReset();
    
    logger.info('Background jobs initialized successfully', 'cron');
  } catch (error) {
    logger.error(`Failed to initialize background jobs: ${error instanceof Error ? error.message : String(error)}`, 'cron');
  }
}

/**
 * Clean up background jobs
 */
export function cleanupBackgroundJobs(): void {
  try {
    // Stop monitoring if it's running
    if (monitoringIntervalId) {
      clearInterval(monitoringIntervalId);
      monitoringIntervalId = null;
    }
    
    // Stop campaign processor if it's running
    if (campaignProcessorIntervalId) {
      clearInterval(campaignProcessorIntervalId);
      campaignProcessorIntervalId = null;
    }
    
    // Stop midnight reset job if it's running
    if (midnightResetIntervalId) {
      clearInterval(midnightResetIntervalId);
      midnightResetIntervalId = null;
    }
    
    logger.info('Background jobs cleaned up successfully', 'cron');
  } catch (error) {
    logger.error(`Failed to clean up background jobs: ${error instanceof Error ? error.message : String(error)}`, 'cron');
  }
}

/**
 * Start the autonomous campaign processor that runs on a schedule
 * This continuously checks for active campaigns and processes leads using our round-robin distribution algorithm
 */
function startCampaignProcessor(intervalMs: number): NodeJS.Timeout {
  // Run once immediately when the server starts
  runCampaignProcessor();
  
  // Then set up recurring interval
  return setInterval(runCampaignProcessor, intervalMs);
}

/**
 * The main campaign processor function
 * This processes all active campaigns according to their configuration
 * It uses our round-robin lead distribution algorithm to assign leads to senders
 */
async function runCampaignProcessor(): Promise<void> {
  logger.info('Starting autonomous campaign processing cycle', 'campaigns');
  
  try {
    // Process all campaigns using our lead distribution system
    const result = await processCampaigns();
    
    if (result.success) {
      logger.info(`Campaign processing complete. ${result.processed} leads processed across campaigns.`, 'campaigns');
    } else {
      logger.error(`Campaign processing failed: ${result.message}`, 'campaigns');
    }
  } catch (error) {
    logger.error(`Unexpected error in campaign processor: ${error instanceof Error ? error.message : String(error)}`, 'campaigns');
  }
}

/**
 * Set up a job that runs at midnight to reset daily stats
 */
function setupMidnightReset(): NodeJS.Timeout {
  // Calculate time until midnight
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const timeUntilMidnight = midnight.getTime() - now.getTime();
  
  // Set up timeout to run at midnight
  const timeoutId = setTimeout(() => {
    resetDailyStats();
    
    // After running at midnight, set up recurring daily job
    return setInterval(resetDailyStats, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
  
  return timeoutId as unknown as NodeJS.Timeout;
}

/**
 * Reset daily stats for all senders
 */
async function resetDailyStats(): Promise<void> {
  logger.info('Resetting daily sender stats', 'cron');
  
  try {
    await resetDailySenderStats();
    logger.info('Daily sender stats reset successfully', 'cron');
  } catch (error) {
    logger.error(`Failed to reset daily sender stats: ${error instanceof Error ? error.message : String(error)}`, 'cron');
  }
}

/**
 * Export functions that allow API endpoints to manually trigger jobs for testing/debugging
 */
export async function triggerCampaignProcessorManually(): Promise<any> {
  logger.info('Campaign processor manually triggered', 'cron');
  return runCampaignProcessor();
}

export async function triggerDailyStatsResetManually(): Promise<any> {
  logger.info('Daily stats reset manually triggered', 'cron');
  return resetDailyStats();
}