"use server";

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { getTemplateById } from '@/lib/database';
import { downloadFromStorage, uploadToStorage, getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Bucket names for storage
const TEMPLATE_BUCKET = 'templates';
const GENERATED_BUCKET = 'generated-documents';

// Keep local paths for fallback
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
 * @returns The path to the generated document (relative to public folder or full URL)
 */
export async function generateLoi(params: LoiParams): Promise<string | null> {
  try {
    let templateContent: Buffer | null = null;
    let templateFileName = 'default_loi_template.docx';
    
    // Try to get template from Supabase storage if a template ID is provided
    if (params.templateId) {
      // First get template details from database
      const template = await getTemplateById(params.templateId);
      
      if (template && template.path) {
        // If the template has a path in storage, download it
        templateContent = await downloadFromStorage(TEMPLATE_BUCKET, template.path);
        templateFileName = template.path.split('/').pop() || templateFileName;
      } else if (template && template.content) {
        // If this is a raw DOCX content in base64, convert it to buffer
        templateContent = Buffer.from(template.content, 'base64');
        templateFileName = `template_${template.id}.docx`;
      }
    }
    
    // If we couldn't get the template from Supabase, use the default local one
    if (!templateContent) {
      // Check if default template exists in Supabase storage
      try {
        templateContent = await downloadFromStorage(TEMPLATE_BUCKET, 'default_loi_template.docx');
      } catch (error) {
        // If not in storage, use local file as fallback
        if (fs.existsSync(DEFAULT_TEMPLATE_PATH)) {
          templateContent = fs.readFileSync(DEFAULT_TEMPLATE_PATH);
        } else {
          console.error(`Default template file not found: ${DEFAULT_TEMPLATE_PATH}`);
          return null;
        }
      }
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
    
    // Ensure we have valid template content before proceeding
    if (!templateContent) {
      console.error('Failed to load template content');
      return null;
    }
    
    // Create a PizZip instance
    const zip = new PizZip(templateContent);
    
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
    
    // Upload to Supabase storage
    const storagePath = `lois/${fileName}`;
    const url = await uploadToStorage(
      GENERATED_BUCKET, 
      storagePath, 
      buffer, 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    if (!url) {
      console.error('Failed to upload generated LOI to storage');
      
      // Fallback to local file system if storage fails
      // Ensure the output directory exists
      if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      }
      
      // Write the generated document to the output path
      const outputPath = path.join(OUTPUT_DIR, fileName);
      fs.writeFileSync(outputPath, buffer);
      
      return '/generated/' + fileName;
    }
    
    // Return the URL from Supabase storage
    console.log(`Generated LOI at ${url}`);
    return url;
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
 * Generate a PDF version of the LOI
 */
export async function generateLoiPdf(params: LoiParams): Promise<string | null> {
  // This would use a PDF generation library like PDFKit
  // For now, we'll just return null as this is a future feature
  console.log('PDF generation not yet implemented');
  return null;
}