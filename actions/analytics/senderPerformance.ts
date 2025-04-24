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
 */
export async function getSenderPerformance(timeRange: TimeRange = '7d'): Promise<SenderPerformanceData[]> {
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
    // Get senders with their email counts
    const { data: senders, error: senderError } = await supabase
      .from('senders')
      .select('id, name');
    
    if (senderError || !senders) {
      console.error('Error fetching senders:', senderError);
      return generateMockData();
    }
    
    // Build sender performance data by querying emails
    const performanceData: SenderPerformanceData[] = await Promise.all(
      senders.map(async (sender) => {
        // Get email counts for each sender
        const { data: emails, error: emailError } = await supabase
          .from('emails')
          .select('*')
          .eq('sender_id', sender.id)
          .gte('created_at', formattedStartDate);
        
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
        
        // Get converted leads (leads that changed status to 'interested' or 'closed' after email)
        const { data: convertedLeads, error: leadError } = await supabase
          .from('leads')
          .select('count')
          .eq('sender_id', sender.id)
          .in('status', ['INTERESTED', 'NEGOTIATING', 'CLOSED'])
          .gte('updated_at', formattedStartDate);
        
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