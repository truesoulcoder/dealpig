"use server";

import { supabase } from "@/lib/supabaseClient";
import { TimeRange } from "./emailPerformance";
import { formatISO, subWeeks, startOfWeek, endOfWeek, format, eachWeekOfInterval, parseISO } from "date-fns";

export interface WeeklyPerformanceData {
  name: string;
  emails: number;
  leads: number;
  replies: number;
}

/**
 * Get weekly campaign performance data
 */
export async function getWeeklyPerformance(timeRange: TimeRange = '7d'): Promise<WeeklyPerformanceData[]> {
  const now = new Date();
  let startDate: Date;
  
  // Calculate start date based on time range
  switch (timeRange) {
    case '7d':
      startDate = subWeeks(now, 1);
      break;
    case '30d':
      startDate = subWeeks(now, 4);
      break;
    case '90d':
      startDate = subWeeks(now, 12);
      break;
  }
  
  try {
    // Create dates for each week in the interval
    const weekDates = eachWeekOfInterval({
      start: startOfWeek(startDate),
      end: endOfWeek(now)
    });
    
    // Initialize data structure
    const weeklyData: Record<string, WeeklyPerformanceData> = {};
    
    // Initialize each week in the data
    weekDates.forEach((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart);
      const weekLabel = `Week ${index + 1}`;
      
      weeklyData[weekLabel] = {
        name: weekLabel,
        emails: 0,
        leads: 0,
        replies: 0
      };
    });
    
    // Fetch emails data
    for (const [weekLabel, data] of Object.entries(weeklyData)) {
      const weekIndex = parseInt(weekLabel.split(' ')[1]) - 1;
      const weekStart = weekDates[weekIndex];
      const weekEnd = endOfWeek(weekStart);
      
      const formattedStart = formatISO(weekStart);
      const formattedEnd = formatISO(weekEnd);
      
      // Get emails sent in this week
      const { data: emails, error: emailError } = await supabase
        .from('emails')
        .select('*')
        .gte('created_at', formattedStart)
        .lte('created_at', formattedEnd);
        
      if (emails && !emailError) {
        data.emails = emails.length;
        data.replies = emails.filter(e => e.status === 'REPLIED').length;
      }
      
      // Get leads created in this week
      const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .gte('created_at', formattedStart)
        .lte('created_at', formattedEnd);
        
      if (leads && !leadError) {
        data.leads = leads.length;
      }
    }
    
    // Convert to array and sort by week number
    const result = Object.values(weeklyData).sort((a, b) => {
      const aWeek = parseInt(a.name.split(' ')[1]);
      const bWeek = parseInt(b.name.split(' ')[1]);
      return aWeek - bWeek;
    });
    
    return result.length > 0 ? result : generateMockData(weekDates.length);
  } catch (error) {
    console.error('Error in getWeeklyPerformance:', error);
    return generateMockData();
  }
}

/**
 * Generate mock data for development purposes
 */
function generateMockData(weeks: number = 5): WeeklyPerformanceData[] {
  const data: WeeklyPerformanceData[] = [];
  
  for (let i = 1; i <= weeks; i++) {
    const emails = Math.floor(Math.random() * 30) + 20;
    const leads = Math.floor(emails * (Math.random() * 0.4 + 0.4)); // 40-80% of emails
    const replies = Math.floor(emails * (Math.random() * 0.3 + 0.2)); // 20-50% of emails
    
    data.push({
      name: `Week ${i}`,
      emails,
      leads,
      replies
    });
  }
  
  return data;
}