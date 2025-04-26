import { checkAllServicesHealth, ServiceHealth, ServiceStatus, healthStatus } from './healthMonitor';
import logger from './logger';

// Interface for alert configuration
interface AlertConfig {
  enabled: boolean;
  channels: {
    email?: boolean;
    slack?: boolean;
    console?: boolean;
  };
  thresholds: {
    latencyMs: number;
    statusChange: boolean;
  };
  recipients?: string[];
  cooldownMinutes: number;
}

// Track last alert times to prevent alert flooding
const lastAlertSent: Record<string, Date> = {};

// Default alert configuration
const defaultAlertConfig: AlertConfig = {
  enabled: true,
  channels: {
    email: false,
    slack: false,
    console: true
  },
  thresholds: {
    latencyMs: 1000, // Alert if latency exceeds 1000ms
    statusChange: true // Alert on status changes
  },
  cooldownMinutes: 15 // Don't send repeated alerts for 15 minutes
};

// Custom alert configurations per service
const alertConfigs: Record<string, AlertConfig> = {
  supabase: {
    ...defaultAlertConfig,
    thresholds: {
      latencyMs: 500, // Lower threshold for database
      statusChange: true
    },
    recipients: ['admin@example.com']
  },
  gmail: {
    ...defaultAlertConfig,
    cooldownMinutes: 30 // Less frequent alerts for Gmail
  }
};

// Previous recorded states to detect changes
let previousStates: Record<string, ServiceStatus> = {};

/**
 * Send an alert when a service status changes or exceeds thresholds
 */
async function sendAlert(
  serviceName: string, 
  health: ServiceHealth, 
  reason: string,
  previousStatus?: ServiceStatus
): Promise<void> {
  const alertConfig = alertConfigs[serviceName] || defaultAlertConfig;
  
  // Check if we're in cooldown period
  const lastAlert = lastAlertSent[serviceName];
  if (lastAlert) {
    const timeSinceLastAlert = new Date().getTime() - lastAlert.getTime();
    const cooldownMs = alertConfig.cooldownMinutes * 60 * 1000;
    
    if (timeSinceLastAlert < cooldownMs) {
      // Still in cooldown, don't send another alert
      return;
    }
  }
  
  // Generate alert message
  const statusChange = previousStatus ? 
    `Status changed from ${previousStatus} to ${health.status}` : 
    `Status is ${health.status}`;
    
  const message = `
    SERVICE ALERT: ${serviceName}
    ${statusChange}
    Reason: ${reason}
    Latency: ${health.latency}ms
    Time: ${health.lastChecked.toISOString()}
    ${health.error ? `Error: ${health.error}` : ''}
  `.trim();

  // Send alerts through configured channels
  const { channels } = alertConfig;
  
  try {
    // Console alerts (always available)
    if (channels.console) {
      if (health.status === 'down') {
        logger.error(message, 'alert');
      } else if (health.status === 'degraded') {
        logger.warn(message, 'alert');
      } else {
        logger.info(message, 'alert');
      }
    }
    
    // Email alerts (if configured)
    if (channels.email && alertConfig.recipients?.length) {
      // Implementation would depend on your email service
      // For example:
      // await sendEmail({
      //   to: alertConfig.recipients,
      //   subject: `Service Alert: ${serviceName} ${health.status}`,
      //   body: message
      // });
      
      logger.info(`Email alert would be sent to ${alertConfig.recipients.join(', ')}`, 'alert');
    }
    
    // Slack alerts (if configured)
    if (channels.slack) {
      // Implementation would depend on your Slack integration
      // For example:
      // await sendSlackMessage(slackWebhookUrl, {
      //   text: message
      // });
      
      logger.info('Slack alert would be sent', 'alert');
    }
    
    // Update last alert timestamp
    lastAlertSent[serviceName] = new Date();
  } catch (error) {
    logger.error(`Failed to send alert for ${serviceName}: ${error instanceof Error ? error.message : String(error)}`, 'alert');
  }
}

/**
 * Check services and send alerts if needed
 */
export async function monitorServices(): Promise<void> {
  try {
    const healthStatus = await checkAllServicesHealth();
    
    // Check each service for status changes or threshold violations
    for (const [serviceName, health] of Object.entries(healthStatus)) {
      const alertConfig = alertConfigs[serviceName] || defaultAlertConfig;
      const previousStatus = previousStates[serviceName];
      let shouldAlert = false;
      let alertReason = '';
      
      // Alert on status change if configured
      if (alertConfig.thresholds.statusChange && 
          previousStatus && previousStatus !== health.status) {
        shouldAlert = true;
        alertReason = 'Status changed';
      }
      
      // Alert on high latency if configured
      if (health.latency > alertConfig.thresholds.latencyMs) {
        shouldAlert = true;
        alertReason = alertReason ? 
          `${alertReason}, High latency (${health.latency}ms)` : 
          `High latency (${health.latency}ms)`;
      }
      
      // Alert if service is down (always alert on down status)
      if (health.status === 'down') {
        shouldAlert = true;
        alertReason = alertReason ? 
          `${alertReason}, Service down` : 
          'Service down';
      }
      
      // Send alert if needed
      if (alertConfig.enabled && shouldAlert) {
        await sendAlert(serviceName, health, alertReason, previousStatus);
      }
      
      // Update previous state for next check
      previousStates[serviceName] = health.status;
    }
  } catch (error) {
    logger.error(`Error monitoring services: ${error instanceof Error ? error.message : String(error)}`, 'monitor');
  }
}

/**
 * Start the monitoring service with a specified interval
 * @param intervalMs Interval in milliseconds between checks
 */
export function startMonitoring(intervalMs = 60000): NodeJS.Timeout {
  // Run initial check immediately
  monitorServices().catch(error => {
    logger.error(`Initial monitoring error: ${error instanceof Error ? error.message : String(error)}`, 'monitor');
  });
  
  // Set up recurring checks
  return setInterval(monitorServices, intervalMs);
}

/**
 * Stop the monitoring service
 * @param intervalId The interval ID returned by startMonitoring
 */
export function stopMonitoring(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
}

/**
 * Get current system health status
 * Used by API health endpoint
 */
export async function getSystemHealth(): Promise<Record<string, ServiceHealth>> {
  // Run a fresh health check before returning status
  await checkAllServicesHealth();
  return healthStatus;
}

// Expose systemMonitor as a module
export const systemMonitor = {
  startMonitoring,
  stopMonitoring,
  monitorServices,
  getSystemHealth
};