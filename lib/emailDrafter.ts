import { supabase } from './supabase';
import { sendMail, getClientFromSender } from './gmail'; // Replaced sendGmailEmail with available functions
import { 
  Campaign,
  Lead,
  Sender,
  Template,
  EmailTemplate,
  DocumentTemplate,
  EmailStatus,
  UUID,
  CampaignLeadStatus
} from '@/helpers/types';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid'; // Added uuid for generating UUIDs

// Need to install html-pdf package
// For now, let's create a mock implementation
interface PdfOptions {
  format: string;
  border: Record<string, string>;
  header: Record<string, string>;
  footer: Record<string, string>;
}

interface PdfResult {
  toFile: (path: string, callback: (err: Error | null, res: any) => void) => void;
}

// Mock PDF generator until html-pdf is installed
const pdfLib = {
  create: (html: string, options: PdfOptions): PdfResult => {
    return {
      toFile: (filePath: string, callback: (err: Error | null, res: any) => void) => {
        // This is a mock implementation
        fs.promises.writeFile(filePath, html)
          .then(() => callback(null, { filename: filePath }))
          .catch(err => callback(err, null));
      }
    };
  }
};

// Convert template literals to actual values
function parseTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return variables[trimmedKey] !== undefined ? variables[trimmedKey] : match;
  });
}

/**
 * Prepare email content by replacing template variables with lead data
 */
export function prepareEmailContent(template: Template, lead: Lead, sender: Sender): string {
  // Create variables object from lead and sender data
  const variables: Record<string, any> = {
    // Lead property data
    property_address: lead.property_address || '',
    property_city: lead.property_city || '',
    property_state: lead.property_state || '',
    property_zip: lead.property_zip || '',
    property_type: lead.property_type || '',
    beds: lead.beds || '',
    baths: lead.baths || '',
    square_footage: lead.square_footage || '',
    year_built: lead.year_built || '',
    market_value: lead.market_value?.toLocaleString() || '',
    wholesale_value: lead.wholesale_value?.toLocaleString() || '',
    assessed_total: lead.assessed_total?.toLocaleString() || '',
    
    // Owner data
    owner_name: lead.owner_name || '',
    owner_first_name: lead.owner_name?.split(' ')[0] || '',
    owner_last_name: lead.owner_name?.split(' ').slice(1).join(' ') || '',
    
    // Mailing address
    mailing_address: lead.mailing_address || '',
    mailing_city: lead.mailing_city || '',
    mailing_state: lead.mailing_state || '',
    mailing_zip: lead.mailing_zip || '',
    
    // Contact details - main contact email (using first available)
    contact_email: lead.contact1email_1 || lead.contact2email_1 || '',
    contact_phone: lead.contact1phone_1 || lead.contact2phone_1 || '',
    
    // Sender details
    sender_name: sender.name || '',
    sender_email: sender.email || '',
    sender_title: sender.title || '',
    
    // Date
    current_date: new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  };
  
  // Parse the template with the variables
  return parseTemplate(template.content, variables);
}

/**
 * Generate document attachment from template
 * Returns the path to the generated file
 */
