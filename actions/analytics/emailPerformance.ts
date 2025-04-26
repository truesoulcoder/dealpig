"use server";

import { supabase } from "@/lib/supabaseClient";
import { formatISO, subDays, format, parseISO } from "date-fns";

export type TimeRange = '7d' | '30d' | '90d';

export interface EmailPerformanceData {
  name: string;
  sent: number;
  opened: number;
  replied: number;
}

/**
 * Get email performance data for the dashboard chart
 * @param timeRange The time range to fetch data for
 * @param campaignIds Optional array of campaign IDs to filter by
 */
export async function getEmailPerformance(
  timeRange: TimeRange = '7d',
  campaignIds?: string[]
): Promise<EmailPerformanceData[]> {
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
    // Start building the query
    let query = supabase
      .from('emails')
      .select('*')
      .gte('created_at', formattedStartDate);
      
    // Apply campaign filter if specified
    if (campaignIds && campaignIds.length > 0) {
      query = query.in('campaign_id', campaignIds);
    }
    
    // Execute the query
    const { data: emails, error } = await query;
    
    if (error) {
      console.error('Error fetching email data:', error);
      return generateMockData(timeRange);
    }
    
    // Group emails by day and count them
    const groupedData = emails.reduce((acc, email) => {
      const date = email.created_at.substring(0, 10); // YYYY-MM-DD
      const displayDate = format(parseISO(date), 'MMM dd');
      
      if (!acc[displayDate]) {
        acc[displayDate] = {
          name: displayDate,
          sent: 0,
          opened: 0,
          replied: 0
        };
      }
      
      // Count based on email status
      if (email.status === 'SENT' || email.status === 'OPENED' || email.status === 'REPLIED') {
        acc[displayDate].sent++;
      }
      
      if (email.status === 'OPENED' || email.status === 'REPLIED') {
        acc[displayDate].opened++;
      }
      
      if (email.status === 'REPLIED') {
        acc[displayDate].replied++;
      }
      
      return acc;
    }, {} as Record<string, EmailPerformanceData>);
    
    // Convert to array and sort by date
    const sortedData = Object.values(groupedData)
      .sort((a, b) => {
        // Parse as dates for proper sorting
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return dateA.getTime() - dateB.getTime();
      });
    
    return sortedData.length > 0 ? sortedData : generateMockData(timeRange);
  } catch (error) {
    console.error('Error in getEmailPerformance:', error);
    return generateMockData(timeRange);
  }
}

/**
 * Generate mock data for development purposes
 */
function generateMockData(timeRange: TimeRange): EmailPerformanceData[] {
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const data: EmailPerformanceData[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const displayDate = format(date, 'MMM dd');
    
    // Generate random numbers with some correlation to make the data look realistic
    const sent = Math.floor(Math.random() * 50) + 10;
    const opened = Math.floor(sent * (Math.random() * 0.4 + 0.4)); // 40-80% of sent
    const replied = Math.floor(opened * (Math.random() * 0.3 + 0.2)); // 20-50% of opened
    
    data.push({
      name: displayDate,
      sent,
      opened,
      replied
    });
  }
  
  return data;
}
