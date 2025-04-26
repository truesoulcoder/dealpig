import { getSupabaseAdmin } from './supabaseAdmin';
import getLogger from './logger';

// Helper function to get logger
async function getLoggerInstance() {
  return await getLogger();
}

// Define service status types
export type ServiceStatus = 'operational' | 'degraded' | 'down';

// Define health status interface
export interface ServiceHealth {
  status: ServiceStatus;
  latency: number;
  lastChecked: Date;
  error?: string;
}

// Initialize health status for each service
export const healthStatus: Record<string, ServiceHealth> = {
  supabase: {
    status: 'operational',
    latency: 0,
    lastChecked: new Date()
  },
  gmail: {
    status: 'operational',
    latency: 0,
    lastChecked: new Date()
  }
};

/**
 * Check Supabase health
 */
export async function checkSupabaseHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // Simple query to check if Supabase is responsive
    const supabaseAdmin = await getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.from('health_checks').select('id').limit(1);
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    if (error) {
      const logger = await getLoggerInstance();
      await logger.warn(`Supabase health check error: ${error.message}`, 'health');
      
      return healthStatus.supabase = {
        status: 'degraded',
        latency,
        lastChecked: new Date(),
        error: error.message
      };
    }
    
    return healthStatus.supabase = {
      status: 'operational',
      latency,
      lastChecked: new Date()
    };
  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    const logger = await getLoggerInstance();
    await logger.error(`Supabase health check failed: ${error instanceof Error ? error.message : String(error)}`, 'health');
    
    return healthStatus.supabase = {
      status: 'down',
      latency,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check Gmail API health
 */
export async function checkGmailHealth(): Promise<ServiceHealth> {
  const startTime = Date.now();
  try {
    // This would typically call your Gmail service to check its health
    // For example, check if you can access user profile or quota information
    
    // Mock implementation - replace with actual Gmail API call
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        // You would use an actual access token here
        'Authorization': `Bearer ${process.env.GMAIL_TEST_TOKEN || ''}`
      }
    });
    
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      
      return healthStatus.gmail = {
        status: response.status === 401 ? 'degraded' : 'down',
        latency,
        lastChecked: new Date(),
        error: `Status ${response.status}: ${errorText}`
      };
    }
    
    return healthStatus.gmail = {
      status: 'operational',
      latency,
      lastChecked: new Date()
    };
  } catch (error) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    const logger = await getLoggerInstance();
    await logger.error(`Gmail health check failed: ${error instanceof Error ? error.message : String(error)}`, 'health');
    
    return healthStatus.gmail = {
      status: 'down',
      latency,
      lastChecked: new Date(),
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Check all services health
 */
export async function checkAllServicesHealth(): Promise<Record<string, ServiceHealth>> {
  await Promise.all([
    checkSupabaseHealth(),
    checkGmailHealth()
  ]);
  
  return healthStatus;
}

/**
 * Check if system is healthy overall
 */
export function isSystemHealthy(): boolean {
  // System is healthy if all critical services are operational or degraded (but not down)
  return Object.values(healthStatus).every(service => service.status !== 'down');
}

/**
 * Initialize health check table in Supabase
 */
export async function initializeHealthChecks(): Promise<void> {
  try {
    // Create health_checks table if it doesn't exist
    // This is used for the Supabase health check
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.rpc('create_health_checks_table_if_not_exists');
    
    if (error) {
      const logger = await getLoggerInstance();
      await logger.error(`Failed to initialize health checks: ${error.message}`, 'health');
    }
  } catch (error) {
    const logger = await getLoggerInstance();
    await logger.error(`Error initializing health checks: ${error instanceof Error ? error.message : String(error)}`, 'health');
  }
}