"use server";

import { supabase } from "../lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { generateLoi } from "./generateLoi.action";
import { sendEmail } from "./sendEmail.action";
import fs from "fs";
import path from "path";

// We only use mock data for the lead - everything else should be real
let mockLeads: any = [];

// Load mock lead data for testing
async function loadMockLeadData() {
  try {
    // Load mock lead data synchronously to ensure it's available
    const leadsData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "data/mock_leads.json"), "utf8")
    );
    mockLeads = leadsData.leads;
    return mockLeads;
  } catch (error) {
    console.error("Error loading mock lead data:", error);
    throw new Error("Failed to load mock lead data for sender validation");
  }
}

/**
 * Validates a sender by sending a test email using the campaign's actual template format
 * This allows users to visually verify that sender accounts are properly configured
 * The validation checks:
 * 1. Sender OAuth tokens are valid and can authenticate with Gmail
 * 2. Email content renders correctly with the campaign's template
 * 3. Document attachments generate correctly
 */
export async function validateSender(
  campaignId: string,
  senderId: string,
  userId: string,
  userEmail: string
) {
  try {
    console.log(`Starting validation for sender ${senderId} in campaign ${campaignId}`);
    
    // Load mock lead data for validation (only leads are mocked)
    const mockLeadData = await loadMockLeadData();
    const mockLead = mockLeadData[Math.floor(Math.random() * mockLeadData.length)];
    
    // Get the actual campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select(`
        *,
        email_template:email_template_id(*),
        loi_template:loi_template_id(*)
      `)
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Error fetching campaign data: ${campaignError?.message}`);
    }

    // Get the actual sender data
    const { data: sender, error: senderError } = await supabase
      .from("senders")
      .select(`
        *,
        oauth_tokens(*)
      `)
      .eq("id", senderId)
      .single();

    if (senderError || !sender) {
      throw new Error(`Error fetching sender data: ${senderError?.message}`);
    }

    // Verify OAuth token exists for this sender
    if (!sender.oauth_tokens || !sender.oauth_tokens.access_token) {
      throw new Error("Sender does not have valid OAuth authentication set up. Please connect the sender's email account first.");
    }

    // Generate validation email subject with indicator
    const subject = `[TEST] ${replacePlaceholders(
      campaign.email_subject || "Letter of Intent for your property", 
      mockLead, 
      sender
    )}`;

    // Create test email content with validation header
    let content = `
      <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
        <h3 style="color: #007bff; margin-top: 0;">Sender Validation Test Email</h3>
        <p>This is an automated test email to verify sender configuration for campaign: <strong>${campaign.name}</strong></p>
        <p>Sender: ${sender.name} (${sender.email})</p>
        <p>If this email and any attachments look correct, the sender is properly configured.</p>
        <hr style="border-top: 1px solid #dee2e6; margin: 15px 0;" />
        <h4>Below is a preview of how your emails will appear:</h4>
      </div>
    `;
    
    // Add the actual template content or default content
    content += replacePlaceholders(
      campaign.email_body || campaign.email_template?.content || "<p>Please see the attached Letter of Intent.</p>", 
      mockLead, 
      sender
    );

    // Add validation footer
    content += `
      <div style="margin-top: 30px; border-top: 1px solid #dee2e6; padding-top: 15px; font-size: 0.85em; color: #6c757d;">
        <p>This is a test email sent as part of the DealPig campaign sender validation process.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      </div>
    `;

    let attachments = [];

    // Check if the campaign includes document attachments
    if (campaign.attachment_type === 'LOI' && campaign.loi_template_id) {
      try {
        // Generate a sample LOI document using actual template
        const loiData = {
          propertyAddress: mockLead.property_address,
          propertyCity: mockLead.property_city,
          propertyState: mockLead.property_state,
          propertyZip: mockLead.property_zip || '',
          offerPrice: Math.round(mockLead.wholesale_value * 0.9),
          earnestMoney: 2500,
          closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          recipientName: mockLead.contacts && mockLead.contacts[0] ? mockLead.contacts[0].name : 'Property Owner',
          companyLogoPath: campaign.company_logo_path || null,
          templateId: campaign.loi_template_id
        };
        
        // Generate LOI file path
        const loiPath = await generateLoi(loiData);
        
        if (loiPath) {
          // Add LOI to attachments
          const loiFileName = `TEST-LOI-${mockLead.property_address.replace(/\s+/g, "-")}.pdf`;
          
          attachments.push({
            path: loiPath,
            filename: loiFileName
          });
          
          // Add note about the attachment to the email content
          content += `
            <div style="background-color: #e8f4ff; border: 1px solid #b8daff; padding: 10px; margin-top: 20px; border-radius: 4px;">
              <p><strong>Document Attachment Included:</strong> Letter of Intent for ${mockLead.property_address}</p>
            </div>
          `;
        } else {
          throw new Error("Failed to generate LOI document");
        }
      } catch (error) {
        console.error("Error generating LOI for validation:", error);
        content += `
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin-top: 20px; border-radius: 4px;">
            <p><strong>Error generating document attachment.</strong> Please check your document template configuration.</p>
            <p>Error: ${error instanceof Error ? error.message : "Unknown error"}</p>
          </div>
        `;
      }
    }

    // Send the validation test email using the real sender but to the user's email address
    const emailResult = await sendEmail({
      to: userEmail,  
      subject,
      body: content,
      attachments: attachments,
      trackingEnabled: true,
      trackingId: `validation-${Date.now()}`,
      senderId: sender.id,
      senderName: sender.name,
      senderEmail: sender.email,
      userId
    });

    if (!emailResult.success) {
      throw new Error(`Failed to send validation email: ${emailResult.message}`);
    }

    return { 
      success: true, 
      message: `Validation email sent to ${userEmail} from ${sender.email}. Check your inbox to verify the sender configuration.` 
    };
  } catch (error) {
    console.error("Error validating sender:", error);
    return {
      success: false,
      message: `Error validating sender: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

/**
 * Replace placeholders in template with actual values
 */
function replacePlaceholders(template: string, lead: any, sender: any): string {
  let result = template;
  
  // Replace lead-related placeholders
  if (lead) {
    result = result.replace(/\{\{property_address\}\}/g, lead.property_address || "");
    result = result.replace(/\{\{property_city\}\}/g, lead.property_city || "");
    result = result.replace(/\{\{property_state\}\}/g, lead.property_state || "");
    result = result.replace(/\{\{property_zip\}\}/g, lead.property_zip || "");
    result = result.replace(/\{\{contact_name\}\}/g, lead.contacts && lead.contacts[0] ? lead.contacts[0].name : "Property Owner");
    result = result.replace(/\{\{days_on_market\}\}/g, lead.days_on_market?.toString() || "0");
    
    // Calculate offer at 90% of wholesale value
    const offerPrice = Math.round(lead.wholesale_value * 0.9).toLocaleString();
    result = result.replace(/\{\{offer_price\}\}/g, offerPrice);
  }
  
  // Replace sender-related placeholders
  if (sender) {
    result = result.replace(/\{\{sender_name\}\}/g, sender.name || "");
    result = result.replace(/\{\{sender_email\}\}/g, sender.email || "");
    result = result.replace(/\{\{sender_phone\}\}/g, sender.phone || "");
    result = result.replace(/\{\{sender_title\}\}/g, sender.title || "");
    result = result.replace(/\{\{company_name\}\}/g, sender.company_name || "");
  }
  
  // Replace date placeholders
  const closingDate = new Date();
  closingDate.setDate(closingDate.getDate() + 30);
  result = result.replace(/\{\{closing_date\}\}/g, closingDate.toLocaleDateString());
  
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 7);
  result = result.replace(/\{\{expiration_date\}\}/g, expirationDate.toLocaleDateString());
  
  // Default values for other common placeholders
  result = result.replace(/\{\{earnest_money\}\}/g, "2,500");
  result = result.replace(/\{\{title_company\}\}/g, "Trusted Title Services");
  result = result.replace(/\{\{due_diligence_days\}\}/g, "14");
  result = result.replace(/\{\{closing_timeline\}\}/g, "21");
  
  return result;
}