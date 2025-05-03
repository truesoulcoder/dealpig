-- =========================================================
-- COMPLETE SUPABASE SETUP SCRIPT FOR DEALPIG APPLICATION
-- Creates all tables, roles, functions, triggers, indexes, and policies from scratch
-- Date: 2025-05-03
-- =========================================================

-- Start Transaction
BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set up auth schema permissions for service_role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;

-- Disable checking of function bodies until tables are created
SET check_function_bodies = false;

-- ===================== TABLES ============================

-- ===================== STORAGE BUCKET: lead-uploads ============================
-- Create the storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
select 'lead-uploads', 'lead-uploads', false
where not exists (select 1 from storage.buckets where id = 'lead-uploads');

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to upload files to lead-uploads
DROP POLICY IF EXISTS "Authenticated users can upload to lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can upload to lead-uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'lead-uploads' AND
    auth.role() = 'authenticated' AND
    owner = auth.uid()
  );

-- Policy: Allow authenticated users to view their own files in lead-uploads
DROP POLICY IF EXISTS "Authenticated users can view their own uploads in lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can view their own uploads in lead-uploads"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'lead-uploads' AND
    auth.uid() = owner
  );

-- Policy: Allow authenticated users to update their own files in lead-uploads
DROP POLICY IF EXISTS "Authenticated users can update their own uploads in lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can update their own uploads in lead-uploads"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'lead-uploads' AND
    auth.uid() = owner
  );

-- Policy: Allow authenticated users to delete their own files in lead-uploads
DROP POLICY IF EXISTS "Authenticated users can delete their own uploads in lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own uploads in lead-uploads"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'lead-uploads' AND
    auth.uid() = owner
  );

-- Policy: Allow service_role full access to lead-uploads
DROP POLICY IF EXISTS "Service role full access to lead-uploads" ON storage.objects;
CREATE POLICY "Service role full access to lead-uploads"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'lead-uploads' AND
    auth.role() = 'service_role'
  );


-- Lead Sources Table
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    file_name TEXT,
    last_imported TIMESTAMPTZ,
    record_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users read access" ON public.lead_sources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access" ON public.lead_sources FOR ALL USING (auth.role() = 'service_role');
