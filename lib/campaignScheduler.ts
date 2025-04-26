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
  updateCampaignLeadStatus,
  getCampaignUnassignedLeads,
  markLeadAsWorked,
  updateSenderStats,
  updateCampaignStats,
  updateCampaignProgress
} from '@/lib/database';
import { assignLeadsToCampaignSenders, markLeadWorkedAndGetNext } from '@/lib/leadAssignmentService';
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
 * Process a single campaign using round-robin lead distribution
 * @param {Campaign} campaign The campaign to process
 * @returns {Promise<number>} Number of emails processed
 */
export async function processCampaign(campaign: any): Promise<number> {
  console.log(`Processing campaign: ${campaign.name} (${campaign.id})`);
  
  try {
    // 1. Get campaign senders
    const senders = await getCampaignSenders(campaign.id);
    if (!senders || senders.length === 0) {
      console.log(`No senders found for campaign ${campaign.id}. Skipping.`);
      return 0;
    }
    
    // 2. Get unassigned leads for this campaign (still in PENDING status)
    const unassignedLeads = await getCampaignUnassignedLeads(campaign.id);
    if (!unassignedLeads || unassignedLeads.length === 0) {
      console.log(`No pending leads found for campaign ${campaign.id}. Skipping.`);
      return 0;
    }
    
    // 3. Calculate daily processing limit based on campaign settings
    const dailyLimit = campaign.leads_per_day || 10;
    const leadsToProcessNow = Math.min(unassignedLeads.length, dailyLimit);
    
    console.log(`Found ${unassignedLeads.length} unassigned leads. Processing ${leadsToProcessNow} now.`);
    
    // 4. Get the lead IDs to assign
    const leadIdsToAssign = unassignedLeads
      .slice(0, leadsToProcessNow)
      .map(lead => lead.id);
    
    // 5. Use our round-robin assignment algorithm to distribute leads to senders
    const assignmentResult = await assignLeadsToCampaignSenders(
      campaign.id,
      leadIdsToAssign
    );
    
    if (!assignmentResult.success) {
      console.log(`Failed to assign leads: ${assignmentResult.message}`);
      return 0;
    }
    
    console.log(`Successfully assigned ${leadIdsToAssign.length} leads to ${assignmentResult.assignments?.length} senders using round-robin distribution`);
    
    // 6. Process the assigned leads
    let processedCount = 0;
    
    if (!assignmentResult.assignments || assignmentResult.assignments.length === 0) {
      return 0;
    }
    
    // Process leads for each sender
    for (const assignment of assignmentResult.assignments) {
      const { senderId, leadIds } = assignment;
      
      // Get the sender details
      const sender = await getSenderById(senderId);
      if (!sender) continue;
      
      console.log(`Processing ${leadIds.length} leads for sender ${sender.email}`);
      
      // Process each lead assigned to this sender
      for (const leadId of leadIds) {
        // Get the lead details
        const lead = unassignedLeads.find(l => l.id === leadId);
        if (!lead) continue;
        
        // Add random delay between emails based on campaign settings
        const delayMinutes = getRandomInt(
          campaign.min_interval_minutes || 15,
          campaign.max_interval_minutes || 60
        );
        
        // Send the campaign email
        const emailSent = await sendCampaignEmail(campaign, sender, lead);
        
        // Update the lead status and record metrics
        if (emailSent) {
          // Make sure senderId is not undefined
          if (sender.id) {
            // Mark the lead as worked
            await markLeadWorkedAndGetNext(
              campaign.id,
              lead.id,
              sender.id,
              {
                status: 'CONTACTED',
                emailSent: true
              }
            );
          
            processedCount++;
          
            console.log(`Sent email for lead ${lead.id} from sender ${sender.email}. Next email in ${delayMinutes} minutes.`);
          
            // Simulate the delay (in a real implementation, this would be handled by a job queue)
            // Instead of actually waiting, we'll just log when the next email would be sent
            const nextEmailTime = new Date();
            nextEmailTime.setMinutes(nextEmailTime.getMinutes() + delayMinutes);
            console.log(`Next email will be sent at approximately: ${nextEmailTime.toLocaleTimeString()}`);
          }
        } else {
          // Record the failure
          if (sender.id) {
            await markLeadWorkedAndGetNext(
              campaign.id,
              lead.id,
              sender.id,
              {
                status: 'FAILED',
                emailSent: false
              }
            );
          }
          
          console.error(`Failed to send email for lead ${lead.id}`);
        }
      }
    }
    
    console.log(`Finished processing campaign ${campaign.id}. Processed ${processedCount} leads.`);
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
    
    // Check if the lead has contacts
    if (!lead.contacts || lead.contacts.length === 0) {
      console.error(`Lead ${lead.id} has no contacts to email`);
      return false;
    }
    
    // Use the primary contact, or the first one if no primary is marked
    const contact = lead.contacts.find((c: any) => c.is_primary) || lead.contacts[0];
    
    // Generate subject and body using campaign templates
    const subject = replacePlaceholders(campaign.email_subject || 'Letter of Intent for your property', lead, contact, sender);
    const body = replacePlaceholders(campaign.email_body || '<p>Please see the attached Letter of Intent.</p>', lead, contact, sender);
    
    // Check if we should generate and attach LOI
    let attachments = [];
    if (campaign.attachment_type === 'LOI' || campaign.loi_template_id) {
      // Generate LOI document
      const loiFileName = `LOI-${lead.property_address.replace(/\s+/g, "-")}.pdf`;
      
      const loiPath = await generateLoi({
        propertyAddress: lead.property_address,
        propertyCity: lead.property_city,
        propertyState: lead.property_state,
        propertyZip: lead.property_zip || '',
        offerPrice: lead.wholesale_value || 0,
        earnestMoney: Math.round((lead.wholesale_value || 0) * 0.01),
        closingDate: getClosingDate(14), // 14 days from now
        recipientName: contact.name || 'Property Owner',
        companyLogoPath: campaign.company_logo_path || null,
        templateId: campaign.loi_template_id || null
      });
      
      if (loiPath) {
        attachments.push({
          path: loiPath,
          filename: loiFileName
        });
      } else {
        console.error(`Failed to generate LOI document for lead ${lead.id}`);
      }
    }
    
    // Create email record with tracking ID only if tracking is enabled
    const trackingEnabled = campaign.tracking_enabled !== false; // Default to true if undefined
    const trackingId = trackingEnabled ? uuidv4() : undefined;
    
    const emailRecord = await createEmail({
      lead_id: lead.id,
      sender_id: sender.id || '',
      subject,
      body,
      loi_path: attachments[0]?.path || undefined,
      status: 'PENDING',
      tracking_id: trackingId,
      campaignId: campaign.id
    });
    
    if (!emailRecord) {
      console.error(`Failed to create email record for lead ${lead.id}`);
      return false;
    }
    
    // Send the email - ensure we're using the correct parameter structure
    const emailResult = await sendEmail({
      to: contact.email,
      subject,
      body,
      attachments,
      trackingEnabled,
      trackingId,
      senderId: sender.id || '',
      senderName: sender.name,
      senderEmail: sender.email,
      userId: campaign.user_id // Owner of the campaign
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
      sent_at: new Date().toISOString(),
      message_id: emailResult.emailId || undefined
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
function replacePlaceholders(template: string, lead: any, contact: any, sender: any): string {
  let result = template;
  
  // Replace lead-related placeholders
  result = result
    .replace(/\{\{property_address\}\}/g, lead.property_address || '')
    .replace(/\{\{property_city\}\}/g, lead.property_city || '')
    .replace(/\{\{property_state\}\}/g, lead.property_state || '')
    .replace(/\{\{property_zip\}\}/g, lead.property_zip || '')
    .replace(/\{\{days_on_market\}\}/g, lead.days_on_market?.toString() || '0')
    .replace(/\{\{offer_price\}\}/g, formatCurrency(lead.wholesale_value || 0));
  
  // Replace contact-related placeholders
  if (contact) {
    result = result
      .replace(/\{\{contact_name\}\}/g, contact.name || 'Property Owner')
      .replace(/\{\{contact_email\}\}/g, contact.email || '');
  }
  
  // Replace sender-related placeholders
  if (sender) {
    result = result
      .replace(/\{\{sender_name\}\}/g, sender.name || '')
      .replace(/\{\{sender_email\}\}/g, sender.email || '')
      .replace(/\{\{sender_phone\}\}/g, sender.phone || '')
      .replace(/\{\{sender_title\}\}/g, sender.title || '')
      .replace(/\{\{company_name\}\}/g, sender.company_name || 'Our Company');
  }
  
  // Replace date-related placeholders
  result = result
    .replace(/\{\{closing_date\}\}/g, getClosingDate(14))
    .replace(/\{\{expiration_date\}\}/g, getClosingDate(7))
    .replace(/\{\{earnest_money\}\}/g, formatCurrency((lead.wholesale_value || 0) * 0.01));
  
  return result;
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