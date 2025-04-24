"use server";

import { generateLoi } from '@/actions/generateLoi.action';
import { sendEmail } from '@/actions/sendEmail.action';
import { 
  getCampaigns, 
  getCampaignSenders, 
  getCampaignLeads, 
  updateLeadStatus, 
  createEmail, 
  updateEmailStatus,
  getSenderById,
  updateSenderStats,
  updateCampaignProgress
} from '@/lib/database';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

/**
 * Main function to process campaigns - this will be called by a CRON job
 * @returns {Promise<void>}
 */
export async function processCampaigns(): Promise<{ success: boolean, message: string, processed: number }> {
  try {
    console.log('Starting campaign processing...');
    
    // Get all active campaigns
    const activeCampaigns = await getCampaigns('ACTIVE');
    
    if (!activeCampaigns || activeCampaigns.length === 0) {
      return { 
        success: true, 
        message: 'No active campaigns to process', 
        processed: 0 
      };
    }
    
    console.log(`Found ${activeCampaigns.length} active campaigns`);
    let totalProcessed = 0;
    
    // Process each campaign
    for (const campaign of activeCampaigns) {
      // Check if we should process this campaign now based on time window
      if (!isWithinCampaignTimeWindow(campaign)) {
        console.log(`Campaign ${campaign.name} (${campaign.id}) is outside its scheduled time window. Skipping.`);
        continue;
      }
      
      const processed = await processCampaign(campaign);
      totalProcessed += processed;
    }
    
    return { 
      success: true, 
      message: `Successfully processed ${totalProcessed} emails across ${activeCampaigns.length} campaigns`, 
      processed: totalProcessed 
    };
    
  } catch (error) {
    console.error('Error in processCampaigns:', error);
    return { 
      success: false, 
      message: `Error processing campaigns: ${error instanceof Error ? error.message : String(error)}`,
      processed: 0
    };
  }
}

/**
 * Process a single campaign
 * @param {Campaign} campaign The campaign to process
 * @returns {Promise<number>} Number of emails processed
 */
async function processCampaign(campaign: any): Promise<number> {
  console.log(`Processing campaign: ${campaign.name} (${campaign.id})`);
  
  try {
    // 1. Get campaign senders
    const senders = await getCampaignSenders(campaign.id);
    if (!senders || senders.length === 0) {
      console.log(`No senders found for campaign ${campaign.id}. Skipping.`);
      return 0;
    }
    
    // 2. Get pending leads for this campaign that haven't been worked yet
    const pendingLeads = await getCampaignLeads(campaign.id, 'PENDING');
    if (!pendingLeads || pendingLeads.length === 0) {
      console.log(`No pending leads found for campaign ${campaign.id}. Skipping.`);
      return 0;
    }
    
    // 3. Calculate how many leads each sender should process now based on daily quotas
    const dailyLimit = campaign.leads_per_day || 10;
    const leadsPerSender = Math.ceil(dailyLimit / senders.length);
    console.log(`Processing up to ${dailyLimit} leads (${leadsPerSender} per sender)`);
    
    let processedCount = 0;
    
    // 4. Process leads for each sender up to their limit
    for (const sender of senders) {
      // Check if sender has already reached their daily limit
      if (sender.emails_sent_today >= leadsPerSender) {
        console.log(`Sender ${sender.email} has reached their daily limit. Skipping.`);
        continue;
      }
      
      // Calculate how many more emails this sender can send today
      const remainingQuota = leadsPerSender - (sender.emails_sent_today || 0);
      
      // Get the leads for this sender to work
      const leadsToProcess = pendingLeads.slice(
        processedCount, 
        processedCount + remainingQuota
      );
      
      if (leadsToProcess.length === 0) break;
      
      // Process each lead for this sender
      for (const lead of leadsToProcess) {
        // Add random delay between emails based on campaign settings
        const delayMinutes = getRandomInt(
          campaign.min_interval_minutes || 15,
          campaign.max_interval_minutes || 60
        );
        
        // Schedule the email to be sent after the delay
        await sendCampaignEmail(campaign, sender, lead);
        
        // Update lead status
        await updateLeadStatus(lead.id, 'IN_PROGRESS');
        
        // Update processed count
        processedCount++;
        
        console.log(`Scheduled email for lead ${lead.id} from sender ${sender.email}. Next email in ${delayMinutes} minutes.`);
        
        // Simulate the delay (in a real implementation, this would be handled by a job queue)
        // Instead of actually waiting, we'll just log when the next email would be sent
        const nextEmailTime = new Date();
        nextEmailTime.setMinutes(nextEmailTime.getMinutes() + delayMinutes);
        console.log(`Next email will be sent at approximately: ${nextEmailTime.toLocaleTimeString()}`);
      }
      
      // Update sender stats
      await updateSenderStats(sender.id, {
        emails_sent_today: (sender.emails_sent_today || 0) + leadsToProcess.length,
        total_emails_sent: (sender.total_emails_sent || 0) + leadsToProcess.length,
        last_sent_at: new Date().toISOString()
      });
    }
    
    // 5. Update campaign progress
    await updateCampaignProgress(campaign.id, processedCount);
    
    return processedCount;
    
  } catch (error) {
    console.error(`Error processing campaign ${campaign.id}:`, error);
    return 0;
  }
}

