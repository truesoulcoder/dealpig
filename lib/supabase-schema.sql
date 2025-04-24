-- DealPig Application Database Schema
-- This creates all the necessary tables for the property-email-automation system

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT NOT NULL,
  property_zip TEXT NOT NULL,
  wholesale_value DECIMAL,
  market_value DECIMAL,
  days_on_market INTEGER,
  mls_status TEXT,
  mls_list_date TIMESTAMP,
  mls_list_price DECIMAL,
  status TEXT NOT NULL DEFAULT 'NEW',
  source_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON leads (source_id);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  lead_id UUID NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON contacts (lead_id);

-- Create lead_sources table
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  last_imported TIMESTAMP WITH TIME ZONE NOT NULL,
  record_count INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create senders table
CREATE TABLE IF NOT EXISTS senders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  daily_quota INTEGER NOT NULL DEFAULT 50,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  loi_path TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  bounce_reason TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  tracking_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES senders (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON emails (lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender_id ON emails (sender_id);
CREATE INDEX IF NOT EXISTS idx_emails_tracking_id ON emails (tracking_id);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'email',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Update the leads.source_id foreign key
ALTER TABLE leads
DROP CONSTRAINT IF EXISTS fk_lead_source,
ADD CONSTRAINT fk_lead_source
  FOREIGN KEY (source_id) REFERENCES lead_sources (id)
  ON DELETE SET NULL;

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  email_template_id UUID,
  loi_template_id UUID,
  status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, PAUSED, COMPLETED
  leads_per_day INTEGER NOT NULL DEFAULT 20,
  start_time TIME NOT NULL DEFAULT '09:00:00',
  end_time TIME NOT NULL DEFAULT '17:00:00',
  min_interval_minutes INTEGER NOT NULL DEFAULT 15,
  max_interval_minutes INTEGER NOT NULL DEFAULT 60,
  attachment_type TEXT NOT NULL DEFAULT 'PDF', -- PDF, DOCX
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  total_leads INTEGER NOT NULL DEFAULT 0,
  leads_worked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (email_template_id) REFERENCES templates (id) ON DELETE SET NULL,
  FOREIGN KEY (loi_template_id) REFERENCES templates (id) ON DELETE SET NULL
);

-- Create campaign_leads table (to track which leads are assigned to which campaign)
CREATE TABLE IF NOT EXISTS campaign_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  lead_id UUID NOT NULL,
  sender_id UUID,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, ASSIGNED, SENT, FAILED
  scheduled_for TIMESTAMP WITH TIME ZONE,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES senders (id) ON DELETE SET NULL,
  UNIQUE (campaign_id, lead_id)
);

-- Create campaign_senders table (many-to-many relationship between campaigns and senders)
CREATE TABLE IF NOT EXISTS campaign_senders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES senders (id) ON DELETE CASCADE,
  UNIQUE (campaign_id, sender_id)
);

-- Create sender_tokens table (to store OAuth tokens for each sender)
CREATE TABLE IF NOT EXISTS sender_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL UNIQUE,
  oauth_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (sender_id) REFERENCES senders (id) ON DELETE CASCADE
);

-- Create campaign_stats table (for analytics)
CREATE TABLE IF NOT EXISTS campaign_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  date DATE NOT NULL,
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_opened INTEGER NOT NULL DEFAULT 0,
  total_replied INTEGER NOT NULL DEFAULT 0,
  total_bounced INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
  UNIQUE (campaign_id, date)
);

-- Create sender_stats table (for analytics per sender)
CREATE TABLE IF NOT EXISTS sender_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  date DATE NOT NULL,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_opened INTEGER NOT NULL DEFAULT 0,
  emails_replied INTEGER NOT NULL DEFAULT 0,
  emails_bounced INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  FOREIGN KEY (sender_id) REFERENCES senders (id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
  UNIQUE (sender_id, campaign_id, date)
);

