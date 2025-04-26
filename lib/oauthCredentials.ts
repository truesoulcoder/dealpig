"use server";

import { 
  getClientSecret, 
  saveClientSecret, 
  getOAuthTokenByEmail, 
  saveOAuthToken,
  OAuthCredentials as DBOAuthCredentials
} from './database';
import { google } from 'googleapis';

// Define constants for tokens
const TOKEN_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // Refresh if token expires in less than 5 minutes

/**
 * OAuth Credentials Manager
 * This file provides a secure way to manage OAuth credentials
 * in the database without exposing sensitive information
 */

interface OAuthCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  refresh_token?: string;
}

/**
 * Get OAuth credentials from environment variables or database
 */
export async function getOAuthCredentials(): Promise<OAuthCredentials> {
  // First try to get credentials from environment variables
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://dealpig.vercel.app/api/auth/callback',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    };
  }
  
  // If environment variables aren't set, try to load from database
  try {
    // Use a standard client ID for lookups
    const defaultClientId = 'google_mail_api';
    const clientSecret = await getClientSecret(defaultClientId);
    
    if (clientSecret) {
      return {
        client_id: defaultClientId,
        client_secret: clientSecret,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
      };
    }
  } catch (error) {
    console.error('Error loading OAuth credentials from database:', error);
  }
  
  throw new Error('OAuth credentials not found in environment or database');
}

/**
 * Checks if a token needs refreshing and refreshes it if needed
 * @param senderEmail The email of the sender whose token needs to be checked
 * @returns The updated OAuth credentials object or null if refresh failed
 */
export async function refreshTokenIfNeeded(senderEmail: string): Promise<OAuthCredentials | null> {
  try {
    // Get current token
    const tokenRecord = await getOAuthTokenByEmail(senderEmail);
    
    if (!tokenRecord || !tokenRecord.refresh_token) {
      console.error(`No refresh token available for ${senderEmail}`);
      return null;
    }
    
    // Check if token is about to expire
    const now = Date.now();
    const tokenExpiryTime = tokenRecord.expiry_date;
    
    if (!tokenExpiryTime || tokenExpiryTime - now <= TOKEN_REFRESH_THRESHOLD_MS) {
      console.log(`Token for ${senderEmail} needs refreshing (expires in ${tokenExpiryTime ? Math.floor((tokenExpiryTime - now) / 1000) + 's' : 'unknown'})`);
      
      // Get OAuth client credentials
      const oauthCredentials = await getOAuthCredentials();
      
      // Set up OAuth2 client
      const oauth2Client = new google.auth.OAuth2(
        oauthCredentials.client_id,
        oauthCredentials.client_secret,
        oauthCredentials.redirect_uri
      );
      
      // Set the refresh token
      oauth2Client.setCredentials({
        refresh_token: tokenRecord.refresh_token
      });
      
      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Save the updated token
      const updatedToken: DBOAuthCredentials = {
        email: senderEmail,
        sender_id: tokenRecord.sender_id,
        access_token: credentials.access_token || '',
        refresh_token: credentials.refresh_token || tokenRecord.refresh_token, // Keep old refresh token if no new one
        token_type: credentials.token_type || 'Bearer',
        expiry_date: credentials.expiry_date ?? undefined, // Convert null to undefined
        scopes: Array.isArray(credentials.scope) ? credentials.scope.join(' ') : credentials.scope
      };
      
      const saveResult = await saveOAuthToken(updatedToken);
      
      if (!saveResult) {
        throw new Error('Failed to save refreshed token');
      }
      
      console.log(`Successfully refreshed token for ${senderEmail}`);
      
      return {
        client_id: oauthCredentials.client_id,
        client_secret: oauthCredentials.client_secret,
        redirect_uri: oauthCredentials.redirect_uri,
        refresh_token: updatedToken.refresh_token
      };
    }
    
    // Token is still valid
    return {
      client_id: tokenRecord.client_id || '',
      client_secret: tokenRecord.client_secret || '',
      redirect_uri: 'http://localhost:3000/api/auth/callback',
      refresh_token: tokenRecord.refresh_token
    };
  } catch (error) {
    console.error(`Error refreshing token for ${senderEmail}:`, error);
    return null;
  }
}

/**
 * Enhanced version of getSenderTokens that automatically refreshes tokens if needed
 */
export async function getValidSenderTokens(senderEmail: string): Promise<OAuthCredentials | null> {
  // First, check if token needs refresh and refresh it
  const refreshedTokens = await refreshTokenIfNeeded(senderEmail);
  if (refreshedTokens) {
    return refreshedTokens;
  }
  
  // Fallback to regular token retrieval if refresh fails
  return await getSenderTokens(senderEmail);
}

/**
 * Get sender-specific OAuth tokens from database
 */
export async function getSenderTokens(senderEmail: string): Promise<OAuthCredentials | null> {
  try {
    const tokenRecord = await getOAuthTokenByEmail(senderEmail);
    
    if (tokenRecord && tokenRecord.access_token && tokenRecord.refresh_token) {
      // Convert from database format to OAuthCredentials format
      return {
        client_id: tokenRecord.client_id || '',
        client_secret: tokenRecord.client_secret || '',
        redirect_uri: 'http://localhost:3000/api/auth/callback',
        refresh_token: tokenRecord.refresh_token
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error loading tokens for ${senderEmail}:`, error);
    return null;
  }
}

/**
 * Save sender tokens to the database
 */
export async function saveSenderTokens(
  senderEmail: string, 
  tokens: any, 
  senderId?: string
): Promise<boolean> {
  try {
    // Prepare token data in the format expected by the database
    const tokenData: DBOAuthCredentials = {
      email: senderEmail,
      sender_id: senderId,
      access_token: tokens.access_token || tokens.token || '',
      refresh_token: tokens.refresh_token || '',
      token_type: tokens.token_type || 'Bearer',
      expiry_date: tokens.expiry_date || (tokens.expiry ? new Date(tokens.expiry).getTime() : undefined),
      scopes: Array.isArray(tokens.scope) ? tokens.scope.join(' ') : tokens.scope
    };
    
    const result = await saveOAuthToken(tokenData);
    return !!result;
  } catch (error) {
    console.error(`Error saving tokens for ${senderEmail}:`, error);
    return false;
  }
}

/**
 * Save OAuth client secret to database
 */
export async function saveOAuthClientSecret(
  clientId: string,
  clientSecret: string
): Promise<boolean> {
  try {
    return await saveClientSecret(clientId, clientSecret);
  } catch (error) {
    console.error('Error saving client secret:', error);
    return false;
  }
}

/**
 * Initialize OAuth credentials in the database
 * Run this when setting up a new environment
 */
export async function initializeOAuthCredentials(): Promise<void> {
  try {
    // Check if we have a client secret in env vars
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      // Save to database for future use
      await saveClientSecret(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      console.log('Saved OAuth client credentials to database');
    } else {
      console.log('No OAuth credentials found in environment variables');
      console.log('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET or use the admin interface to set up OAuth');
    }
  } catch (error) {
    console.error('Error initializing OAuth credentials:', error);
  }
}