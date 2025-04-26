"use server";

import { Campaign } from '@/lib/database';
import { processCampaigns } from '@/lib/campaignScheduler';

// Export getCampaigns function that uses the database implementation
export async function getCampaigns(status?: string): Promise<Campaign[]> {
  try {
    const { getCampaigns: databaseGetCampaigns } = await import('@/lib/database');
    return databaseGetCampaigns(status);
  } catch (error) {
    console.error('Error in getCampaigns action:', error);
    return [];
  }
}

// Export campaign status update functions
export async function startCampaign(campaignId: string): Promise<boolean> {
  try {
    const { startCampaign: databaseStartCampaign } = await import('@/lib/database');
    return databaseStartCampaign(campaignId);
  } catch (error) {
    console.error('Error in startCampaign action:', error);
    return false;
  }
}

export async function pauseCampaign(campaignId: string): Promise<boolean> {
  try {
    const { pauseCampaign: databasePauseCampaign } = await import('@/lib/database');
    return databasePauseCampaign(campaignId);
  } catch (error) {
    console.error('Error in pauseCampaign action:', error);
    return false;
  }
}

export async function completeCampaign(campaignId: string): Promise<boolean> {
  try {
    const { completeCampaign: databaseCompleteCampaign } = await import('@/lib/database');
    return databaseCompleteCampaign(campaignId);
  } catch (error) {
    console.error('Error in completeCampaign action:', error);
    return false;
  }
}

// Export function to get emails by lead ID
export async function getEmailsByLead(leadId: string) {
  try {
    const { getEmailsByLeadId } = await import('@/lib/database');
    return getEmailsByLeadId(leadId);
  } catch (error) {
    console.error('Error in getEmailsByLead action:', error);
    return [];
  }
}

/**
 * Distribute leads for a specific campaign using round-robin algorithm
 * This can be called manually from the UI for testing or admin purposes
 */
export async function distributeLeadsForCampaign(campaignId: string): Promise<{
  success: boolean;
  message: string;
  assignedLeadsCount?: number;
}> {
  try {
    const { getCampaignUnassignedLeads } = await import('@/lib/database');
    const { assignLeadsToCampaignSenders } = await import('@/lib/leadAssignmentService');
    
    // Get unassigned leads for this campaign
    const unassignedLeads = await getCampaignUnassignedLeads(campaignId);
    
    if (!unassignedLeads || unassignedLeads.length === 0) {
      return {
        success: false,
        message: "No unassigned leads found for this campaign"
      };
    }
    
    // Get the lead IDs to assign
    const leadIdsToAssign = unassignedLeads.map(lead => lead.id);
    
    // Use the round-robin assignment algorithm to distribute leads to senders
    const assignmentResult = await assignLeadsToCampaignSenders(
      campaignId,
      leadIdsToAssign
    );
    
    return {
      success: assignmentResult.success,
      message: assignmentResult.message,
      assignedLeadsCount: assignmentResult.assignments?.reduce(
        (total, assignment) => total + assignment.leadIds.length, 
        0
      ) || 0
    };
  } catch (error) {
    console.error('Error in distributeLeadsForCampaign action:', error);
    return {
      success: false,
      message: `Error distributing leads: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Run a manual process cycle for a campaign
 * This can be useful for testing or for immediate processing of a campaign
 */
export async function processCampaignManually(campaignId: string): Promise<{
  success: boolean;
  message: string;
  processed?: number;
}> {
  try {
    // First check if campaign exists and is active
    const { getCampaignById } = await import('@/lib/database');
    const campaign = await getCampaignById(campaignId);
    
    if (!campaign) {
      return {
        success: false,
        message: "Campaign not found"
      };
    }
    
    if (campaign.status !== 'ACTIVE') {
      return {
        success: false,
        message: "Campaign is not active. Please activate the campaign first."
      };
    }
    
    // Process the campaign
    const { processCampaign } = await import('@/lib/campaignScheduler');
    const result = await processCampaign(campaign);
    
    return {
      success: true,
      message: `Successfully processed ${result} leads for this campaign`,
      processed: result
    };
  } catch (error) {
    console.error('Error in processCampaignManually action:', error);
    return {
      success: false,
      message: `Error processing campaign: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Get campaign leads with their assigned senders
 */
export async function getCampaignLeadsWithSenders(campaignId: string): Promise<any[]> {
  try {
    const { getCampaignLeads, getSenderById } = await import('@/lib/database');
    
    const campaignLeads = await getCampaignLeads(campaignId);
    
    // Add sender information to each lead
    const leadsWithSenders = await Promise.all(
      campaignLeads.map(async (lead) => {
        if (lead.assigned_sender_id) {
          const sender = await getSenderById(lead.assigned_sender_id);
          return {
            ...lead,
            sender: sender || null
          };
        }
        return {
          ...lead,
          sender: null
        };
      })
    );
    
    return leadsWithSenders;
  } catch (error) {
    console.error('Error in getCampaignLeadsWithSenders action:', error);
    return [];
  }
}

/**
 * Manually trigger the campaign processor
 * This will run the lead distribution engine for all active campaigns
 */
export async function triggerCampaignProcessorManually(): Promise<{
  success: boolean;
  message: string;
  processed?: number;
}> {
  try {
    // Run the campaign processor
    const result = await processCampaigns();
    
    return {
      success: result.success,
      message: result.message,
      processed: result.processed
    };
  } catch (error) {
    console.error('Error triggering campaign processor:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}