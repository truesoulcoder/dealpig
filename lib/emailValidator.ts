"use server";

import logger from './logger';

interface ValidationResult {
  valid: boolean;
  missingVariables: string[];
  message: string;
}

/**
 * Email template validator
 * Ensures all template variables are properly replaced before sending
 */
export function validateEmailTemplate(content: string, subject?: string): ValidationResult {
  try {
    // Look for any {{variable}} patterns that weren't replaced
    const variablePattern = /{{([^{}]+)}}/g;
    const missingBodyVariables: string[] = [];
    const missingSubjectVariables: string[] = [];
    let match;

    // Check email body
    while ((match = variablePattern.exec(content)) !== null) {
      missingBodyVariables.push(match[1].trim());
    }
    
    // Check email subject if provided
    if (subject) {
      variablePattern.lastIndex = 0; // Reset regex state
      while ((match = variablePattern.exec(subject)) !== null) {
        missingSubjectVariables.push(match[1].trim());
      }
    }
    
    // Combine all missing variables
    const allMissingVars = [...new Set([...missingBodyVariables, ...missingSubjectVariables])];
    
    if (allMissingVars.length > 0) {
      return {
        valid: false,
        missingVariables: allMissingVars,
        message: `Template contains ${allMissingVars.length} unreplaced variables: ${allMissingVars.join(', ')}`
      };
    }
    
    return {
      valid: true,
      missingVariables: [],
      message: 'Template validation successful'
    };
  } catch (error) {
    logger.error('Email template validation error', error);
    return {
      valid: false,
      missingVariables: [],
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Tests if all required variables are present in the data to be merged
 */
export function validateTemplateData(template: string, data: Record<string, any>): ValidationResult {
  try {
    // Extract all variables from the template
    const variablePattern = /{{([^{}]+)}}/g;
    const requiredVariables: string[] = [];
    const missingVariables: string[] = [];
    let match;
    
    // Find all variables in the template
    while ((match = variablePattern.exec(template)) !== null) {
      requiredVariables.push(match[1].trim());
    }
    
    // Check if all required variables are in the data
    for (const variable of requiredVariables) {
      // Handle nested properties like 'user.name'
      const parts = variable.split('.');
      let value = data;
      
      for (const part of parts) {
        if (value === undefined || value === null) {
          missingVariables.push(variable);
          break;
        }
        value = value[part];
      }
      
      if (value === undefined || value === null) {
        missingVariables.push(variable);
      }
    }
    
    if (missingVariables.length > 0) {
      return {
        valid: false,
        missingVariables,
        message: `Missing required variables: ${missingVariables.join(', ')}`
      };
    }
    
    return {
      valid: true,
      missingVariables: [],
      message: 'All required template variables are present'
    };
  } catch (error) {
    logger.error('Template data validation error', error);
    return {
      valid: false,
      missingVariables: [],
      message: `Validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}