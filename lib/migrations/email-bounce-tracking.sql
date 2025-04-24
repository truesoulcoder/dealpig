-- Add email_bounces table
CREATE TABLE IF NOT EXISTS email_bounces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  bounce_type TEXT NOT NULL,
  bounce_code TEXT,
  message_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  diagnostic_code TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_email_bounces_email ON email_bounces(email);
CREATE INDEX IF NOT EXISTS idx_email_bounces_timestamp ON email_bounces(timestamp);

-- Add status column to emails table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'emails' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE emails ADD COLUMN status TEXT DEFAULT 'sent';
  END IF;
END $$;

-- Add bounced_at to emails table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'emails' 
    AND column_name = 'bounced_at'
  ) THEN
    ALTER TABLE emails ADD COLUMN bounced_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add metadata JSONB column to emails if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'emails' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE emails ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Performance optimization: Add indexes to frequently queried columns
CREATE INDEX IF NOT EXISTS idx_emails_to_email ON emails(to_email);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_campaign_id ON emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_created_at ON emails(created_at);

-- Campaign performance indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);

-- Lead performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);

-- Create materialized view for campaign analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS campaign_analytics AS
SELECT 
  c.id AS campaign_id,
  c.name AS campaign_name,
  c.user_id,
  COUNT(e.id) AS total_emails_sent,
  SUM(CASE WHEN e.status = 'sent' THEN 1 ELSE 0 END) AS delivered,
  SUM(CASE WHEN e.status = 'opened' THEN 1 ELSE 0 END) AS opened,
  SUM(CASE WHEN e.status = 'clicked' THEN 1 ELSE 0 END) AS clicked,
  SUM(CASE WHEN e.status = 'bounced' OR e.status = 'soft-bounce' THEN 1 ELSE 0 END) AS bounced,
  SUM(CASE WHEN e.status = 'replied' THEN 1 ELSE 0 END) AS replied,
  ROUND(SUM(CASE WHEN e.status = 'opened' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(e.id), 0) * 100, 2) AS open_rate,
  ROUND(SUM(CASE WHEN e.status = 'clicked' THEN 1 ELSE 0 END)::numeric / NULLIF(SUM(CASE WHEN e.status = 'opened' THEN 1 ELSE 0 END), 0) * 100, 2) AS click_rate,
  ROUND(SUM(CASE WHEN e.status = 'bounced' OR e.status = 'soft-bounce' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(e.id), 0) * 100, 2) AS bounce_rate
FROM campaigns c
LEFT JOIN emails e ON c.id = e.campaign_id
GROUP BY c.id, c.name, c.user_id;

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY campaign_analytics;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to refresh the view when emails table changes
DROP TRIGGER IF EXISTS refresh_campaign_analytics_trigger ON emails;
CREATE TRIGGER refresh_campaign_analytics_trigger
AFTER INSERT OR UPDATE OR DELETE ON emails
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_campaign_analytics();