'use server'

import { getDefaultLoiTemplateHtml } from "@/lib/docxUtils";

/**
 * Loads the default LOI template from the DOCX file
 * and returns it as HTML for the editor
 */
export async function loadDefaultTemplate(): Promise<string> {
  try {
    return await getDefaultLoiTemplateHtml();
  } catch (error) {
    console.error('Failed to load default template:', error);
    return ''; // Return empty string on error
  }
}