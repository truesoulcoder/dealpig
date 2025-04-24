-- schema.sql
-- Complete database schema for DealPig application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_address VARCHAR,
    property_city VARCHAR,
    property_state VARCHAR,
    property_zip VARCHAR,
    owner_name VARCHAR,
    mailing_address VARCHAR,
    mailing_city VARCHAR,
    mailing_state VARCHAR,
    mailing_zip VARCHAR,
    wholesale_value NUMERIC,
    market_value NUMERIC,
    days_on_market INTEGER,
    mls_status VARCHAR,
    mls_list_date VARCHAR,
    mls_list_price NUMERIC,
    status VARCHAR DEFAULT 'NEW',
    source_id UUID,
    assigned_to UUID,
    owner_type VARCHAR,
    property_type VARCHAR,
    beds VARCHAR,
    baths VARCHAR,
    square_footage VARCHAR,
    year_built VARCHAR,
    assessed_total NUMERIC,
    last_contacted_at TIMESTAMPTZ,
    notes TEXT,
    -- Contact 1 fields
    contact1name TEXT,
    contact1firstname TEXT,
    contact1lastname TEXT,
    contact1phone_1 TEXT,
    contact1phone_2 TEXT,
    contact1phone_3 TEXT,
    contact1email_1 TEXT,
    contact1email_2 TEXT,
    contact1email_3 TEXT,
    -- Contact 2 fields
    contact2name TEXT,
    contact2firstname TEXT,
    contact2lastname TEXT,
    contact2phone_1 TEXT,
    contact2phone_2 TEXT,
    contact2phone_3 TEXT,
    contact2email_1 TEXT,
    contact2email_2 TEXT,
    contact2email_3 TEXT,
    -- Contact 3 fields
    contact3name TEXT,
    contact3firstname TEXT,
    contact3lastname TEXT,
    contact3phone_1 TEXT,
    contact3phone_2 TEXT,
    contact3phone_3 TEXT,
    contact3email_1 TEXT,
    contact3email_2 TEXT,
    contact3email_3 TEXT,
    -- Contact 4 fields
    contact4name TEXT,
    contact4firstname TEXT,
    contact4lastname TEXT,
    contact4phone_1 TEXT,
    contact4phone_2 TEXT,
    contact4phone_3 TEXT,
    contact4email_1 TEXT,
    contact4email_2 TEXT,
    contact4email_3 TEXT,
    -- Contact 5 fields
    contact5name TEXT,
    contact5firstname TEXT,
    contact5lastname TEXT,
    contact5phone_1 TEXT,
    contact5phone_2 TEXT,
    contact5phone_3 TEXT,
    contact5email_1 TEXT,
    contact5email_2 TEXT,
    contact5email_3 TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts table (for normalized contact data)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Sources table
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    last_imported TIMESTAMPTZ NOT NULL,
    record_count INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Senders table
CREATE TABLE IF NOT EXISTS senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    daily_quota INTEGER DEFAULT 50,
    emails_sent INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    subject VARCHAR,
    content TEXT NOT NULL,
    type VARCHAR, -- 'EMAIL', 'LOI', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'DRAFT', -- 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'
    email_template_id UUID REFERENCES templates(id),
    loi_template_id UUID REFERENCES templates(id),
    leads_per_day INTEGER DEFAULT 10,
    start_time VARCHAR DEFAULT '09:00',
    end_time VARCHAR DEFAULT '17:00',
    min_interval_minutes INTEGER DEFAULT 15,
    max_interval_minutes INTEGER DEFAULT 45,
    attachment_type VARCHAR DEFAULT 'PDF',
    total_leads INTEGER DEFAULT 0,
    leads_worked INTEGER DEFAULT 0,
    company_logo_path VARCHAR,
    email_subject VARCHAR,
    email_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Senders junction table
CREATE TABLE IF NOT EXISTS campaign_senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES senders(id) ON DELETE CASCADE,
    emails_sent_today INTEGER DEFAULT 0,
    total_emails_sent INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, sender_id)
);

-- Campaign Leads junction table
CREATE TABLE IF NOT EXISTS campaign_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'PENDING', -- 'PENDING', 'SCHEDULED', 'PROCESSED', 'ERROR'
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, lead_id)
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES senders(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    subject VARCHAR NOT NULL,
    body TEXT NOT NULL,
    loi_path VARCHAR,
    status VARCHAR DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'OPENED', 'REPLIED', 'BOUNCED'
    opened_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    sent_at TIMESTAMPTZ,
    tracking_id UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create foreign key references
ALTER TABLE leads ADD CONSTRAINT fk_lead_source 
    FOREIGN KEY (source_id) REFERENCES lead_sources(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source_id ON leads(source_id);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_contacts_lead_id ON contacts(lead_id);
CREATE INDEX idx_emails_lead_id ON emails(lead_id);
CREATE INDEX idx_emails_sender_id ON emails(sender_id);
CREATE INDEX idx_emails_status ON emails(status);
CREATE INDEX idx_emails_tracking_id ON emails(tracking_id);
CREATE INDEX idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX idx_campaign_leads_status ON campaign_leads(status);
CREATE INDEX idx_campaign_senders_campaign_id ON campaign_senders(campaign_id);

-- Add any RLS (Row Level Security) policies here if needed