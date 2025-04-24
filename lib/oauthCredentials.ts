"use server";

import fs from 'fs';
import path from 'path';

/**
 * OAuth Credentials Manager
 * This file provides a secure way to manage OAuth credentials
 * without exposing sensitive information in the repository
 */

interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  refresh_token?: string;
}

/**
 * Get OAuth credentials from environment variables or client_secret.json
 */
export async function getOAuthCredentials(): Promise<OAuthCredentials> {
  // First try to get credentials from environment variables
  if (process.env.google_client_id && process.env.google_client_secret) {
    return {
      client_id: process.env.google_client_id,
      client_secret: process.env.google_client_secret,
      redirect_uri: process.env.google_redirect_uri || 'http://localhost:3000/api/auth/callback',
      refresh_token: process.env.google_refresh_token
    };
  }
  
  // If environment variables aren't set, try to load from file
  const clientSecretPath = process.env.client_secret_path || path.join(process.cwd(), 'auth_tokens', 'client_secret.json');
  
  if (fs.existsSync(clientSecretPath)) {
    try {
      const credentials = JSON.parse(fs.readFileSync(clientSecretPath, 'utf8'));
      
      // Handle potential different formats of client_secret.json
      if (credentials.web) {
        // Google Cloud format
        return {
          client_id: credentials.web.client_id,
          client_secret: credentials.web.client_secret,
          redirect_uri: credentials.web.redirect_uris?.[0] || 'http://localhost:3000/api/auth/callback'
        };
      } else if (credentials.installed) {
        // Desktop application format
        return {
          client_id: credentials.installed.client_id,
          client_secret: credentials.installed.client_secret,
          redirect_uri: credentials.installed.redirect_uris?.[0] || 'http://localhost:3000/api/auth/callback'
        };
      } else {
        // Direct format (our custom format)
        return credentials;
      }
    } catch (error) {
      console.error('Error loading OAuth credentials from file:', error);
      throw new Error('Failed to load OAuth credentials');
    }
  }
  
  throw new Error('OAuth credentials not found in environment or file system');
}

/**
 * Get sender-specific OAuth tokens
 */
export async function getSenderTokens(senderEmail: string): Promise<OAuthCredentials | null> {
  try {
    // Normalize the email for filename
    const normalizedEmail = senderEmail.replace(/[@.]/g, '_');
    const tokenPath = path.join(process.cwd(), 'auth_tokens', `token_${normalizedEmail}.json`);
    
    if (fs.existsSync(tokenPath)) {
      return JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading tokens for ${senderEmail}:`, error);
    return null;
  }
}

/**
 * Initialize OAuth credentials
 * Run this when setting up a new environment to create a template file
 */
export async function initializeOAuthCredentials(): Promise<void> {
  const tokenDir = process.env.token_dir || path.join(process.cwd(), 'auth_tokens');
  
  // Create token directory if it doesn't exist
  if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
  }
  
  const clientSecretPath = path.join(tokenDir, 'client_secret.json');
  
  // Only create template if file doesn't exist
  if (!fs.existsSync(clientSecretPath)) {
    const templateCredentials = {
      client_id: process.env.google_client_id || 'YOUR_CLIENT_ID',
      client_secret: process.env.google_client_secret || 'YOUR_CLIENT_SECRET',
      redirect_uri: process.env.google_redirect_uri || 'http://localhost:3000/api/auth/callback'
    };
    
    fs.writeFileSync(
      clientSecretPath, 
      JSON.stringify(templateCredentials, null, 2)
    );
    
    console.log(`Created template OAuth credentials at ${clientSecretPath}`);
  }
}