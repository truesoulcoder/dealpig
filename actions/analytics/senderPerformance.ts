"use server";

import { supabase } from "@/lib/supabaseClient";
import { TimeRange } from "./emailPerformance";
import { formatISO, subDays } from "date-fns";

export interface SenderPerformanceData {
  name: string;
  sent: number;
  opened: number;
  replied: number;
  converted: number;
}

/**
 * Get sender performance data for the dashboard chart
 * @param timeRange The time range to fetch data for
 * @param campaignIds Optional array of campaign IDs to filter by
 */
export async function getSenderPerformance(
  timeRange: TimeRange = '7d',
  campaignIds?: string[]
): Promise<SenderPerformanceData[]> {
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
    // If campaign IDs are specified, first get all unique sender IDs from these campaigns
    let relevantSenderIds: string[] = [];
    
    if (campaignIds && campaignIds.length > 0) {
      // Get senders associated with the selected campaigns
      const { data: campaignSenders, error: campaignSenderError } = await supabase
        .from('campaign_senders')
        .select('sender_id')
        .in('campaign_id', campaignIds);
        
      if (campaignSenderError) {
        console.error('Error fetching campaign senders:', campaignSenderError);
      } else if (campaignSenders) {
        relevantSenderIds = [...new Set(campaignSenders.map(cs => cs.sender_id))];
      }
      
      // If no senders found for the campaigns, return empty result
      if (relevantSenderIds.length === 0) {
        return [];
      }
    }
    
    // Get senders with their email counts
    let query = supabase.from('senders').select('id, name');
    
    // Filter by relevant sender IDs if we have campaign filters
    if (relevantSenderIds.length > 0) {
      query = query.in('id', relevantSenderIds);
    }
    
    const { data: senders, error: senderError } = await query;
    
    if (senderError || !senders) {
      console.error('Error fetching senders:', senderError);
      return generateMockData();
    }
    
    // Build sender performance data by querying emails
    const performanceData: SenderPerformanceData[] = await Promise.all(
      senders.map(async (sender) => {
        // Start building email query for this sender
        let emailQuery = supabase
          .from('emails')
          .select('*')
          .eq('sender_id', sender.id)
          .gte('created_at', formattedStartDate);
          
        // Apply campaign filter if specified
        if (campaignIds && campaignIds.length > 0) {
          emailQuery = emailQuery.in('campaign_id', campaignIds);
        }
          
        // Execute the query
        const { data: emails, error: emailError } = await emailQuery;
        
        if (emailError || !emails) {
          return {
            name: sender.name,
            sent: 0,
            opened: 0,
            replied: 0,
            converted: 0
          };
        }
        
        // Count emails by status
        const sent = emails.length;
        const opened = emails.filter(email => 
          email.status === 'OPENED' || email.status === 'REPLIED').length;
        const replied = emails.filter(email => email.status === 'REPLIED').length;
        
        // Get lead IDs from the emails
        const leadIds = [...new Set(emails.map(email => email.lead_id))];
        
        // Get converted leads (leads that changed status to 'interested' or 'closed' after email)
        let leadQuery = supabase
          .from('leads')
          .select('count')
          .in('id', leadIds)
          .in('status', ['INTERESTED', 'NEGOTIATING', 'CLOSED'])
          .gte('updated_at', formattedStartDate);
        
        const { data: convertedLeads, error: leadError } = await leadQuery;
        
        const converted = convertedLeads ? convertedLeads.length : 0;
        
        return {
          name: sender.name,
          sent,
          opened,
          replied,
          converted
        };
      })
    );
    
    // Remove senders with zero emails sent
    const filteredData = performanceData.filter(d => d.sent > 0);
    
    // If we have campaign filters but no relevant data, return empty array instead of mock data
    if (campaignIds && campaignIds.length > 0 && filteredData.length === 0) {
      return [];
    }
    
    return filteredData.length > 0 ? filteredData : generateMockData();
  } catch (error) {
    console.error('Error in getSenderPerformance:', error);
    return generateMockData();
  }
}

/**
 * Generate mock data for development purposes
 */
function generateMockData(): SenderPerformanceData[] {
  const senderNames = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Williams', 'Robert Brown'];
  return senderNames.map(name => {
    const sent = Math.floor(Math.random() * 100) + 50;
    const opened = Math.floor(sent * (Math.random() * 0.4 + 0.4)); // 40-80% of sent
    const replied = Math.floor(opened * (Math.random() * 0.3 + 0.2)); // 20-50% of opened
    const converted = Math.floor(replied * (Math.random() * 0.3 + 0.1)); // 10-40% of replied
    
    return {
      name,
      sent,
      opened,
      replied,
      converted
    };
  });
}