export async function generateDocument(template: DocumentTemplate | Template, lead: Lead, sender: Sender, campaignId: UUID): Promise<string | null> {
  try {
    // Parse the document template
    const documentContent = prepareEmailContent(template, lead, sender);
    
    // Set up PDF generation options
    const options = {
      format: 'Letter',
      border: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      header: {
        height: '15mm'
      },
      footer: {
        height: '15mm'
      }
    };
    
    // Generate a unique file name
    const fileName = `document_${campaignId}_${lead.id}_${Date.now()}.pdf`;
    const uploadPath = path.join('/tmp', fileName); // Temporary local path
    
    // Create PDF 
    await new Promise<void>((resolve, reject) => {
      pdfLib.create(documentContent, options).toFile(uploadPath, (err, res) => {
        if (err) reject(err);
        else resolve();
      });
    });
    
    // Upload the PDF to storage
    const storageKey = `documents/${campaignId}/${fileName}`;
    
    const fileContent = await fs.promises.readFile(uploadPath);
    const { data, error } = await supabase.storage
      .from('attachments')
      .upload(storageKey, fileContent, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    // Delete local temp file
    await fs.promises.unlink(uploadPath);
    
    if (error) {
      throw error;
    }
    
    // Return the public URL to the file
    const { data: urlData } = await supabase.storage
      .from('attachments')
      .getPublicUrl(storageKey);
    
    return urlData?.publicUrl || null;
  } catch (error) {
    console.error('Error generating document:', error);
    return null;
  }
}

/**
 * Process one email task from the schedule
 */
export async function processEmailTask(taskId: UUID): Promise<boolean> {
  try {
    // Get the email task
    const { data: task, error: taskError } = await supabase
      .from('email_schedules')
      .select(`
        id, 
        lead_id, 
        sender_id, 
        campaign_id, 
        status,
        tracking_id,
        lead:lead_id(*), 
        sender:sender_id(*), 
        campaign:campaign_id(*, email_template:email_template_id(*), document_template:loi_template_id(*))
      `)
      .eq('id', taskId)
      .single();
    
    if (taskError || !task) {
      throw taskError || new Error(`Task with ID ${taskId} not found`);
    }
    
    // Skip if already processed
    if (task.status !== EmailStatus.PENDING) {
      console.log(`Task ${taskId} already processed (status: ${task.status})`);
      return false;
    }
    
    // Extract objects from the task result - fix type casting
    const lead = task.lead as unknown as Lead;
    const sender = task.sender as unknown as Sender;
    const campaign = task.campaign as unknown as Campaign & {
      email_template: EmailTemplate;
      document_template: DocumentTemplate;
    };
    
    const emailTemplate = campaign?.email_template;
    
    if (!lead || !sender || !campaign || !emailTemplate) {
      throw new Error(`Missing required data for task ${taskId}`);
    }
    
    // Generate email content from template
    const emailContent = prepareEmailContent(emailTemplate, lead, sender);
    
    // Generate subject line (use template subject or default)
    const subject = parseTemplate(emailTemplate.subject || 'Property at {{property_address}}', {
      property_address: lead.property_address || 'your property',
      property_city: lead.property_city || '',
      owner_first_name: lead.owner_name?.split(' ')[0] || ''
    });
    
    // Generate document if needed
    let attachmentUrl = null;
    if (campaign.attachment_type && campaign.document_template) {
      attachmentUrl = await generateDocument(campaign.document_template, lead, sender, campaign.id);
    }
    
    // Prepare email record
    const trackingId = task.tracking_id || uuidv4();
    
    const emailRecord = {
      lead_id: lead.id,
      sender_id: sender.id,
      campaign_id: campaign.id,
      subject: subject,
      body: emailContent,
      loi_path: attachmentUrl,
      status: EmailStatus.PENDING,
      tracking_id: trackingId
    };
    
    // Insert email record
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .insert(emailRecord)
      .select()
      .single();
    
    if (emailError) {
      throw emailError;
    }
    
    // Send the email using Gmail API
    const recipient = lead.contact1email_1 || lead.contact2email_1 || '';
    if (!recipient) {
      throw new Error(`No recipient email found for lead ${lead.id}`);
    }
    
    // Get auth client from sender
    const auth = getClientFromSender(sender);
    
    // Create attachments array if needed
    const attachments = attachmentUrl ? [{
      filename: `Offer_${lead.property_address || 'Property'}.pdf`,
      content: attachmentUrl,
      encoding: 'base64' as const
    }] : [];
    
    try {
      // Send the email
      const sendResult = await sendMail({
        auth,
        to: recipient,
        subject: subject,
        html: emailContent,
        from: `${sender.name} <${sender.email}>`,
        attachments
      });
      
      // Update email status to sent
      const updateData: any = {
        status: EmailStatus.SENT,
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Update email record with status
      await supabase
        .from('emails')
        .update(updateData)
        .eq('id', email.id);
      
      // Update task as processed
      await supabase
        .from('email_schedules')
        .update({
          status: CampaignLeadStatus.PROCESSED,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);
      
      // Update campaign_lead status
      await supabase
        .from('campaign_leads')
        .update({
          status: CampaignLeadStatus.PROCESSED,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('campaign_id', campaign.id)
        .eq('lead_id', lead.id);
      
      return true;
    } catch (err: any) {
      // Handle email sending error
      const updateData: any = {
        status: EmailStatus.BOUNCED,
        bounced_at: new Date().toISOString(),
        bounce_reason: err.message || 'Unknown error',
        updated_at: new Date().toISOString()
      };
      
      // Update email record with error status
      await supabase
        .from('emails')
        .update(updateData)
        .eq('id', email.id);
      
      throw err;
    }
  } catch (error: any) {
    console.error(`Error processing email task ${taskId}:`, error);
    
    // Update task as errored
    await supabase
      .from('email_schedules')
      .update({
        status: 'ERROR',
        error_message: error.message || 'Unknown error',
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);
    
    return false;
  }
}

/**
 * Process all pending emails that are due
 */
export async function processScheduledEmails(): Promise<void> {
  try {
    const now = new Date();
    
    // Get all scheduled emails that are due
    const { data: tasks, error } = await supabase
      .from('email_schedules')
      .select('id')
      .eq('status', EmailStatus.PENDING)
      .lte('scheduled_for', now.toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(50); // Process in batches
    
    if (error) throw error;
    
    if (!tasks || tasks.length === 0) {
      console.log('No scheduled emails to process');
      return;
    }
    
    console.log(`Processing ${tasks.length} scheduled emails`);
    
    // Process each task in sequence to avoid rate limits
    for (const task of tasks) {
      await processEmailTask(task.id);
      
      // Add a small delay between email sends to avoid spam detection
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    }
    
    console.log(`Completed processing ${tasks.length} scheduled emails`);
  } catch (error) {
    console.error('Error processing scheduled emails:', error);
    throw error;
  }
}