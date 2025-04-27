-- =========================================================
-- COMPLETE SUPABASE SETUP SCRIPT FOR DEALPIG APPLICATION
-- Creates all tables, roles, and policies from scratch
-- Added support for dynamic lead tables (April 2025)
-- =========================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Set up auth schema permissions for service_role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;

-- Step 2: Create all application tables

-- Profiles table (essential for user management)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (core table for standardized lead data)
-- NOTE: This is now the normalized leads table. Raw lead data is stored in dynamic
-- tables named {source}_leads which are created at import time with custom columns.
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    source_record_id UUID -- Reference to the record ID in the dynamic source table
);

-- Contacts table (for normalized contact data from leads)
CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lead Sources table (updated to support dynamic tables)
CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    last_imported TIMESTAMPTZ NOT NULL,
    record_count INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB, -- Stores tableName and columnMap information
    storage_path VARCHAR, -- Path to the original CSV file in storage
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- The metadata JSONB field in lead_sources should contain:
-- {
--   "tableName": "source_name_leads",
--   "columnMap": {
--     "sourceColumn1": "standardField1",
--     "sourceColumn2": "standardField2",
--     ...
--   },
--   "importConfig": {
--     "skipHeader": true,
--     "delimiter": ",", 
--     ...
--   }
-- }

-- Senders table
CREATE TABLE IF NOT EXISTS senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    title VARCHAR NOT NULL,
    daily_quota INTEGER DEFAULT 50,
    emails_sent INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    oauth_token TEXT,
    refresh_token TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
    tracking_enabled BOOLEAN DEFAULT TRUE,
    total_leads INTEGER DEFAULT 0,
    leads_worked INTEGER DEFAULT 0,
    company_logo_path VARCHAR,
    email_subject VARCHAR,
    email_body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
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

-- Email Events table for detailed tracking
CREATE TABLE IF NOT EXISTS email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
    event_type VARCHAR NOT NULL, -- 'sent', 'delivered', 'opened', 'clicked', etc.
    recipient_email VARCHAR NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    metadata JSONB,
    user_agent TEXT,
    ip_address VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for email events
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at);

