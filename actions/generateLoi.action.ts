"use server";

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { Lead, getLead, updateLead } from '@/lib/database';

interface LoiData {
  propertyAddress: string;
  offerPrice: number;
  earnestMoney: number;
  inspectionDays: number;
  closingDays: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
}

interface GenerateLoiResult {
  success: boolean;
  message: string;
  pdfBytes?: Uint8Array;
  filename?: string;
  error?: string;
}

// Core logic extracted to be testable
export async function generateLoiCore(
  loiData: LoiData,
  leadId?: string,
  dbGetLead = getLead,
  dbUpdateLead = updateLead
): Promise<GenerateLoiResult> {
  try {
    let lead: Lead | null = null;

    // If leadId is provided, get the lead and use its address
    if (leadId) {
      lead = await dbGetLead(leadId);
      if (!lead) {
        return {
          success: false,
          message: `Lead with ID ${leadId} not found`,
          error: 'Lead not found'
        };
      }

      // Use lead data if available
      loiData.propertyAddress = `${lead.property_address}, ${lead.property_city}, ${lead.property_state} ${lead.property_zip}`;
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add current date
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    page.drawText(`Date: ${date}`, {
      x: 50,
      y: height - 50,
      size: 12,
      font
    });
    
    // Add letterhead
    page.drawText('LETTER OF INTENT TO PURCHASE REAL ESTATE', {
      x: 50,
      y: height - 100,
      size: 16,
      font: boldFont
    });
    
    // Add property info
    page.drawText(`RE: ${loiData.propertyAddress}`, {
      x: 50,
      y: height - 150,
      size: 12,
      font: boldFont
    });
    
    // Add LOI body
    let yPosition = height - 200;
    
    const drawParagraph = (text: string, spacing = 20) => {
      page.drawText(text, {
        x: 50,
        y: yPosition,
        size: 12,
        font,
        lineHeight: 16,
        maxWidth: width - 100
      });
      yPosition -= spacing;
    };
    
    drawParagraph(`Dear Property Owner,`);
    drawParagraph(`This letter expresses our interest in purchasing the property located at ${loiData.propertyAddress}.`, 40);
    
    drawParagraph(`We offer the following terms:`, 30);
    drawParagraph(`1. Purchase Price: $${loiData.offerPrice.toLocaleString()}`, 25);
    drawParagraph(`2. Earnest Money: $${loiData.earnestMoney.toLocaleString()}`, 25);
    drawParagraph(`3. Inspection Period: ${loiData.inspectionDays} days`, 25);
    drawParagraph(`4. Closing Timeline: ${loiData.closingDays} days from acceptance`, 40);
    
    drawParagraph(`This letter of intent is not a binding contract but an expression of our interest in the property. We look forward to discussing this opportunity further and potentially moving toward a formal purchase agreement.`, 40);
    
    drawParagraph(`Sincerely,`, 30);
    drawParagraph(`${loiData.buyerName}`, 25);
    drawParagraph(`Email: ${loiData.buyerEmail}`, 25);
    drawParagraph(`Phone: ${loiData.buyerPhone}`, 25);
    
    // Generate the PDF
    const pdfBytes = await pdfDoc.save();
    
    // Generate filename
    const cleanAddress = loiData.propertyAddress
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    const filename = `${cleanAddress}-LOI.pdf`;
    
    // If we have a lead, update it
    if (lead && leadId) {
      await dbUpdateLead(leadId, {
        ...lead,
        loi_generated: true,
        loi_filename: filename,
        offer_price: loiData.offerPrice
      });
    }
    
    return {
      success: true,
      message: 'LOI generated successfully',
      pdfBytes,
      filename
    };
  } catch (error) {
    console.error('Error generating LOI:', error);
    return {
      success: false,
      message: `Failed to generate LOI: ${error instanceof Error ? error.message : String(error)}`,
      error: String(error)
    };
  }
}

// Server action that uses the core logic
export async function generateLoi(loiData: LoiData, leadId?: string): Promise<GenerateLoiResult> {
  return generateLoiCore(loiData, leadId);
}