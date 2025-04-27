import { supabase } from './supabase';
import { 
  Campaign, 
  CampaignSender, 
  CampaignLead,
  CampaignLeadStatus,
  CampaignStatus,
  Sender, 
  Lead,
  Email,
  EmailStatus,
  UUID, 
  Timestamp 
} from '@/helpers/types';
import { addMinutes, isBefore, isAfter, parse, format } from 'date-fns';

interface LeadAssignment {
  campaignLeadId: UUID;
  senderId: UUID;
  scheduledTime: Date;
  leadId: UUID;
  campaignId: UUID;
}

/**
 * Distributes leads for all active campaigns
 * This function should be called by a cron job or scheduled task
 */
export async function distributeLeadsForActiveCampaigns(): Promise<void> {
  try {
    // Get all active campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', CampaignStatus.ACTIVE);
    
    if (campaignError) throw campaignError;
    
    if (!campaigns || campaigns.length === 0) {
      console.log('No active campaigns found');
      return;
    }
    
    // Process each active campaign
    for (const campaign of campaigns) {
      await distributeLeadsForCampaign(campaign.id);
    }
  } catch (error) {
    console.error('Error distributing leads for active campaigns:', error);
    throw error;
  }
}

/**
 * Distributes leads for a specific campaign
 * @param campaignId The ID of the campaign to distribute leads for
 */
