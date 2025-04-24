"use server";

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { getTemplateById } from '@/lib/database';

// Path to template files
const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'templates');
const DEFAULT_TEMPLATE_PATH = path.join(TEMPLATE_DIR, 'default_loi_template.docx');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'generated');

interface LoiParams {
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  offerPrice: number;
  earnestMoney: number;
  closingDate: string;
  recipientName: string;
  companyLogoPath?: string;
  templateId?: string;  // Allow specifying a specific template
}

/**
 * Generate a Letter of Intent (LOI) document
 * @param params The parameters for generating the LOI
 * @returns The path to the generated document (relative to public folder)
 */
export async function generateLoi(params: LoiParams): Promise<string | null> {
  try {
    let templatePath = DEFAULT_TEMPLATE_PATH;
    
    // If a template ID is provided, try to get that template
    if (params.templateId) {
      const template = await getTemplateById(params.templateId);
      if (template && template.content) {
        // If this is a raw DOCX content in base64, save it temporarily
        const tempTemplatePath = path.join(TEMPLATE_DIR, `temp_${uuidv4()}.docx`);
        fs.writeFileSync(tempTemplatePath, Buffer.from(template.content, 'base64'));
        templatePath = tempTemplatePath;
      }
    }
    
    // Ensure the template exists
    if (!fs.existsSync(templatePath)) {
      console.error(`Template file not found: ${templatePath}`);
      return null;
    }
    
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Format the offer price and earnest money
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Create a unique filename for the output
    const fileName = `LOI_${params.propertyAddress.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.docx`;
    const outputPath = path.join(OUTPUT_DIR, fileName);
    
    // Load the template
    const template = fs.readFileSync(templatePath, 'binary');
    
    // Create a PizZip instance
    const zip = new PizZip(template);
    
    // Create a Docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });
    
    // Set the data for template rendering
    doc.setData({
      property_address: params.propertyAddress,
      property_city: params.propertyCity,
      property_state: params.propertyState,
      property_zip: params.propertyZip,
      full_address: `${params.propertyAddress}, ${params.propertyCity}, ${params.propertyState} ${params.propertyZip}`,
      offer_price: formatter.format(params.offerPrice),
      earnest_money: formatter.format(params.earnestMoney),
      closing_date: formatDate(params.closingDate),
      recipient_name: params.recipientName,
      current_date: formatDate(new Date().toISOString()),
      company_logo: params.companyLogoPath || '/logo.png',
    });
    
    // Render the document (replace all tags with their values)
    doc.render();
    
    // Generate the document as a buffer
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    
    // Write the generated document to the output path
    fs.writeFileSync(outputPath, buffer);
    
    // Return the path relative to the public directory
    const relativePath = '/generated/' + fileName;
    console.log(`Generated LOI at ${relativePath}`);
    
    // Clean up temporary template if used
    if (templatePath.includes('temp_') && templatePath !== DEFAULT_TEMPLATE_PATH) {
      try {
        fs.unlinkSync(templatePath);
      } catch (error) {
        console.warn('Failed to clean up temporary template:', error);
      }
    }
    
    return relativePath;
  } catch (error) {
    console.error('Error generating LOI:', error);
    return null;
  }
}

/**
 * Format a date string as MM/DD/YYYY
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

/**
 * Generate a PDF version of the LOI (placeholder for future implementation)
 */
export async function generateLoiPdf(params: LoiParams): Promise<string | null> {
  // This would use a PDF generation library like PDFKit
  // For now, we'll just return null as this is a future feature
  console.log('PDF generation not yet implemented');
  return null;
}