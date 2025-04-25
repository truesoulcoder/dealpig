import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';

/**
 * Converts a DOCX file to HTML for use in the editor
 * @param filePath Path to the DOCX file
 * @returns HTML string from the DOCX file
 */
export async function docxToHtml(filePath: string): Promise<string> {
  try {
    // Read the file as a buffer
    const buffer = fs.readFileSync(filePath);
    
    // Convert the DOCX to HTML
    const result = await mammoth.convertToHtml({ buffer });
    
    return result.value;
  } catch (error) {
    console.error('Error converting DOCX to HTML:', error);
    throw new Error('Failed to convert DOCX file to HTML');
  }
}

/**
 * Gets the default LOI template as HTML
 * @returns HTML string of the default template
 */
export async function getDefaultLoiTemplateHtml(): Promise<string> {
  const templatePath = path.join(process.cwd(), 'templates', 'default_loi_template.docx');
  
  try {
    return await docxToHtml(templatePath);
  } catch (error) {
    console.error('Error loading default LOI template:', error);
    // Return a basic template as fallback
    return `
      <h1 style="text-align: center;">Letter of Intent</h1>
      <p><strong>Date:</strong> {{date}}</p>
      <p><strong>Recipient:</strong> {{recipient_name}}</p>
      <p><strong>Re:</strong> Property Purchase Intent - {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}</p>
      
      <p>Dear {{recipient_name}},</p>
      
      <p>I am writing to express my formal intent to purchase the property located at {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}.</p>
      
      <p><strong>Purchase Price:</strong> ${{offer_price}}</p>
      <p><strong>Earnest Money Deposit:</strong> ${{earnest_money}}</p>
      <p><strong>Proposed Closing Date:</strong> {{closing_date}}</p>
      
      <p>This letter of intent is not legally binding and is subject to the execution of a formal purchase agreement. I look forward to moving forward with this transaction.</p>
      
      <p>Sincerely,</p>
      <p>{{sender_name}}<br>
      {{sender_title}}<br>
      {{company_name}}<br>
      {{sender_contact}}</p>
    `;
  }
}