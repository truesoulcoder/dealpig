-- DealPig Complete Database Schema
-- This script creates all tables and types needed for the DealPig application
-- Run this after dropping existing tables with drop-tables.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for status values
DO $$
BEGIN
    -- Lead status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
        CREATE TYPE lead_status AS ENUM ('NEW', 'WORKED', 'BOUNCED');
    END IF;

    -- Email status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
        CREATE TYPE email_status AS ENUM ('NEW', 'WORKED', 'BOUNCED');
    END IF;

    -- Campaign status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        CREATE TYPE campaign_status AS ENUM ('NEW', 'ACTIVE', 'COMPLETED');
    END IF;

    -- Template type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'template_type') THEN
        CREATE TYPE template_type AS ENUM ('EMAIL', 'LOI', 'DOCUMENT');
    END IF;

    -- Document type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
        CREATE TYPE document_type AS ENUM ('PDF', 'DOCX');
    END IF;
END$$;

-- 1. Lead Sources Table
CREATE TABLE lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    last_imported TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    record_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_address TEXT NOT NULL,
    property_city TEXT NOT NULL,
    property_state TEXT NOT NULL,
    property_zip TEXT NOT NULL,
    wholesale_value DECIMAL,
    market_value DECIMAL,
    days_on_market INTEGER,
    mls_status TEXT,
    mls_list_date TIMESTAMP WITH TIME ZONE,
    mls_list_price DECIMAL,
    status lead_status NOT NULL DEFAULT 'NEW',
    source_id UUID,
    owner_type TEXT,
    property_type TEXT,
    beds TEXT,
    baths TEXT,
    square_footage TEXT,
    year_built TEXT,
    assessed_total DECIMAL,
    Contact1Name TEXT,
    Contact1Phone_1 TEXT,
    Contact1Email_1 TEXT,
    Contact2Name TEXT,
    Contact2Phone_1 TEXT,
    Contact2Email_1 TEXT,
    Contact3Name TEXT,
    Contact3Phone_1 TEXT,
    Contact3Email_1 TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (source_id) REFERENCES lead_sources(id) ON DELETE SET NULL
);

-- 3. Contacts Table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    lead_id UUID NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
);

-- 4. Templates Table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subject TEXT,
    content TEXT NOT NULL,
    type template_type NOT NULL DEFAULT 'EMAIL',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Template Variables Table
CREATE TABLE template_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL,
    name TEXT NOT NULL,
    default_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- 6. User Profiles Table (for application users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id TEXT UNIQUE, -- Reference to Supabase Auth user ID
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    company_name TEXT,
    company_logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. OAuth Tokens Table (for external service tokens)
CREATE TABLE oauth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    scope TEXT NOT NULL,
    token_type TEXT NOT NULL,
    expiry_date BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Senders Table
CREATE TABLE senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    oauth_token TEXT,
    refresh_token TEXT,
    company TEXT,
    signature TEXT,
    emails_sent INTEGER NOT NULL DEFAULT 0,
    daily_quota INTEGER NOT NULL DEFAULT 50,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 9. Campaigns Table
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    email_template_id UUID,
    loi_template_id UUID,
    leads_per_day INTEGER NOT NULL DEFAULT 10,
    start_time TIME NOT NULL DEFAULT '09:00',
    end_time TIME NOT NULL DEFAULT '17:00',
    min_interval_minutes INTEGER NOT NULL DEFAULT 15,
    max_interval_minutes INTEGER NOT NULL DEFAULT 45,
    attachment_type document_type NOT NULL DEFAULT 'PDF',
    status campaign_status NOT NULL DEFAULT 'NEW',
    user_id UUID,
    company_logo_path TEXT,
    total_leads INTEGER NOT NULL DEFAULT 0,
    leads_worked INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (email_template_id) REFERENCES templates(id) ON DELETE SET NULL,
    FOREIGN KEY (loi_template_id) REFERENCES templates(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 10. Campaign Senders Junction Table
CREATE TABLE campaign_senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    emails_sent_today INTEGER NOT NULL DEFAULT 0,
    total_emails_sent INTEGER NOT NULL DEFAULT 0,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, sender_id)
);

-- 11. Campaign Leads Junction Table
CREATE TABLE campaign_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    lead_id UUID NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, lead_id)
);

