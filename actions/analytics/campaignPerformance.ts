"use server";

import { supabase } from "@/lib/supabaseClient";
import { TimeRange } from "./emailPerformance";
import { formatISO, subDays } from "date-fns";
import { Campaign } from "@/helpers/types";

export interface CampaignComparisonData {
  name: string;
  openRate: number;
  replyRate: number;
  conversionRate: number;
}

/**
 * Get campaign comparison data for radar chart
 */
export async function getCampaignComparison(timeRange: TimeRange = '7d'): Promise<CampaignComparisonData[]> {
  const now = new Date();
  let startDate: Date;
  
  // Calculate start date based on time range
  switch (timeRange) {
    case '7d':
      startDate = subDays(now, 7);
      break;
    case '30d':
      startDate = subDays(now, 30);
      break;
    case '90d':
      startDate = subDays(now, 90);
      break;
  }
  
  const formattedStartDate = formatISO(startDate);
  
  try {
    // Get active campaigns
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .in('status', ['ACTIVE', 'PAUSED', 'COMPLETED']);
    
    if (campaignError || !campaigns || campaigns.length === 0) {
      console.error('Error fetching campaigns:', campaignError);
      return generateMockData();
    }
    
    // Build campaign metrics by querying emails linked to each campaign
    const campaignData: CampaignComparisonData[] = await Promise.all(
      campaigns.map(async (campaign) => {
        // Get emails sent for this campaign
        const { data: campaignEmails, error: emailError } = await supabase
          .from('emails')
          .select('*')
          .eq('campaign_id', campaign.id)
          .gte('created_at', formattedStartDate);
        
        if (emailError || !campaignEmails || campaignEmails.length === 0) {
          // Return zeros if no emails for this campaign
          return {
            name: campaign.name,
            openRate: 0,
            replyRate: 0,
            conversionRate: 0
          };
        }
        
        // Calculate rates
        const totalEmails = campaignEmails.length;
        const openedEmails = campaignEmails.filter(email => 
          email.status === 'OPENED' || email.status === 'REPLIED').length;
        const repliedEmails = campaignEmails.filter(email => 
          email.status === 'REPLIED').length;
          
        // Get converted leads for this campaign
        const { data: convertedLeads, error: leadError } = await supabase
          .from('leads')
          .select('count')
          .eq('campaign_id', campaign.id)
          .in('status', ['INTERESTED', 'NEGOTIATING', 'CLOSED'])
          .gte('updated_at', formattedStartDate);
          
        const convertedCount = convertedLeads ? convertedLeads.length : 0;
        
        // Calculate percentages
        const openRate = totalEmails > 0 ? (openedEmails / totalEmails) * 100 : 0;
        const replyRate = totalEmails > 0 ? (repliedEmails / totalEmails) * 100 : 0;
        const conversionRate = totalEmails > 0 ? (convertedCount / totalEmails) * 100 : 0;
        
        return {
          name: campaign.name,
          openRate: Math.round(openRate * 10) / 10, // Round to 1 decimal place
          replyRate: Math.round(replyRate * 10) / 10,
          conversionRate: Math.round(conversionRate * 10) / 10
        };
      })
    );
    
    // Filter out campaigns with no data
    const filteredData = campaignData.filter(campaign => 
      campaign.openRate > 0 || campaign.replyRate > 0 || campaign.conversionRate > 0);
    
    return filteredData.length > 0 ? filteredData : generateMockData();
  } catch (error) {
    console.error('Error in getCampaignComparison:', error);
    return generateMockData();
  }
}

/**
 * Generate mock data for development purposes
 */
function generateMockData(): CampaignComparisonData[] {
  const campaignNames = ['Spring Outreach', 'Summer Campaign', 'Fall Follow-up', 'Winter Special'];
  
  return campaignNames.map(name => ({
    name,
    openRate: Math.round((Math.random() * 20 + 50) * 10) / 10, // 50-70% open rate
    replyRate: Math.round((Math.random() * 15 + 15) * 10) / 10, // 15-30% reply rate
    conversionRate: Math.round((Math.random() * 8 + 4) * 10) / 10  // 4-12% conversion rate
  }));
}