-- Create foreign key references
ALTER TABLE leads ADD CONSTRAINT fk_lead_source 
    FOREIGN KEY (source_id) REFERENCES lead_sources(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source_id ON leads(source_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_source_record_id ON leads(source_record_id);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_lead_id ON emails(lead_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender_id ON emails(sender_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_tracking_id ON emails(tracking_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON campaign_leads(status);
CREATE INDEX IF NOT EXISTS idx_campaign_senders_campaign_id ON campaign_senders(campaign_id);

-- Step 3: Create functions for dynamic table management
-- Function to create a new dynamic lead table
CREATE OR REPLACE FUNCTION create_dynamic_lead_table(table_name text, column_definitions text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  full_table_name text;
BEGIN
  -- Create a sanitized table name
  full_table_name := table_name || '_leads';
  
  -- Create the table with the provided columns
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.%I (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      %s,
      processed BOOLEAN DEFAULT FALSE, -- Flag to track if this record has been normalized
      normalized_lead_id UUID, -- Reference to the ID in the leads table once normalized
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )', full_table_name, column_definitions);
    
  -- Enable RLS on the new table
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', full_table_name);
  
  -- Create policies for the new table
  EXECUTE format('
    CREATE POLICY "Enable read access for authenticated users on %I" 
    ON public.%I FOR SELECT 
    USING (auth.role() IN (''authenticated'', ''service_role''))', full_table_name, full_table_name);
    
  EXECUTE format('
    CREATE POLICY "Enable insert for authenticated users on %I" 
    ON public.%I FOR INSERT 
    WITH CHECK (auth.role() IN (''authenticated'', ''service_role''))', full_table_name, full_table_name);
    
  EXECUTE format('
    CREATE POLICY "Enable update for authenticated users on %I" 
    ON public.%I FOR UPDATE 
    USING (auth.role() IN (''authenticated'', ''service_role''))', full_table_name, full_table_name);
    
  EXECUTE format('
    CREATE POLICY "Enable delete for authenticated users on %I" 
    ON public.%I FOR DELETE 
    USING (auth.role() IN (''authenticated'', ''service_role''))', full_table_name, full_table_name);
  
  RETURN TRUE;
END;
$$;

-- Function to execute SQL (admin operations)
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Step 3: Set up storage buckets for the application
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if storage schema exists (for Supabase Storage)
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- Create lead documents bucket
    SELECT EXISTS (
      SELECT FROM storage.buckets WHERE name = 'lead-imports'
    ) INTO bucket_exists;
    
    IF NOT bucket_exists THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection)
      VALUES ('lead-imports', 'lead-imports', false, false);
    END IF;
    
    -- Create templates bucket
    SELECT EXISTS (
      SELECT FROM storage.buckets WHERE name = 'templates'
    ) INTO bucket_exists;
    
    IF NOT bucket_exists THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection)
      VALUES ('templates', 'templates', false, false);
    END IF;
    
    -- Create generated documents bucket
    SELECT EXISTS (
      SELECT FROM storage.buckets WHERE name = 'generated-documents'
    ) INTO bucket_exists;
    
    IF NOT bucket_exists THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection)
      VALUES ('generated-documents', 'generated-documents', true, false);
    END IF;
  END IF;
END
$$;

-- Step 4: Grant permissions to service_role
-- This enables admin operations through Supabase client with service role key
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Grant storage permissions if using Supabase Storage
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    GRANT ALL PRIVILEGES ON SCHEMA storage TO service_role;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA storage TO service_role;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA storage TO service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA storage TO service_role;
  END IF;
END
$$;

-- Step 5: Enable Row Level Security on all tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.emails ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for all tables

-- Profiles table policies (special handling for user profiles)
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" 
  ON profiles 
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role or self can insert profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.role() = 'service_role' OR auth.uid() = id);

-- Leads table policies
CREATE POLICY "Enable read access for authenticated users on leads" 
  ON leads FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on leads" 
  ON leads FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on leads" 
  ON leads FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on leads" 
  ON leads FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Contacts table policies
CREATE POLICY "Enable read access for authenticated users on contacts" 
  ON contacts FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on contacts" 
  ON contacts FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on contacts" 
  ON contacts FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on contacts" 
  ON contacts FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Lead sources table policies
CREATE POLICY "Enable read access for authenticated users on lead_sources" 
  ON lead_sources FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on lead_sources" 
  ON lead_sources FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on lead_sources" 
  ON lead_sources FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on lead_sources" 
  ON lead_sources FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Senders table policies
CREATE POLICY "Enable read access for authenticated users on senders" 
  ON senders FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on senders" 
  ON senders FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on senders" 
  ON senders FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on senders" 
  ON senders FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Templates table policies
CREATE POLICY "Enable read access for authenticated users on templates" 
  ON templates FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on templates" 
  ON templates FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on templates" 
  ON templates FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on templates" 
  ON templates FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Campaigns table policies
CREATE POLICY "Enable read access for authenticated users on campaigns" 
  ON campaigns FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on campaigns" 
  ON campaigns FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on campaigns" 
  ON campaigns FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on campaigns" 
  ON campaigns FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Campaign_senders table policies
CREATE POLICY "Enable read access for authenticated users on campaign_senders" 
  ON campaign_senders FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on campaign_senders" 
  ON campaign_senders FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on campaign_senders" 
  ON campaign_senders FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on campaign_senders" 
  ON campaign_senders FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Campaign_leads table policies
CREATE POLICY "Enable read access for authenticated users on campaign_leads" 
  ON campaign_leads FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on campaign_leads" 
  ON campaign_leads FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on campaign_leads" 
  ON campaign_leads FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on campaign_leads" 
  ON campaign_leads FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Emails table policies
CREATE POLICY "Enable read access for authenticated users on emails" 
  ON emails FOR SELECT 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable insert for authenticated users on emails" 
  ON emails FOR INSERT 
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable update for authenticated users on emails" 
  ON emails FOR UPDATE 
  USING (auth.role() IN ('authenticated', 'service_role'));

CREATE POLICY "Enable delete for authenticated users on emails" 
  ON emails FOR DELETE 
  USING (auth.role() IN ('authenticated', 'service_role'));

-- Step 7: Create storage bucket policies
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- Policies for lead-imports bucket
    CREATE POLICY "Allow authenticated users to view lead imports"
      ON storage.objects FOR SELECT
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'lead-imports');
    
    CREATE POLICY "Allow authenticated users to upload lead imports"
      ON storage.objects FOR INSERT
      WITH CHECK (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'lead-imports');
    
    CREATE POLICY "Allow authenticated users to update lead imports"
      ON storage.objects FOR UPDATE
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'lead-imports');
    
    CREATE POLICY "Allow authenticated users to delete lead imports"
      ON storage.objects FOR DELETE
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'lead-imports');
    
    -- Policies for templates bucket
    CREATE POLICY "Allow authenticated users to view templates"
      ON storage.objects FOR SELECT
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'templates');
    
    CREATE POLICY "Allow authenticated users to upload templates"
      ON storage.objects FOR INSERT
      WITH CHECK (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'templates');
    
    CREATE POLICY "Allow authenticated users to update templates"
      ON storage.objects FOR UPDATE
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'templates');
    
    CREATE POLICY "Allow authenticated users to delete templates"
      ON storage.objects FOR DELETE
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'templates');
    
    -- Policies for generated-documents bucket
    CREATE POLICY "Allow authenticated users to view generated documents"
      ON storage.objects FOR SELECT
      USING (auth.role() IN ('authenticated', 'service_role', 'anon') AND bucket_id = 'generated-documents');
    
    CREATE POLICY "Allow authenticated users to upload generated documents"
      ON storage.objects FOR INSERT
      WITH CHECK (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'generated-documents');
    
    CREATE POLICY "Allow authenticated users to update generated documents"
      ON storage.objects FOR UPDATE
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'generated-documents');
    
    CREATE POLICY "Allow authenticated users to delete generated documents"
      ON storage.objects FOR DELETE
      USING (auth.role() IN ('authenticated', 'service_role') AND bucket_id = 'generated-documents');
  END IF;
