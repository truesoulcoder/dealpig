"use server";

import { Campaign } from '@/lib/database';

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