"use server";

import { 
  getSenders, 
  getCampaignSenders,
  updateCampaignLeadStatus
} from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';

/**
 * Lead Assignment Algorithm
 * This file contains the logic for assigning leads to senders
 * It ensures even distribution based on sender capacity and quotas
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

/**
 * Assign leads to senders for a specific campaign
 * Uses a weighted round-robin algorithm to distribute leads fairly
 */
export async function assignLeadsToCampaignSenders(
  campaignId: string,
  leadIds: string[]
): Promise<LeadAssignmentResult> {
  try {
    console.log(`Assigning ${leadIds.length} leads for campaign ${campaignId}`);
    
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
    
    // Calculate total available capacity
    const totalCapacity = sendersWithCapacity.reduce(
      (sum, sender) => sum + sender.availableCapacity, 
      0
    );
    
    // If total capacity is less than the number of leads, only process what we can
    const leadsToProcess = Math.min(leadIds.length, totalCapacity);
    
    // Distribute leads proportionally based on sender capacity
    const assignments = distributeLeads(sendersWithCapacity, leadIds.slice(0, leadsToProcess));
    
    // Update lead statuses in campaign_leads table
    for (const assignment of assignments) {
      for (const leadId of assignment.leadIds) {
        await updateCampaignLeadStatus(campaignId, leadId, 'ASSIGNED');
      }
    }
    
    return {
      success: true,
      message: `Successfully assigned ${leadsToProcess} leads to ${assignments.length} senders`,
      assignments
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
 * Distribute leads among senders based on their available capacity
 */
function distributeLeads(
  senders: any[], 
  leadIds: string[]
): { senderId: string, senderEmail: string, leadIds: string[] }[] {
  // Compute proportional distribution based on capacity
  const totalCapacity = senders.reduce((sum, sender) => sum + sender.availableCapacity, 0);
  
  // Initialize assignments
  const assignments = senders.map(sender => ({
    senderId: sender.id,
    senderEmail: sender.email,
    leadIds: [] as string[],
    // Calculate target leads based on proportional capacity
    targetCount: Math.floor((sender.availableCapacity / totalCapacity) * leadIds.length),
    currentCount: 0
  }));
  
  // First pass - assign leads based on target counts
  let leadIndex = 0;
  for (const assignment of assignments) {
    // Assign leads up to the target count
    while (assignment.currentCount < assignment.targetCount && leadIndex < leadIds.length) {
      assignment.leadIds.push(leadIds[leadIndex]);
      assignment.currentCount++;
      leadIndex++;
    }
  }
  
  // Second pass - distribute any remaining leads
  while (leadIndex < leadIds.length) {
    // Find the sender with the lowest current count
    let minCountIndex = 0;
    for (let i = 1; i < assignments.length; i++) {
      if (assignments[i].currentCount < assignments[minCountIndex].currentCount) {
        minCountIndex = i;
      }
    }
    
    // Assign lead to the sender with lowest count
    assignments[minCountIndex].leadIds.push(leadIds[leadIndex]);
    assignments[minCountIndex].currentCount++;
    leadIndex++;
  }
  
  // Return cleaned up assignment object
  return assignments.map(({ senderId, senderEmail, leadIds }) => ({
    senderId,
    senderEmail,
    leadIds
  }));
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
      const emailsSentToday = sender.emails_sent || 0;
      const availableCapacity = Math.max(0, dailyQuota - emailsSentToday);
      
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