END
$$;

-- Step 8: Create or replace function to handle new user creation
-- This trigger automatically creates a profile when a user registers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at, updated_at)
  VALUES (new.id, 
          COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
          new.email, 
          now(),
          now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create trigger to automatically create profile when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get table column information
CREATE OR REPLACE FUNCTION public.get_table_columns()
RETURNS SETOF information_schema.columns
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name NOT LIKE 'pg_%'
    AND table_name NOT LIKE '_prisma_%'
    ORDER BY table_name, ordinal_position;
END;
$$;

-- Function to list all dynamic lead tables
CREATE OR REPLACE FUNCTION public.list_dynamic_lead_tables()
RETURNS TABLE(
  table_name text,
  record_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name LIKE '%_leads'
    AND table_name != 'leads'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT %L, COUNT(*) FROM public.%I', tbl, tbl) INTO table_name, record_count;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- Function to query data from a dynamic lead table
CREATE OR REPLACE FUNCTION public.query_dynamic_lead_table(
  table_name text,
  query_conditions text DEFAULT '',
  page_number integer DEFAULT 1,
  page_size integer DEFAULT 50,
  sort_field text DEFAULT 'created_at',
  sort_direction text DEFAULT 'DESC'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  total_count integer;
  query_text text;
  count_query_text text;
BEGIN
  -- Add "_leads" suffix if not already present
  IF table_name NOT LIKE '%_leads' THEN
    table_name := table_name || '_leads';
  END IF;
  
  -- First get total count
  count_query_text := format('SELECT COUNT(*) FROM public.%I', table_name);
  IF query_conditions != '' THEN
    count_query_text := count_query_text || ' WHERE ' || query_conditions;
  END IF;
  
  EXECUTE count_query_text INTO total_count;
  
  -- Build main query with pagination and sorting
  query_text := format('SELECT * FROM public.%I', table_name);
  IF query_conditions != '' THEN
    query_text := query_text || ' WHERE ' || query_conditions;
  END IF;
  
  query_text := query_text || format(' ORDER BY %I %s', sort_field, sort_direction);
  query_text := query_text || format(' LIMIT %s OFFSET %s', 
                               page_size, 
                               (page_number - 1) * page_size);
                               
  -- Execute query and return results with pagination info
  EXECUTE format('
    SELECT json_build_object(
      ''data'', COALESCE(json_agg(t.*), ''[]''::json),
      ''pagination'', json_build_object(
        ''total'', %s,
        ''page'', %s,
        ''pageSize'', %s,
        ''pageCount'', CEIL(%s::float / %s)
      )
    ) FROM (%s) t', 
    total_count, page_number, page_size, total_count, page_size, query_text
  ) INTO result;
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_table_columns() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns() TO service_role;
GRANT EXECUTE ON FUNCTION public.list_dynamic_lead_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_dynamic_lead_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_dynamic_lead_table(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_dynamic_lead_table(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.query_dynamic_lead_table(text, text, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.query_dynamic_lead_table(text, text, integer, integer, text, text) TO service_role;

COMMENT ON FUNCTION public.get_table_columns IS 'Returns information about all columns in the public schema tables';
COMMENT ON FUNCTION public.list_dynamic_lead_tables IS 'Lists all dynamically created lead tables with their record count';
COMMENT ON FUNCTION public.create_dynamic_lead_table IS 'Creates a new dynamic lead table with the specified columns';
COMMENT ON FUNCTION public.execute_sql IS 'Executes SQL commands with service role privileges (admin only)';
COMMENT ON FUNCTION public.query_dynamic_lead_table IS 'Queries a dynamic lead table with pagination and filtering';

-- Verify setup with a summary report
DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  
  RAISE NOTICE '==== SETUP SUMMARY ====';
  RAISE NOTICE 'Tables created: %', table_count;
  RAISE NOTICE 'Policies created: %', policy_count;
  RAISE NOTICE 'Dynamic lead table support: ENABLED';
  RAISE NOTICE '=====================';
END;
$$;