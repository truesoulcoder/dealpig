"use server";

import NodeCache from 'node-cache';
import { supabaseAdmin } from './supabaseAdmin';

// Initialize cache with standard TTL of 5 minutes and check period of 1 minute
const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false
});

interface QueryOptions {
  ttl?: number; // Override default TTL (in seconds)
  forceRefresh?: boolean; // Force a cache refresh
}

/**
 * Cached query function for Supabase
 * @param table The table name to query
 * @param queryFn Function that builds the query
 * @param cacheKey Unique cache key
 * @param options Cache options
 */
export async function cachedQuery<T>(
  table: string,
  queryFn: (query: any) => any,
  cacheKey: string,
  options: QueryOptions = {}
): Promise<T> {
  const { ttl, forceRefresh } = options;
  
  // Return cached result if available and not forcing refresh
  if (!forceRefresh && cache.has(cacheKey)) {
    return cache.get<T>(cacheKey)!;
  }
  
  // Start with base query
  const supabase = supabaseAdmin;
  let query = supabase.from(table);
  
  // Apply the query function
  query = queryFn(query);
  
  // Execute the query
  const { data, error } = await query.select();
  
  if (error) {
    console.error(`Cache query error for key ${cacheKey}:`, error);
    throw new Error(`Database query failed: ${error.message}`);
  }
  
  // Store in cache with optional custom TTL
  cache.set(cacheKey, data, ttl);
  
  return data as T;
}

/**
 * Invalidate a specific cache key
 */
export function invalidateCache(cacheKey: string): boolean {
  return cache.del(cacheKey);
}

/**
 * Invalidate all keys matching a pattern
 */
export function invalidateCachePattern(pattern: string): void {
  const keys = cache.keys();
  const matchingKeys: string[] = keys.filter((key: string) => key.includes(pattern));
  
  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
  }
}

/**
 * Cache campaign statistics for quick access
 */
export async function getCachedCampaignStats(campaignId: string, options: QueryOptions = {}) {
  const cacheKey = `campaign_stats:${campaignId}`;
  
  return cachedQuery(
    'campaign_analytics',
    (query) => query.select('*').eq('campaign_id', campaignId).single(),
    cacheKey,
    options
  );
}

/**
 * Cache campaign list for a user
 */
export async function getCachedUserCampaigns(userId: string, options: QueryOptions = {}) {
  const cacheKey = `user_campaigns:${userId}`;
  
  return cachedQuery(
    'campaigns',
    (query) => query
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    cacheKey,
    options
  );
}

/**
 * Refresh the materialized view for campaign analytics
 */
export async function refreshCampaignAnalytics() {
  try {
    const supabase = supabaseAdmin;
    await supabase.rpc('refresh_campaign_analytics');
    // Invalidate all campaign stats caches
    invalidateCachePattern('campaign_stats:');
    return { success: true };
  } catch (error) {
    console.error('Error refreshing campaign analytics:', error);
    return { success: false, error };
  }
}

/**
 * Get campaign bounce rates
 */
export async function getCachedCampaignBounceRates(options: QueryOptions = {}) {
  const cacheKey = 'campaign_bounce_rates';
  
  return cachedQuery(
    'campaign_analytics',
    (query) => query.select('campaign_id, campaign_name, bounce_rate').order('bounce_rate', { ascending: false }),
    cacheKey,
    options
  );
}

/**
 * Get recent bounces
 */
export async function getRecentBounces(limit = 10, options: QueryOptions = {}) {
  const cacheKey = `recent_bounces:${limit}`;
  
  return cachedQuery(
    'email_bounces',
    (query) => query.select('*').order('timestamp', { ascending: false }).limit(limit),
    cacheKey,
    options
  );
}