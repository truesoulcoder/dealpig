export interface Metrics {
  emailsSent: number;
  emailsDelivered: number;
  emailsBounced: number;
}

// Generate random metrics for a single iteration
export const generateRandomMetrics = (): Metrics => {
  // Random number of emails sent (0-5)
  const emailsSent = Math.floor(Math.random() * 6);
  
  // Random number of emails delivered (0-emailsSent)
  const emailsDelivered = emailsSent > 0 ? Math.floor(Math.random() * (emailsSent + 1)) : 0;
  
  // Random number of emails bounced (0-2)
  // We limit bounces to be realistic
  const emailsBounced = Math.random() < 0.3 ? Math.floor(Math.random() * 3) : 0;
  
  return {
    emailsSent,
    emailsDelivered,
    emailsBounced
  };
};