-- Add stored procedure for incrementing campaign statistics
CREATE OR REPLACE FUNCTION increment_campaign_stat(
  p_campaign_id UUID,
  p_date DATE,
  p_field TEXT,
  p_amount INT DEFAULT 1
) RETURNS VOID AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if a stats record exists for the campaign and date
  SELECT EXISTS(
    SELECT 1 
    FROM campaign_stats 
    WHERE campaign_id = p_campaign_id 
    AND date = p_date
  ) INTO v_exists;
  
  -- If the record exists, update it
  IF v_exists THEN
    EXECUTE format('
      UPDATE campaign_stats 
      SET %I = %I + $1,
          updated_at = NOW()
      WHERE campaign_id = $2 
      AND date = $3
    ', p_field, p_field)
    USING p_amount, p_campaign_id, p_date;
  ELSE
    -- If no record exists, create one
    EXECUTE format('
      INSERT INTO campaign_stats (
        campaign_id, 
        date, 
        %I,
        total_sent,
        total_opened,
        total_replied,
        total_bounced,
        created_at,
        updated_at
      ) VALUES (
        $1, 
        $2, 
        $3,
        CASE WHEN %L = ''total_sent'' THEN $3 ELSE 0 END,
        CASE WHEN %L = ''total_opened'' THEN $3 ELSE 0 END,
        CASE WHEN %L = ''total_replied'' THEN $3 ELSE 0 END,
        CASE WHEN %L = ''total_bounced'' THEN $3 ELSE 0 END,
        NOW(),
        NOW()
      )
    ', p_field, p_field, p_field, p_field, p_field)
    USING p_campaign_id, p_date, p_amount;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add stored procedure for incrementing sender statistics
CREATE OR REPLACE FUNCTION increment_sender_stat(
  p_sender_id UUID,
  p_campaign_id UUID,
  p_date DATE,
  p_field TEXT,
  p_amount INT DEFAULT 1
) RETURNS VOID AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Check if a stats record exists for the sender, campaign and date
  SELECT EXISTS(
    SELECT 1 
    FROM sender_stats 
    WHERE sender_id = p_sender_id 
    AND campaign_id = p_campaign_id
    AND date = p_date
  ) INTO v_exists;
  
  -- If the record exists, update it
  IF v_exists THEN
    EXECUTE format('
      UPDATE sender_stats 
      SET %I = %I + $1,
          updated_at = NOW()
      WHERE sender_id = $2 
      AND campaign_id = $3
      AND date = $4
    ', p_field, p_field)
    USING p_amount, p_sender_id, p_campaign_id, p_date;
  ELSE
    -- If no record exists, create one
    EXECUTE format('
      INSERT INTO sender_stats (
        sender_id,
        campaign_id, 
        date, 
        %I,
        emails_sent,
        emails_opened,
        emails_replied,
        emails_bounced,
        created_at,
        updated_at
      ) VALUES (
        $1,
        $2, 
        $3, 
        $4,
        CASE WHEN %L = ''emails_sent'' THEN $4 ELSE 0 END,
        CASE WHEN %L = ''emails_opened'' THEN $4 ELSE 0 END,
        CASE WHEN %L = ''emails_replied'' THEN $4 ELSE 0 END,
        CASE WHEN %L = ''emails_bounced'' THEN $4 ELSE 0 END,
        NOW(),
        NOW()
      )
    ', p_field, p_field, p_field, p_field, p_field)
    USING p_sender_id, p_campaign_id, p_date, p_amount;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add simple increment and decrement functions for counter updates
CREATE OR REPLACE FUNCTION increment(x INTEGER, amount INTEGER DEFAULT 1) 
RETURNS INTEGER AS $$
  BEGIN
    RETURN x + amount;
  END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement(x INTEGER, amount INTEGER DEFAULT 1) 
RETURNS INTEGER AS $$
  BEGIN
    RETURN x - amount;
  END;
$$ LANGUAGE plpgsql;

-- Add some default templates
INSERT INTO templates (name, subject, content, type)
VALUES 
  ('Default LOI Email', 'Letter of Intent for {{property_address}}', 
   '<p>Dear {{recipient_name}},</p><p>Please find attached our Letter of Intent for the property at {{property_address}}.</p><p>We look forward to your response.</p><p>Best regards,<br>{{sender_name}}<br>{{sender_title}}</p>', 
   'email'),
  ('Default LOI Template', 'Letter of Intent', 
   '<h1>Letter of Intent</h1><p>Property: {{property_address}}, {{property_city}}, {{property_state}} {{property_zip}}</p><p>Offer Price: ${{offer_price}}</p><p>Earnest Money: ${{earnest_money}}</p><p>Closing Date: {{closing_date}}</p>', 
   'document')
ON CONFLICT DO NOTHING;