/**
 * Send an email for a campaign to a specific lead
 */
async function sendCampaignEmail(campaign: any, sender: any, lead: any): Promise<boolean> {
  try {
    console.log(`Sending campaign email to lead ${lead.id} from ${sender.email}`);
    
    // Get sender details
    const senderDetails = await getSenderById(sender.id);
    if (!senderDetails) {
      console.error(`Sender ${sender.id} not found`);
      return false;
    }
    
    // Generate subject and body using campaign templates
    const subject = replacePlaceholders(campaign.email_subject || 'Letter of Intent for your property', lead);
    const body = replacePlaceholders(campaign.email_body || '<p>Please see the attached Letter of Intent.</p>', lead);
    
    // Generate LOI document
    const loiPath = await generateLoi({
      propertyAddress: lead.property_address,
      propertyCity: lead.property_city,
      propertyState: lead.property_state,
      propertyZip: lead.property_zip || lead.property_postal_code,
      offerPrice: lead.offer_price || lead.wholesale_value,
      earnestMoney: Math.round((lead.offer_price || lead.wholesale_value) * 0.01),
      closingDate: getClosingDate(14), // 14 days from now
      recipientName: lead.contact_name || lead.owner_name || 'Property Owner',
      companyLogoPath: campaign.company_logo_path
    });
    
    if (!loiPath) {
      console.error(`Failed to generate LOI document for lead ${lead.id}`);
      return false;
    }
    
    // Create email record
    const trackingId = uuidv4();
    const emailRecord = await createEmail({
      lead_id: lead.id,
      sender_id: sender.id,
      subject,
      body,
      loi_path: loiPath,
      status: 'PENDING',
      tracking_id: trackingId,
      campaign_id: campaign.id
    });
    
    if (!emailRecord) {
      console.error(`Failed to create email record for lead ${lead.id}`);
      return false;
    }
    
    // Full path to the LOI file
    const fullPath = path.join(process.cwd(), 'public', loiPath.replace(/^\//, ''));
    
    // Send the email
    const emailResult = await sendEmail({
      to: lead.contact_email || lead.email,
      subject,
      body,
      attachmentPath: fullPath,
      senderEmail: sender.email
    });
    
    if (!emailResult.success) {
      // Update email record to reflect failure
      await updateEmailStatus(emailRecord.id!, 'FAILED', {
        bounce_reason: emailResult.message
      });
      console.error(`Failed to send email for lead ${lead.id}: ${emailResult.message}`);
      return false;
    }
    
    // Update email record to reflect successful sending
    await updateEmailStatus(emailRecord.id!, 'SENT', {
      sent_at: new Date().toISOString()
    });
    
    console.log(`Successfully sent email for lead ${lead.id}`);
    return true;
    
  } catch (error) {
    console.error(`Error sending campaign email:`, error);
    return false;
  }
}

/**
 * Check if current time is within the campaign's scheduled time window
 */
function isWithinCampaignTimeWindow(campaign: any): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;
  
  // Parse campaign start and end times
  const startParts = (campaign.start_time || '09:00:00').split(':');
  const endParts = (campaign.end_time || '17:00:00').split(':');
  
  const startTime = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
  const endTime = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
  
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * Get a future date formatted as YYYY-MM-DD
 */
function getClosingDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Get a random integer between min and max (inclusive)
 */
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Replace placeholders in a template with lead data
 */
function replacePlaceholders(template: string, lead: any): string {
  return template
    .replace(/\{property_address\}/g, lead.property_address || '')
    .replace(/\{property_city\}/g, lead.property_city || '')
    .replace(/\{property_state\}/g, lead.property_state || '')
    .replace(/\{property_zip\}/g, lead.property_zip || lead.property_postal_code || '')
    .replace(/\{contact_name\}/g, lead.contact_name || lead.owner_name || 'Property Owner')
    .replace(/\{offer_price\}/g, formatCurrency(lead.offer_price || lead.wholesale_value))
    .replace(/\{earnest_money\}/g, formatCurrency((lead.offer_price || lead.wholesale_value) * 0.01));
}

/**
 * Format a number as currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}