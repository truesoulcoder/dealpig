"use server";

import { initializeHealthChecks } from './healthMonitor';
import { processCampaigns } from './campaignScheduler';
import { resetDailySenderStats } from './database';
import getLogger from './logger';

// Store interval IDs for cleanup
let midnightResetIntervalId: NodeJS.Timeout | null = null;

/**
 * Initialize all background jobs
 */
export async function initializeBackgroundJobs(): Promise<void> {
  const logger = await getLogger();
  try {
    // Initialize health check tables in database
    await initializeHealthChecks();
    
    // Set up midnight stats reset job
    midnightResetIntervalId = setupMidnightReset();
    
    await logger.info('Background jobs initialized successfully', 'cron');
  } catch (error) {
    const logger = await getLogger();
    await logger.error(`Failed to initialize background jobs: ${error instanceof Error ? error.message : String(error)}`, 'cron');
  }
}

/**
 * Clean up background jobs
 */
export async function cleanupBackgroundJobs(): Promise<void> {
  const logger = await getLogger();
  try {
    // Stop midnight reset job if it's running
    if (midnightResetIntervalId) {
      clearInterval(midnightResetIntervalId);
      midnightResetIntervalId = null;
    }
    
    await logger.info('Background jobs cleaned up successfully', 'cron');
  } catch (error) {
    const logger = await getLogger();
    await logger.error(`Failed to clean up background jobs: ${error instanceof Error ? error.message : String(error)}`, 'cron');
  }
}

/**
 * The main campaign processor function
 * This processes all active campaigns according to their configuration
 * It uses our round-robin lead distribution algorithm to assign leads to senders
 * This function is now ONLY triggered manually by users, not automatically
 */
async function runCampaignProcessor(): Promise<void> {
  const logger = await getLogger();
  await logger.info('Starting manual campaign processing cycle', 'campaigns');
  
  try {
    // Process all campaigns using our lead distribution system
    const result = await processCampaigns();
    
    if (result.success) {
      await logger.info(`Campaign processing complete. ${result.processed} leads processed across campaigns.`, 'campaigns');
    } else {
      await logger.error(`Campaign processing failed: ${result.message}`, 'campaigns');
    }
  } catch (error) {
    const logger = await getLogger();
    await logger.error(`Unexpected error in campaign processor: ${error instanceof Error ? error.message : String(error)}`, 'campaigns');
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
  const logger = await getLogger();
  await logger.info('Resetting daily sender stats', 'cron');
  
  try {
    await resetDailySenderStats();
    await logger.info('Daily sender stats reset successfully', 'cron');
  } catch (error) {
    const logger = await getLogger();
    await logger.error(`Failed to reset daily sender stats: ${error instanceof Error ? error.message : String(error)}`, 'cron');
  }
}

/**
 * Export function that allows API endpoints to manually trigger campaign processing
 * This is now the ONLY way to trigger campaign processing (user-controlled)
 */
export async function triggerCampaignProcessorManually(): Promise<any> {
  const logger = await getLogger();
  await logger.info('Campaign processor manually triggered by user', 'cron');
  return runCampaignProcessor();
}

export async function triggerDailyStatsResetManually(): Promise<any> {
  const logger = await getLogger();
  await logger.info('Daily stats reset manually triggered', 'cron');
  return resetDailyStats();
}