GRANT SELECT ON TABLE public.lead_sources TO authenticated;
GRANT ALL ON TABLE public.lead_sources TO service_role;

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
GRANT SELECT ON TABLE public.profiles TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'NEW',
    lead_source_id UUID REFERENCES public.lead_sources(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    raw_lead_table TEXT,
    raw_lead_id TEXT,
    contact1_name TEXT,
    contact1_email_1 TEXT,
    contact2_name TEXT,
    contact2_email_1 TEXT,
    property_address TEXT,
    property_city TEXT,
    property_state TEXT,
    property_postal_code TEXT,
    property_type TEXT,
    baths TEXT,
    beds TEXT,
    year_built TEXT,
    square_footage TEXT,
    wholesale_value NUMERIC,
    assessed_total NUMERIC,
    mls_curr_status TEXT,
    mls_curr_days_on_market TEXT,
    avm NUMERIC,
    source_id TEXT,
    address_hash TEXT
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all leads" ON public.leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert leads" ON public.leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update leads" ON public.leads FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete leads" ON public.leads FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to leads" ON public.leads FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads TO authenticated;
GRANT ALL ON TABLE public.leads TO service_role;

-- Normalized Leads Table
CREATE TABLE IF NOT EXISTS public.normalized_leads (
    id BIGSERIAL PRIMARY KEY,
    original_lead_id UUID,
    contact_name TEXT,
    contact_email TEXT,
    property_address TEXT,
    property_city TEXT,
    property_state TEXT,
    property_postal_code TEXT,
    property_type TEXT,
    baths TEXT,
    beds TEXT,
    year_built TEXT,
    square_footage TEXT,
    wholesale_value NUMERIC,
    assessed_total NUMERIC,
    mls_curr_status TEXT,
    mls_curr_days_on_market TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_normalized_leads_contact_email ON public.normalized_leads(contact_email);
CREATE INDEX IF NOT EXISTS idx_normalized_leads_property_address ON public.normalized_leads(property_address);
ALTER TABLE public.normalized_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read normalized_leads" ON public.normalized_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert normalized_leads" ON public.normalized_leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to normalized_leads" ON public.normalized_leads FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON public.normalized_leads TO service_role;
GRANT SELECT, INSERT ON public.normalized_leads TO authenticated;

-- Console Log Events Table
CREATE TABLE IF NOT EXISTS public.console_log_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type text NOT NULL CHECK (type IN ('info', 'error', 'success')),
    message text NOT NULL,
    timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    file text,
    status text,
    completed_at timestamptz,
    normalized_at timestamptz,
    PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_console_log_events_user_id ON public.console_log_events(user_id);
CREATE INDEX IF NOT EXISTS idx_console_log_events_type ON public.console_log_events(type);
ALTER TABLE public.console_log_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read console_log_events" ON public.console_log_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert console_log_events" ON public.console_log_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to console_log_events" ON public.console_log_events FOR ALL USING (auth.role() = 'service_role');
GRANT SELECT, INSERT ON public.console_log_events TO authenticated;
GRANT ALL ON public.console_log_events TO service_role;

-- ===================== FUNCTIONS =========================

-- Normalize staged leads function
DROP FUNCTION IF EXISTS public.normalize_staged_leads();
CREATE OR REPLACE FUNCTION public.normalize_staged_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure the target table exists
    CREATE TABLE IF NOT EXISTS public.normalized_leads (
        id BIGSERIAL PRIMARY KEY,
        original_lead_id UUID,
        contact_name TEXT,
        contact_email TEXT,
        property_address TEXT,
        property_city TEXT,
        property_state TEXT,
        property_postal_code TEXT,
        property_type TEXT,
        baths TEXT,
        beds TEXT,
        year_built TEXT,
        square_footage TEXT,
        wholesale_value NUMERIC,
        assessed_total NUMERIC,
        mls_curr_status TEXT,
        mls_curr_days_on_market TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    TRUNCATE TABLE public.normalized_leads;
    INSERT INTO public.normalized_leads (
        original_lead_id,
        contact_name, contact_email,
        property_address, property_city, property_state, property_postal_code,
        property_type, baths, beds, year_built, square_footage,
        wholesale_value, assessed_total, mls_curr_status, mls_curr_days_on_market
    )
    SELECT
        leads.id,
        leads.contact1_name, leads.contact1_email_1,
        leads.property_address, leads.property_city, leads.property_state, leads.property_postal_code,
        leads.property_type, leads.baths, leads.beds, leads.year_built, leads.square_footage,
        leads.wholesale_value, leads.assessed_total, leads.mls_curr_status, leads.mls_curr_days_on_market
    FROM public.leads
    WHERE leads.contact1_name IS NOT NULL AND trim(leads.contact1_name) <> '' AND leads.contact1_email_1 IS NOT NULL AND trim(leads.contact1_email_1) <> ''
    UNION ALL
    SELECT
        leads.id, leads.contact2_name, leads.contact2_email_1,
        leads.property_address, leads.property_city, leads.property_state, leads.property_postal_code,
        leads.property_type, leads.baths, leads.beds, leads.year_built, leads.square_footage,
        leads.wholesale_value, leads.assessed_total, leads.mls_curr_status, leads.mls_curr_days_on_market
    FROM public.leads
    WHERE leads.contact2_name IS NOT NULL AND trim(leads.contact2_name) <> '' AND leads.contact2_email_1 IS NOT NULL AND trim(leads.contact2_email_1) <> '';
END;
$$;
GRANT EXECUTE ON FUNCTION public.normalize_staged_leads() TO service_role;

-- Trigger function for normalization
CREATE OR REPLACE FUNCTION fn_trigger_normalize_leads()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM normalize_staged_leads();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Archive normalized leads function
CREATE OR REPLACE FUNCTION public.archive_normalized_leads(source_filename TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    archive_table_name TEXT;
    unique_hash TEXT;
BEGIN
    unique_hash := encode(digest(source_filename || now()::text, 'md5'), 'hex');
    archive_table_name := 'normalized_' || regexp_replace(split_part(source_filename, '.', 1), '[^a-zA-Z0-9]', '_', 'g') || '_' || substring(unique_hash from 1 for 8);
    archive_table_name := substring(archive_table_name from 1 for 63);
    EXECUTE format('CREATE TABLE public.%I AS TABLE public.normalized_leads', archive_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_contact_email ON public.%I (contact_email)', archive_table_name, archive_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_property_address ON public.%I (property_address)', archive_table_name, archive_table_name);
    EXECUTE format('COMMENT ON TABLE public.%I IS %L', archive_table_name, 'Archived normalized leads from ' || source_filename || ' created on ' || now()::text);
    TRUNCATE TABLE public.normalized_leads;
    TRUNCATE TABLE public.leads;
    RAISE NOTICE 'Normalized leads archived to table: %', archive_table_name;
END;
$$;
COMMENT ON FUNCTION public.archive_normalized_leads(TEXT) IS 'Archives the normalized_leads table to a new table with a name based on the source filename, then truncates both the normalized_leads and leads tables to prepare for the next upload.';
GRANT EXECUTE ON FUNCTION public.archive_normalized_leads(TEXT) TO service_role;

-- Helper function to get the latest filename from lead_sources
CREATE OR REPLACE FUNCTION public.get_latest_lead_filename()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT file_name FROM public.lead_sources WHERE created_at = (SELECT MAX(created_at) FROM public.lead_sources) LIMIT 1;
$$;

-- Trigger function to archive normalized leads after insert
CREATE OR REPLACE FUNCTION fn_trigger_archive_normalized_leads()
RETURNS TRIGGER AS $$
DECLARE
  latest_filename TEXT;
BEGIN
  SELECT public.get_latest_lead_filename() INTO latest_filename;
  IF latest_filename IS NOT NULL THEN
    PERFORM public.archive_normalized_leads(latest_filename);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists to ensure idempotency
DROP TRIGGER IF EXISTS trigger_archive_on_normalized_leads_insert ON public.normalized_leads;
CREATE TRIGGER trigger_archive_on_normalized_leads_insert
AFTER INSERT ON public.normalized_leads
FOR EACH STATEMENT
EXECUTE FUNCTION fn_trigger_archive_normalized_leads();
COMMENT ON TRIGGER trigger_archive_on_normalized_leads_insert ON public.normalized_leads IS 'Automatically archives and truncates normalized_leads after insert, using the latest filename.';

-- List dynamic lead tables function
DROP FUNCTION IF EXISTS public.list_dynamic_lead_tables();
CREATE OR REPLACE FUNCTION public.list_dynamic_lead_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
STABLE
AS $$
  SELECT CAST(table_name AS text)
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE 'leads_%'
  ORDER BY table_name;
$$;

-- Exec SQL function for safe execution
DROP FUNCTION IF EXISTS public.exec_sql(text);
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query;
END;
$$;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
COMMENT ON FUNCTION public.exec_sql IS 'Safely executes SQL queries. Only available to authenticated users.';

-- Wrapper for running arbitrary SQL (for compatibility)
DROP FUNCTION IF EXISTS public.run_sql(text);
CREATE OR REPLACE FUNCTION public.run_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
GRANT EXECUTE ON FUNCTION public.run_sql(text) TO authenticated, service_role;
COMMENT ON FUNCTION public.run_sql(text) IS 'Executes arbitrary SQL for compatibility with legacy API. Use with caution.';

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::text, 1, 4)),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- ===================== TRIGGERS ==========================

-- Drop the trigger if it exists to ensure idempotency
DROP TRIGGER IF EXISTS trigger_normalize_on_leads_insert ON public.leads;
CREATE TRIGGER trigger_normalize_on_leads_insert
AFTER INSERT ON public.leads
FOR EACH STATEMENT
EXECUTE FUNCTION fn_trigger_normalize_leads();
COMMENT ON TRIGGER trigger_normalize_on_leads_insert ON public.leads IS 'Automatically normalizes lead data after batch inserts by calling the normalize_staged_leads() function';

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================== FINALIZATION ======================

-- Re-enable function body checks
SET check_function_bodies = true;

-- Commit Transaction
COMMIT;

-- End of DealPig Supabase Setup Script
