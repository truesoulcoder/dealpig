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