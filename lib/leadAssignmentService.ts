import { 
  getSenders, 
  getCampaignSenders,
  updateCampaignLeadStatus,
  getCampaignUnassignedLeads,
  markLeadAsWorked,
  updateSenderStats,
  updateCampaignStats 
} from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lead Assignment Algorithm
 * This file contains the logic for assigning leads to senders
 * It ensures even distribution based on sender capacity and quotas using a round-robin approach
 */

interface LeadAssignmentResult {
  success: boolean;
  message: string;
  assignments?: {
    senderId: string;
    senderEmail: string;
    leadIds: string[];
  }[];
}

interface SenderWorkStatus {
  senderId: string;
  senderEmail: string;
  name: string;
  activeLeads: number;
  completedLeads: number;
  dailyQuota: number;
  emailsSentToday: number;
  availableForAssignment: boolean;
}

/**
 * Assign leads to senders for a specific campaign using round-robin distribution
 * Similar to dealing poker cards, one lead per sender at a time
 */
export async function assignLeadsToCampaignSenders(
  campaignId: string,
  leadIds: string[]
): Promise<LeadAssignmentResult> {
  try {
    console.log(`Assigning ${leadIds.length} leads for campaign ${campaignId} using round-robin distribution`);
    
    // Get senders for this campaign
    const senders = await getCampaignSenders(campaignId);
    
    if (!senders || senders.length === 0) {
      return {
        success: false,
        message: "No senders available for this campaign"
      };
    }
    
    // Calculate available capacity for each sender
    const sendersWithCapacity = senders.map(sender => {
      // Using emails_sent_today from the transformed campaign_senders data
      // This property comes from getCampaignSenders which includes this field
      const dailyQuota = sender.daily_quota || 20;
      const emailsSentToday = sender.emails_sent_today || 0;
      const availableCapacity = Math.max(0, dailyQuota - emailsSentToday);
      
      return {
        ...sender,
        availableCapacity
      };
    }).filter(sender => sender.availableCapacity > 0);
    
    if (sendersWithCapacity.length === 0) {
      return {
        success: false,
        message: "All senders have reached their daily quota"
      };
    }
    
    // Initialize assignments
    const assignments = sendersWithCapacity.map(sender => ({
      senderId: sender.id,
      senderEmail: sender.email,
      leadIds: [] as string[]
    }));
    
    // Round-robin distribution (like dealing poker cards)
    for (let i = 0; i < leadIds.length; i++) {
      // Determine which sender gets this lead (round-robin)
      const senderIndex = i % sendersWithCapacity.length;
      
      // Check if this sender still has capacity
      if (assignments[senderIndex].leadIds.length < sendersWithCapacity[senderIndex].availableCapacity) {
        assignments[senderIndex].leadIds.push(leadIds[i]);
      } else {
        // If this sender is at capacity, find the next sender with capacity
        let foundSender = false;
        for (let j = 1; j < sendersWithCapacity.length; j++) {
          const nextIndex = (senderIndex + j) % sendersWithCapacity.length;
          if (assignments[nextIndex].leadIds.length < sendersWithCapacity[nextIndex].availableCapacity) {
            assignments[nextIndex].leadIds.push(leadIds[i]);
            foundSender = true;
            break;
          }
        }
        
        // If no sender has capacity, we've reached our limit
        if (!foundSender) {
          console.log(`Reached capacity limit after assigning ${i} leads`);
          break;
        }
      }
    }
    
    // Remove any empty assignments
    const filteredAssignments = assignments.filter(a => a.leadIds.length > 0);
    
    // Update lead statuses in campaign_leads table
    for (const assignment of filteredAssignments) {
      for (const leadId of assignment.leadIds) {
        await updateCampaignLeadStatus(campaignId, leadId, 'ASSIGNED', assignment.senderId);
      }
    }
    
    // Count leads assigned
    const totalAssigned = filteredAssignments.reduce(
      (total, assignment) => total + assignment.leadIds.length, 0
    );
    
    return {
      success: true,
      message: `Successfully assigned ${totalAssigned} leads to ${filteredAssignments.length} senders using round-robin distribution`,
      assignments: filteredAssignments
    };
    
  } catch (error) {
    console.error('Error assigning leads:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Mark a lead as worked by a sender and assign a new lead if available
 * This is called after a sender completes work on a lead
 * Updates all relevant analytics and assigns the next lead in the queue
 */
export async function markLeadWorkedAndGetNext(
  campaignId: string,
  leadId: string,
  senderId: string,
  workResult: {
    status: 'CONTACTED' | 'BOUNCED' | 'FAILED' | 'SKIPPED';
    emailSent?: boolean;
    emailOpened?: boolean;
    emailClicked?: boolean;
    emailReplied?: boolean;
    notes?: string;
  }
): Promise<{
  success: boolean;
  message: string;
  nextLead?: any;
}> {
  try {
    // 1. Mark the current lead as worked with the given status
    await markLeadAsWorked(campaignId, leadId, senderId, workResult);
    
    // 2. Update sender statistics
    await updateSenderStats(senderId, {
      leadsWorked: 1,
      emailsSent: workResult.emailSent ? 1 : 0,
      emailsOpened: workResult.emailOpened ? 1 : 0,
      emailsClicked: workResult.emailClicked ? 1 : 0,
      emailsReplied: workResult.emailReplied ? 1 : 0,
      emailsBounced: workResult.status === 'BOUNCED' ? 1 : 0
    });
    
    // 3. Update campaign statistics
    await updateCampaignStats(campaignId, {
      leadsWorked: 1,
      emailsSent: workResult.emailSent ? 1 : 0,
      emailsOpened: workResult.emailOpened ? 1 : 0,
      emailsClicked: workResult.emailClicked ? 1 : 0,
      emailsReplied: workResult.emailReplied ? 1 : 0,
      emailsBounced: workResult.status === 'BOUNCED' ? 1 : 0
    });
    
    // 4. Check if the sender has reached their daily quota
    const senderInfo = await getSenderQuotaStatus(senderId);
    if (!senderInfo.availableForAssignment) {
      return {
        success: true,
        message: `Lead marked as worked. Sender has reached daily quota.`
      };
    }
    
    // 5. Find an unassigned lead for this campaign
    const unassignedLeads = await getCampaignUnassignedLeads(campaignId, 1);
    
    if (unassignedLeads && unassignedLeads.length > 0) {
      // 6. Assign the next lead to this sender
      const nextLeadId = unassignedLeads[0].id;
      await updateCampaignLeadStatus(campaignId, nextLeadId, 'ASSIGNED', senderId);
      
      return {
        success: true,
        message: `Lead marked as worked. New lead assigned.`,
        nextLead: unassignedLeads[0]
      };
    } else {
      return {
        success: true,
        message: `Lead marked as worked. No more leads available for assignment.`
      };
    }
  } catch (error) {
    console.error('Error in markLeadWorkedAndGetNext:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get current work status for all senders in a campaign
 * Shows number of active and completed leads per sender
 */
export async function getCampaignSenderWorkStatus(
  campaignId: string
): Promise<SenderWorkStatus[]> {
  try {
    // Get all senders for this campaign
    const senders = await getCampaignSenders(campaignId);
    
    if (!senders || senders.length === 0) {
      return [];
    }
    
    // For each sender, get their current work status
    const promises = senders.map(async (sender) => {
      // Get active leads count (assigned but not completed)
      const activeLeadsCount = await getActiveLeadsCount(campaignId, sender.id);
      
      // Get completed leads count
      const completedLeadsCount = await getCompletedLeadsCount(campaignId, sender.id);
      
      // Calculate daily quota status
      const dailyQuota = sender.daily_quota || 20;
      const emailsSentToday = sender.emails_sent_today || 0;
      const availableForAssignment = emailsSentToday < dailyQuota;
      
      return {
        senderId: sender.id,
        senderEmail: sender.email,
        name: sender.name,
        activeLeads: activeLeadsCount,
        completedLeads: completedLeadsCount,
        dailyQuota,
        emailsSentToday,
        availableForAssignment
      };
    });
    
    return await Promise.all(promises);
  } catch (error) {
    console.error('Error getting campaign sender work status:', error);
    return [];
  }
}

/**
 * Get a sender's current quota status
 */
async function getSenderQuotaStatus(senderId: string) {
  try {
    // Get sender details - need to use getCampaignSenders to get emails_sent_today
    const senderEntries = await getCampaignSenders('any');
    const sender = senderEntries.find(s => s.id === senderId);
    
    if (!sender) {
      const fallbackSender = await getSenders().then(senders => senders.find(s => s.id === senderId));
      if (!fallbackSender) {
        throw new Error(`Sender ${senderId} not found`);
      }
      
      // Use fallback sender data without emails_sent_today
      return {
        senderId,
        dailyQuota: fallbackSender.daily_quota || 20,
        emailsSentToday: 0,
        remainingQuota: fallbackSender.daily_quota || 20,
        availableForAssignment: true
      };
    }
    
    const dailyQuota = sender.daily_quota || 20;
    const emailsSentToday = sender.emails_sent_today || 0;
    const availableForAssignment = emailsSentToday < dailyQuota;
    
    return {
      senderId,
      dailyQuota,
      emailsSentToday,
      remainingQuota: Math.max(0, dailyQuota - emailsSentToday),
      availableForAssignment
    };
  } catch (error) {
    console.error('Error getting sender quota status:', error);
    throw error;
  }
}

/**
 * Get number of active leads for a sender in a campaign
 */
async function getActiveLeadsCount(campaignId: string, senderId: string): Promise<number> {
  try {
    // Implementation would query the database to get count of leads with status ASSIGNED
    // Placeholder for demonstration purposes
    return 0;
  } catch (error) {
    console.error('Error getting active leads count:', error);
    return 0;
  }
}

/**
 * Get number of completed leads for a sender in a campaign
 */
async function getCompletedLeadsCount(campaignId: string, senderId: string): Promise<number> {
  try {
    // Implementation would query the database to get count of leads with status COMPLETED
    // Placeholder for demonstration purposes
    return 0;
  } catch (error) {
    console.error('Error getting completed leads count:', error);
    return 0;
  }
}

/**
 * Get available senders with their current workload
 */
export async function getAvailableSenders(): Promise<any[]> {
  try {
    const senders = await getSenders();
    
    // For each sender, get their current workload
    const sendersWithWorkload = senders.map(sender => {
      // Logic to get real-time workload would be implemented here
      // For now, we'll use a default quota and random workload for demonstration
      const dailyQuota = sender.daily_quota || 20;
      const emailsSent = sender.emails_sent || 0;
      const availableCapacity = Math.max(0, dailyQuota - emailsSent);
      
      return {
        ...sender,
        availableCapacity,
        capacityPercentage: Math.floor((1 - availableCapacity / dailyQuota) * 100)
      };
    });
    
    // Sort by available capacity (descending)
    return sendersWithWorkload.sort((a, b) => b.availableCapacity - a.availableCapacity);
    
  } catch (error) {
    console.error('Error getting available senders:', error);
    return [];
  }
}