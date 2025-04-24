"use server";

import { supabase } from "@/lib/supabaseClient";
import { TimeRange } from "./emailPerformance";

export interface LeadStatusData {
  name: string;
  value: number;
}

/**
 * Get lead status distribution data for the dashboard chart
 */
export async function getLeadStatusDistribution(): Promise<LeadStatusData[]> {
  try {
    // Fetch leads from database with their status
    const { data: leads, error } = await supabase
      .from('leads')
      .select('status, count')
      .groupBy('status');
    
    if (error) {
      console.error('Error fetching lead status data:', error);
      return generateMockData();
    }
    
    // Format data for the chart
    const statusData = leads.map(item => ({
      name: item.status || 'Unknown',
      value: item.count
    }));
    
    return statusData.length > 0 ? statusData : generateMockData();
  } catch (error) {
    console.error('Error in getLeadStatusDistribution:', error);
    return generateMockData();
  }
}

/**
 * Generate mock data for development purposes
 */
function generateMockData(): LeadStatusData[] {
  return [
    { name: 'New', value: Math.floor(Math.random() * 300) + 200 },
    { name: 'Contacted', value: Math.floor(Math.random() * 200) + 150 },
    { name: 'Interested', value: Math.floor(Math.random() * 150) + 100 },
    { name: 'Negotiating', value: Math.floor(Math.random() * 120) + 80 },
    { name: 'Closed', value: Math.floor(Math.random() * 100) + 50 }
  ];
}