-- 12. Documents Table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL,
    campaign_id UUID,
    template_id UUID,
    file_path TEXT NOT NULL,
    file_type document_type NOT NULL DEFAULT 'PDF',
    file_size INTEGER,
    generated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- 13. Emails Table
CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    campaign_id UUID,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    document_id UUID,
    status email_status NOT NULL DEFAULT 'NEW',
    opened_at TIMESTAMP WITH TIME ZONE,
    bounced_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    tracking_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);

-- 14. Email Tracking Events Table
CREATE TABLE email_tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID NOT NULL,
    event_type TEXT NOT NULL,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    location TEXT,
    device_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE
);

-- 15. API Keys Table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    key_name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 16. Campaign Metrics Table
CREATE TABLE campaign_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    emails_sent INTEGER NOT NULL DEFAULT 0,
    emails_opened INTEGER NOT NULL DEFAULT 0,
    emails_bounced INTEGER NOT NULL DEFAULT 0,
    open_rate DECIMAL,
    bounce_rate DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    UNIQUE(campaign_id, date)
);

-- 17. Sender Metrics Table
CREATE TABLE sender_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    emails_sent INTEGER NOT NULL DEFAULT 0,
    emails_opened INTEGER NOT NULL DEFAULT 0,
    emails_bounced INTEGER NOT NULL DEFAULT 0,
    open_rate DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (sender_id) REFERENCES senders(id) ON DELETE CASCADE,
    UNIQUE(sender_id, date)
);

-- 18. Notes Table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

-- 19. Settings Table
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);

-- Create indexes for commonly queried columns
CREATE INDEX idx_leads_status ON leads (status);
CREATE INDEX idx_leads_source_id ON leads (source_id);
CREATE INDEX idx_contacts_lead_id ON contacts (lead_id);
CREATE INDEX idx_contacts_email ON contacts (email);
CREATE INDEX idx_emails_lead_id ON emails (lead_id);
CREATE INDEX idx_emails_sender_id ON emails (sender_id);
CREATE INDEX idx_emails_campaign_id ON emails (campaign_id);
CREATE INDEX idx_emails_tracking_id ON emails (tracking_id);
CREATE INDEX idx_emails_status ON emails (status);
CREATE INDEX idx_campaign_leads_campaign_id ON campaign_leads (campaign_id);
CREATE INDEX idx_campaign_leads_lead_id ON campaign_leads (lead_id);
CREATE INDEX idx_campaign_leads_status ON campaign_leads (status);
CREATE INDEX idx_campaign_senders_campaign_id ON campaign_senders (campaign_id);
CREATE INDEX idx_documents_lead_id ON documents (lead_id);
CREATE INDEX idx_campaign_metrics_campaign_id ON campaign_metrics (campaign_id);
CREATE INDEX idx_oauth_tokens_email ON oauth_tokens (email);

-- Create timestamp update trigger
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update timestamp triggers to each table
CREATE TRIGGER update_lead_sources_timestamp
BEFORE UPDATE ON lead_sources
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_leads_timestamp
BEFORE UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_contacts_timestamp
BEFORE UPDATE ON contacts
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_templates_timestamp
BEFORE UPDATE ON templates
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_template_variables_timestamp
BEFORE UPDATE ON template_variables
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_profiles_timestamp
BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_oauth_tokens_timestamp
BEFORE UPDATE ON oauth_tokens
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_senders_timestamp
BEFORE UPDATE ON senders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_campaigns_timestamp
BEFORE UPDATE ON campaigns
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_campaign_senders_timestamp
BEFORE UPDATE ON campaign_senders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_campaign_leads_timestamp
BEFORE UPDATE ON campaign_leads
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_documents_timestamp
BEFORE UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_emails_timestamp
BEFORE UPDATE ON emails
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_api_keys_timestamp
BEFORE UPDATE ON api_keys
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_campaign_metrics_timestamp
BEFORE UPDATE ON campaign_metrics
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_sender_metrics_timestamp
BEFORE UPDATE ON sender_metrics
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_notes_timestamp
BEFORE UPDATE ON notes
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_settings_timestamp
BEFORE UPDATE ON settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Set up Row Level Security (RLS) if needed
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY user_isolation ON leads FOR ALL TO authenticated USING (user_id = auth.uid());