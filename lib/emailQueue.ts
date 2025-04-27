import { supabase } from './supabase';
import { processEmailTask, processScheduledEmails } from './emailDrafter';
import { distributeLeadsForActiveCampaigns, resetDailyEmailCounts } from './leadDistribution';
import { UUID, EmailStatus } from '@/helpers/types';
import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';

// Interface for queued email task
export interface EmailTask {
  id: UUID;
  scheduled_for: Date;
  status: string;
}

/**
 * Initialize the email queue and schedulers
 * This should be called when the application starts
 */
export function initializeEmailQueue(): void {
  console.log('Initializing email queue and schedulers');

  // Process due emails every minute
  cron.schedule('* * * * *', async () => {
    try {
      await processScheduledEmails();
    } catch (error) {
      console.error('Error in scheduled email processing:', error);
    }
  });

  // Distribute leads for active campaigns - run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      await distributeLeadsForActiveCampaigns();
    } catch (error) {
      console.error('Error in lead distribution task:', error);
    }
  });

  // Reset daily email counts at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      await resetDailyEmailCounts();
    } catch (error) {
      console.error('Error in daily counter reset task:', error);
    }
  });

  console.log('Email queue and schedulers initialized');
}

/**
 * Queue an email to be sent at a specific time
 */
export async function queueEmail(
  leadId: UUID,
  senderId: UUID,
  campaignId: UUID,
  scheduledFor: Date
): Promise<UUID | null> {
  try {
    const { data, error } = await supabase
      .from('email_schedules')
      .insert({
        lead_id: leadId,
        sender_id: senderId,
        campaign_id: campaignId,
        scheduled_for: scheduledFor.toISOString(),
        status: EmailStatus.PENDING,
        tracking_id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data.id;
  } catch (error) {
    console.error('Error queueing email:', error);
    return null;
  }
}

/**
 * Get pending emails that need to be processed
 */
export async function getPendingEmails(limit: number = 50): Promise<EmailTask[]> {
  try {
    const now = new Date();
    const { data, error } = await supabase
      .from('email_schedules')
      .select('id, scheduled_for, status')
      .eq('status', EmailStatus.PENDING)
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error getting pending emails:', error);
    return [];
  }
}

/**
 * Process a specific email task
 */
export async function processTask(taskId: UUID): Promise<boolean> {
  return await processEmailTask(taskId);
}

/**
 * Retry failed email tasks
 */
export async function retryFailedTasks(limit: number = 20): Promise<number> {
  try {
    // Get failed tasks
    const { data, error } = await supabase
      .from('email_schedules')
      .select('id')
      .eq('status', 'ERROR')
      .limit(limit);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return 0;
    }
    
    let successCount = 0;
    
    // Retry each failed task
    for (const task of data) {
      // Reset the status to PENDING
      await supabase
        .from('email_schedules')
        .update({
          status: EmailStatus.PENDING,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);
      
      // Process the task
      const success = await processEmailTask(task.id);
      if (success) {
        successCount++;
      }
      
      // Add a delay between processing to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return successCount;
  } catch (error) {
    console.error('Error retrying failed tasks:', error);
    return 0;
  }
}

/**
 * Get email task statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processed: number;
  error: number;
}> {
  try {
    const stats = {
      pending: 0,
      processed: 0,
      error: 0
    };
    
    // Get pending count
    const { count: pendingCount, error: pendingError } = await supabase
      .from('email_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('status', EmailStatus.PENDING);
    
    if (!pendingError) {
      stats.pending = pendingCount || 0;
    }
    
    // Get processed count
    const { count: processedCount, error: processedError } = await supabase
      .from('email_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('status', EmailStatus.SENT); // Using SENT status instead of PROCESSED
    
    if (!processedError) {
      stats.processed = processedCount || 0;
    }
    
    // Get error count
    const { count: errorCount, error: errorError } = await supabase
      .from('email_schedules')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ERROR');
    
    if (!errorError) {
      stats.error = errorCount || 0;
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return { pending: 0, processed: 0, error: 0 };
  }
}