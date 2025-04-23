"use server";

import { generateLoi } from './generateLoi.action';
import { sendEmail } from './sendEmail.action';
import { createEmail, updateEmailStatus, getLeadById, getSenderByEmail } from '@/lib/database';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface SendLoiEmailParams {
  leadId: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  senderEmail: string;
  loiParams: {
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;
    offerPrice: number;
    earnestMoney: number;
    closingDate: string;
    companyLogoPath?: string;
  };
}

interface SendLoiEmailResult {
  success: boolean;
  message: string;
  loiPath?: string;
  emailId?: string;
}

export async function sendLoiEmail(params: SendLoiEmailParams): Promise<SendLoiEmailResult> {
  const {
    leadId,
    recipientEmail,
    recipientName,
    subject,
    body,
    senderEmail,
    loiParams
  } = params;

  try {
    // First, generate the LOI document
    const loiPath = await generateLoi({
      ...loiParams,
      recipientName
    });

    if (!loiPath) {
      return {
        success: false,
        message: "Failed to generate LOI document"
      };
    }

    // Get the sender from database
    const sender = await getSenderByEmail(senderEmail);
    if (!sender) {
      return {
        success: false,
        message: `Sender with email ${senderEmail} not found`
      };
    }

    // Create a record in the emails table
    const emailRecord = await createEmail({
      lead_id: leadId,
      sender_id: sender.id!,
      subject,
      body,
      loi_path: loiPath,
      status: 'PENDING',
      tracking_id: uuidv4()
    });

    if (!emailRecord) {
      return {
        success: false,
        message: "Failed to create email record in the database"
      };
    }

    // Full path to the LOI file
    const fullPath = path.join(process.cwd(), 'public', loiPath.replace(/^\//, ''));

    // Send the email with the LOI attachment
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject,
      body,
      attachmentPath: fullPath,
      senderEmail
    });

    if (!emailResult.success) {
      // Update the email record to reflect the failure
      await updateEmailStatus(emailRecord.id!, 'FAILED', {
        bounce_reason: emailResult.message
      });

      return {
        success: false,
        message: `Failed to send email: ${emailResult.message}`,
        loiPath
      };
    }

    // Update the email record to reflect successful sending
    await updateEmailStatus(emailRecord.id!, 'SENT', {
      sent_at: new Date().toISOString()
    });

    // Update the lead status to reflect that it has been contacted
    const lead = await getLeadById(leadId);
    if (lead && lead.status === 'NEW') {
      // Only update the status if it's still "NEW"
      await updateLeadStatus(leadId, 'CONTACTED');
    }

    return {
      success: true,
      message: "LOI generated and email sent successfully",
      loiPath,
      emailId: emailRecord.id
    };

  } catch (error) {
    console.error('Error in sendLoiEmail:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Helper function to update lead status
async function updateLeadStatus(leadId: string, status: string): Promise<void> {
  try {
    await fetch('/api/leads/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ leadId, status }),
    });
  } catch (error) {
    console.error('Error updating lead status:', error);
  }
}