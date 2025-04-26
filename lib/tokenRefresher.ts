"use server";

import { refreshTokenIfNeeded } from './oauthCredentials';
import { getAllOAuthTokens, updateTokenRefreshAttempt } from './database';
import getLogger from './logger';

interface TokenRefreshResult {
  success: boolean;
  message: string;
  refreshed: number;
  failed: number;
  details?: Array<{
    email: string;
    success: boolean;
    error?: string;
  }>;
}

// Tokens that expire within this many seconds will be refreshed proactively
const PROACTIVE_REFRESH_THRESHOLD_SECONDS = 3600; // 1 hour

// Maximum number of consecutive failures before marking token as problematic
const MAX_REFRESH_FAILURES = 3;

/**
 * Refreshes all tokens that are nearing expiration
 * This should be run on a schedule (e.g., every hour)
 */
export async function refreshAllTokens(): Promise<TokenRefreshResult> {
  const logger = await getLogger();
  try {
    await logger.info('Starting token refresh process...', 'tokenRefresher');
    
    // Get all OAuth tokens from the database
    const tokens = await getAllOAuthTokens();
    
    if (!tokens || tokens.length === 0) {
      return {
        success: true,
        message: 'No tokens to refresh',
        refreshed: 0,
        failed: 0
      };
    }
    
    const results: Array<{
      email: string;
      success: boolean;
      error?: string;
    }> = [];
    
    let refreshed = 0;
    let failed = 0;
    
    // Try to refresh each token
    for (const token of tokens) {
      try {
        // Skip tokens without a refresh token
        if (!token.refresh_token) {
          results.push({
            email: token.email,
            success: false,
            error: 'No refresh token available'
          });
          
          // Update database with failed attempt
          await updateTokenRefreshAttempt(token.id, false, 'No refresh token available');
          
          failed++;
          continue;
        }
        
        // Check if token will expire soon or has too many failures
        const shouldForceRefresh = token.consecutive_refresh_failures >= MAX_REFRESH_FAILURES;
        
        // Attempt to refresh the token
        const refreshedToken = await refreshTokenIfNeeded(
          token.email, 
          PROACTIVE_REFRESH_THRESHOLD_SECONDS,
          shouldForceRefresh
        );
        
        if (refreshedToken) {
          results.push({
            email: token.email,
            success: true
          });
          
          // Reset failure count on success
          await updateTokenRefreshAttempt(token.id, true);
          
          refreshed++;
        } else {
          // Token might not have needed refresh
          results.push({
            email: token.email,
            success: true,
            error: 'Token refresh not needed'
          });
        }
      } catch (error) {
        const errorLogger = await getLogger();
        await errorLogger.error(`Error refreshing token for ${token.email}:`, error, 'tokenRefresher');
        
        results.push({
          email: token.email,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Update database with failed attempt
        await updateTokenRefreshAttempt(
          token.id, 
          false, 
          error instanceof Error ? error.message : String(error)
        );
        
        failed++;
      }
    }
    
    await logger.info(`Token refresh completed: ${refreshed} refreshed, ${failed} failed`, 'tokenRefresher');
    
    return {
      success: failed === 0,
      message: `Refreshed ${refreshed} tokens, ${failed} failed`,
      refreshed,
      failed,
      details: results
    };
  } catch (error) {
    const logger = await getLogger();
    await logger.error('Error in refreshAllTokens:', error, 'tokenRefresher');
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      refreshed: 0,
      failed: 0
    };
  }
}

/**
 * Check if all tokens for a specific user are valid
 * Useful for checking before starting important operations
 */
export async function validateUserTokens(userId: string): Promise<boolean> {
  const logger = await getLogger();
  try {
    // Get all tokens for this user
    const tokens = await getAllOAuthTokens(userId);
    
    if (!tokens || tokens.length === 0) {
      return false;
    }
    
    // Try to refresh each token
    for (const token of tokens) {
      const refreshedToken = await refreshTokenIfNeeded(token.email);
      
      if (!refreshedToken) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    const logger = await getLogger();
    await logger.error(`Error validating tokens for user ${userId}:`, error, 'tokenRefresher');
    return false;
  }
}

/**
 * Force refresh a specific token regardless of expiration
 * Useful after receiving an authentication error from the API
 */
export async function forceRefreshToken(email: string): Promise<boolean> {
  const logger = await getLogger();
  try {
    const refreshed = await refreshTokenIfNeeded(email, 0, true);
    return Boolean(refreshed);
  } catch (error) {
    await logger.error(`Failed to force refresh token for ${email}:`, error, 'tokenRefresher');
    return false;
  }
}

/**
 * Check token expiration and refresh if needed before making an API call
 * Use this as a wrapper for functions that make API calls requiring authentication
 */
export async function withFreshToken<T>(
  email: string, 
  apiCall: () => Promise<T>
): Promise<T> {
  const logger = await getLogger();
  try {
    // First try to refresh the token if needed
    await refreshTokenIfNeeded(email, PROACTIVE_REFRESH_THRESHOLD_SECONDS);
    
    // Then make the API call
    return await apiCall();
  } catch (error) {
    // If we get an auth error, try to force refresh and retry once
    if (error instanceof Error && 
        (error.message.includes('authentication') || 
         error.message.includes('auth') || 
         error.message.includes('401') || 
         error.message.includes('403'))) {
      
      await logger.warn(`Auth error detected, forcing token refresh for ${email}`, 'tokenRefresher');
      
      // Force refresh and retry
      const refreshed = await forceRefreshToken(email);
      if (refreshed) {
        return await apiCall();
      }
    }
    
    // If it's not an auth error or refresh failed, rethrow
    throw error;
  }
}