export async function distributeLeadsForCampaign(campaignId: UUID): Promise<void> {
  try {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (campaignError || !campaign) {
      throw campaignError || new Error(`Campaign with ID ${campaignId} not found`);
    }
    
    // Skip if campaign is not active
    if (campaign.status !== CampaignStatus.ACTIVE) {
      console.log(`Campaign ${campaignId} is not active (status: ${campaign.status})`);
      return;
    }
    
    // Get campaign senders
    const { data: campaignSenders, error: senderError } = await supabase
      .from('campaign_senders')
      .select('*, sender:sender_id(*)')
      .eq('campaign_id', campaignId);
    
    if (senderError || !campaignSenders || campaignSenders.length === 0) {
      throw senderError || new Error(`No senders found for campaign ${campaignId}`);
    }
    
    // Get pending leads for this campaign
    const { data: campaignLeads, error: leadsError } = await supabase
      .from('campaign_leads')
      .select('*, lead:lead_id(*)')
      .eq('campaign_id', campaignId)
      .eq('status', CampaignLeadStatus.PENDING)
      .limit(campaign.leads_per_day * 2); // Fetch extra to account for potential filtering
    
    if (leadsError) throw leadsError;
    
    if (!campaignLeads || campaignLeads.length === 0) {
      console.log(`No pending leads found for campaign ${campaignId}`);
      return;
    }
    
    // Determine the leads to be processed today (limited by campaign.leads_per_day)
    const leadsForToday = campaignLeads.slice(0, campaign.leads_per_day);
    
    // Calculate sender availability and quotas
    const senderAvailability = calculateSenderAvailability(campaignSenders);
    
    // Distribute leads among senders
    const assignments = distributeLeads(campaign, leadsForToday, senderAvailability);
    
    // Schedule the emails
    await scheduleEmails(assignments, campaign);
    
    console.log(`Distributed ${assignments.length} leads for campaign ${campaignId}`);
  } catch (error) {
    console.error(`Error distributing leads for campaign ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Calculate the availability of each sender based on their daily quota and emails already sent today
 */
function calculateSenderAvailability(campaignSenders: any[]): Map<UUID, number> {
  const senderAvailability = new Map<UUID, number>();
  
  for (const cs of campaignSenders) {
    const sender = cs.sender;
    const dailyQuota = sender.daily_quota || 100; // Default to 100 if not specified
    const emailsSentToday = cs.emails_sent_today || 0;
    const remainingQuota = Math.max(0, dailyQuota - emailsSentToday);
    
    senderAvailability.set(sender.id, remainingQuota);
  }
  
  return senderAvailability;
}

/**
 * Distribute leads among available senders
 */
function distributeLeads(
  campaign: Campaign, 
  leads: any[], 
  senderAvailability: Map<UUID, number>
): LeadAssignment[] {
  const assignments: LeadAssignment[] = [];
  let currentIndex = 0;
  
  // Convert available senders to an array for easier distribution
  const availableSenders: {id: UUID, remaining: number}[] = [];
  senderAvailability.forEach((remaining, id) => {
    if (remaining > 0) {
      availableSenders.push({ id, remaining });
    }
  });
  
  if (availableSenders.length === 0) {
    console.log(`No available senders for campaign ${campaign.id}`);
    return assignments;
  }
  
  // Parse campaign start and end time
  const today = new Date();
  const startTime = parse(campaign.start_time, 'HH:mm', today);
  const endTime = parse(campaign.end_time, 'HH:mm', today);
  
  // If current time is past end time, schedule for tomorrow
  const now = new Date();
  let scheduleDate = today;
  if (isAfter(now, endTime)) {
    scheduleDate = addMinutes(scheduleDate, 24 * 60); // Add a day
  }
  
  // Calculate the time window in minutes
  const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
  const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
  const timeWindowMinutes = endMinutes - startMinutes;
  
  // Distribute leads evenly across the time window with some randomness
  for (const lead of leads) {
    // Find next available sender using round-robin
    let senderAssigned = false;
    let startIndex = currentIndex;
    
    do {
      const sender = availableSenders[currentIndex];
      if (sender.remaining > 0) {
        // Calculate a random time within the campaign time window
        const randomMinutesOffset = Math.floor(Math.random() * timeWindowMinutes);
        const scheduledDateTime = addMinutes(startTime, randomMinutesOffset);
        
        // Set the date component from scheduleDate
        scheduledDateTime.setFullYear(scheduleDate.getFullYear());
        scheduledDateTime.setMonth(scheduleDate.getMonth());
        scheduledDateTime.setDate(scheduleDate.getDate());
        
        // Add some random minutes for natural distribution
        const jitter = Math.floor(Math.random() * (campaign.max_interval_minutes - campaign.min_interval_minutes + 1)) + campaign.min_interval_minutes;
        const finalScheduledTime = addMinutes(scheduledDateTime, jitter);
        
        // Create the assignment
        assignments.push({
          campaignLeadId: lead.id,
          senderId: sender.id,
          scheduledTime: finalScheduledTime,
          leadId: lead.lead_id,
          campaignId: campaign.id
        });
        
        // Update sender's remaining quota
        sender.remaining -= 1;
        senderAssigned = true;
      }
      
      // Move to next sender (round-robin)
      currentIndex = (currentIndex + 1) % availableSenders.length;
    } while (!senderAssigned && currentIndex !== startIndex);
    
    // If we couldn't assign a sender, stop processing more leads
    if (!senderAssigned) {
      console.log(`No available senders left for campaign ${campaign.id} after assigning ${assignments.length} leads`);
      break;
    }
  }
  
  return assignments;
}

/**
 * Schedule emails for the assigned leads
 */
async function scheduleEmails(assignments: LeadAssignment[], campaign: Campaign): Promise<void> {
  if (assignments.length === 0) return;
  
  const updates = [];
  const schedules = [];
  
  for (const assignment of assignments) {
    // Update campaign_leads status
    updates.push({
      id: assignment.campaignLeadId,
      status: CampaignLeadStatus.SCHEDULED,
      updated_at: new Date().toISOString()
    });
    
    // Create email schedule
    schedules.push({
      lead_id: assignment.leadId,
      sender_id: assignment.senderId,
      campaign_id: assignment.campaignId,
      status: EmailStatus.PENDING,
      scheduled_for: assignment.scheduledTime.toISOString(),
      tracking_id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  // Update campaign_leads status in batch
  if (updates.length > 0) {
    const { error: updateError } = await supabase
      .from('campaign_leads')
      .upsert(updates);
    
    if (updateError) {
      throw updateError;
    }
  }
  
  // Create email schedules in batch
  if (schedules.length > 0) {
    const { error: scheduleError } = await supabase
      .from('email_schedules')
      .insert(schedules);
    
    if (scheduleError) {
      throw scheduleError;
    }
  }
  
  // Update campaign with the number of leads worked
  const { error: campaignUpdateError } = await supabase
    .from('campaigns')
    .update({
      leads_worked: campaign.leads_worked + assignments.length,
      updated_at: new Date().toISOString()
    })
    .eq('id', campaign.id);
  
  if (campaignUpdateError) {
    throw campaignUpdateError;
  }
  
  // Update campaign_senders with new email counts
  const senderCounts = new Map<UUID, number>();
  for (const assignment of assignments) {
    const currentCount = senderCounts.get(assignment.senderId) || 0;
    senderCounts.set(assignment.senderId, currentCount + 1);
  }
  
  for (const [senderId, count] of Array.from(senderCounts.entries())) {
    const { error: senderUpdateError } = await supabase
      .from('campaign_senders')
      .update({
        emails_sent_today: supabase.rpc('increment', { x: count }),
        total_emails_sent: supabase.rpc('increment', { x: count }),
        updated_at: new Date().toISOString()
      })
      .eq('campaign_id', campaign.id)
      .eq('sender_id', senderId);
    
    if (senderUpdateError) {
      console.error(`Error updating sender counts for sender ${senderId}:`, senderUpdateError);
      // Continue with other senders
    }
  }
}

/**
 * Resets the daily email counts for all campaign senders
 * Should be called daily at midnight
 */
export async function resetDailyEmailCounts(): Promise<void> {
  try {
    const { error } = await supabase
      .from('campaign_senders')
      .update({
        emails_sent_today: 0,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    console.log('Daily email counts reset successfully');
  } catch (error) {
    console.error('Error resetting daily email counts:', error);
    throw error;
  }
}