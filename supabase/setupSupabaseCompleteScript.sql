-- =========================================================
-- COMPLETE SUPABASE SETUP SCRIPT FOR DEALPIG APPLICATION
-- Creates all tables, roles, functions, and policies from scratch
-- Combined from setup-complete-schema.sql, create-functions.sql, add-policies-if-missing.sql
-- Date: 2025-04-29
-- =========================================================

-- Start Transaction
BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 1: Set up auth schema permissions for service_role
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT SELECT ON auth.users TO service_role;

-- Step 2: Create all application tables

-- Lead Sources table (updated to support dynamic tables)
CREATE TABLE IF NOT EXISTS public.lead_sources (
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

-- Leads table (The central table where all normalized leads are consolidated is now defined by the TARGET_NORMALIZED_TABLE constant within the normalizeLeadsForSource function, which defaults to 'leads'. This central 'leads' table should exist in your database schema.)

CREATE TABLE leads (
    uuid UUID PRIMARY KEY,
    contact_name TEXT,
    contact_email TEXT,
    property_address TEXT,
    property_city TEXT,
    property_state TEXT,
    property_zip TEXT NOT NULL,
    property_type TEXT NOT NULL,
    baths TEXT,
    beds TEXT,
    year_built TEXT,
    square_footage TEXT,
    wholesale_value TEXT,
    assessed_total TEXT,
    mls_curr_status TEXT,
    mls_curr_days_on_market TEXT,    
    source_id UUID REFERENCES public.lead_sources(id) 
    );

-- Profiles table (essential for user management)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Senders table
CREATE TABLE IF NOT EXISTS public.senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    title VARCHAR,
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
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    subject VARCHAR,
    content TEXT NOT NULL,
    type VARCHAR, -- 'EMAIL', 'LOI', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'DRAFT', -- 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'
    email_template_id UUID REFERENCES public.templates(id),
    loi_template_id UUID REFERENCES public.templates(id),
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
CREATE TABLE IF NOT EXISTS public.campaign_senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.senders(id) ON DELETE CASCADE,
    emails_sent_today INTEGER DEFAULT 0,
    total_emails_sent INTEGER DEFAULT 0,
    last_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, sender_id)
);

-- Campaign Leads junction table (modified to reference dynamic lead tables)
CREATE TABLE IF NOT EXISTS public.campaign_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    lead_source_id UUID NOT NULL REFERENCES public.lead_sources(id) ON DELETE CASCADE,
    lead_record_id UUID NOT NULL,
    status VARCHAR DEFAULT 'PENDING', -- 'PENDING', 'SCHEDULED', 'PROCESSED', 'ERROR'
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, lead_source_id, lead_record_id)
);

-- Emails table (modified to reference dynamic lead tables)
CREATE TABLE IF NOT EXISTS public.emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_source_id UUID NOT NULL REFERENCES public.lead_sources(id) ON DELETE CASCADE,
    lead_record_id UUID NOT NULL,
    sender_id UUID NOT NULL REFERENCES public.senders(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    subject VARCHAR NOT NULL,
    body TEXT NOT NULL,
    loi_path VARCHAR,
    status VARCHAR DEFAULT 'SENT', -- 'SENT', 'DELIVERED', 'BOUNCED'
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    bounce_reason TEXT,
    tracking_id UUID UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Events table for detailed tracking
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id UUID REFERENCES public.emails(id) ON DELETE CASCADE,
    event_type VARCHAR NOT NULL, -- 'sent', 'delivered', 'bounced'
    recipient_email VARCHAR NOT NULL,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
    metadata JSONB,
    user_agent TEXT,
    ip_address VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_source_id ON public.campaign_leads(lead_source_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_status ON public.campaign_leads(status);
CREATE INDEX IF NOT EXISTS idx_campaign_senders_campaign_id ON public.campaign_senders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_lead_source_id ON public.emails(lead_source_id);
CREATE INDEX IF NOT EXISTS idx_emails_sender_id ON public.emails(sender_id);
CREATE INDEX IF NOT EXISTS idx_emails_status ON public.emails(status);
CREATE INDEX IF NOT EXISTS idx_emails_tracking_id ON public.emails(tracking_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON public.email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign_id ON public.email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_event_type ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at);

-- Step 3: Set up storage buckets for the application
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Check if storage schema exists (for Supabase Storage)
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- Create lead documents bucket
    SELECT EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = 'lead-imports'
    ) INTO bucket_exists;

    IF NOT bucket_exists THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
      VALUES ('lead-imports', 'lead-imports', false, false, null, null); -- Adjust limits/types if needed
    END IF;

    -- Create templates bucket
    SELECT EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = 'templates'
    ) INTO bucket_exists;

    IF NOT bucket_exists THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
      VALUES ('templates', 'templates', false, false, null, null); -- Adjust limits/types if needed
    END IF;

    -- Create generated documents bucket
    SELECT EXISTS (
      SELECT 1 FROM storage.buckets WHERE name = 'generated-documents'
    ) INTO bucket_exists;

    IF NOT bucket_exists THEN
      INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
      VALUES ('generated-documents', 'generated-documents', true, false, null, null); -- Public bucket
    END IF;
  END IF;
END
$$;

-- Step 4: Grant permissions to service_role
-- This enables admin operations through Supabase client with service role key
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role; -- Grant execute on functions later

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
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY; -- Added RLS for email_events

-- Step 6: Create all necessary functions

-- Handle new user function
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

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Table column information function
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

-- Dynamic lead tables listing function
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

-- Dynamic lead table query function
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
  safe_table_name text;
  safe_sort_field text;
  safe_sort_direction text;
BEGIN
  -- Validate sort direction
  IF upper(sort_direction) NOT IN ('ASC', 'DESC') THEN
     safe_sort_direction := 'DESC';
  ELSE
     safe_sort_direction := upper(sort_direction);
  END IF;

  -- Sanitize table name (ensure it ends with _leads and is a valid identifier)
  IF table_name NOT LIKE '%_leads' THEN
    safe_table_name := table_name || '_leads';
  ELSE
    safe_table_name := table_name;
  END IF;
  -- Further check if table exists to prevent injection (though format %I helps)
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = safe_table_name
  ) THEN
      RETURN json_build_object('error', 'Table not found');
  END IF;

  -- Sanitize sort field (check if column exists)
  IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = safe_table_name AND column_name = sort_field
  ) THEN
      safe_sort_field := 'created_at'; -- Default to created_at if invalid
  ELSE
      safe_sort_field := sort_field;
  END IF;

  -- First get total count
  count_query_text := format('SELECT COUNT(*) FROM public.%I', safe_table_name);
  IF query_conditions != '' THEN
    -- Basic validation/sanitization of query_conditions might be needed here depending on usage
    count_query_text := count_query_text || ' WHERE ' || query_conditions;
  END IF;

  EXECUTE count_query_text INTO total_count;

  -- Build main query with pagination and sorting
  query_text := format('SELECT * FROM public.%I', safe_table_name);
  IF query_conditions != '' THEN
    query_text := query_text || ' WHERE ' || query_conditions;
  END IF;

  query_text := query_text || format(' ORDER BY %I %s', safe_sort_field, safe_sort_direction);
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

-- Group by status analytics function
CREATE OR REPLACE FUNCTION public.group_by_status(campaign_id_param UUID)
RETURNS TABLE(status VARCHAR, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER -- Consider SECURITY INVOKER if user context is needed/safe
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.status,
    COUNT(*)::bigint
  FROM public.emails e
  WHERE e.campaign_id = campaign_id_param
  AND e.status IN ('SENT', 'DELIVERED', 'BOUNCED') -- Consider other statuses?
  GROUP BY e.status;
END;
$$;

-- Sender statistics function
CREATE OR REPLACE FUNCTION public.get_sender_stats(campaign_id_param UUID)
RETURNS TABLE(
  sender_id UUID,
  sender_name VARCHAR,
  sent bigint,
  delivered bigint,
  bounced bigint
)
LANGUAGE plpgsql
SECURITY DEFINER -- Consider SECURITY INVOKER if user context is needed/safe
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.name,
    COUNT(CASE WHEN e.status = 'SENT' THEN 1 END)::bigint,
    COUNT(CASE WHEN e.status = 'DELIVERED' THEN 1 END)::bigint,
    COUNT(CASE WHEN e.status = 'BOUNCED' THEN 1 END)::bigint
  FROM public.senders s
  JOIN public.campaign_senders cs ON s.id = cs.sender_id AND cs.campaign_id = campaign_id_param
  LEFT JOIN public.emails e ON s.id = e.sender_id AND e.campaign_id = campaign_id_param
  GROUP BY s.id, s.name;
END;
$$;

-- Daily email stats function
CREATE OR REPLACE FUNCTION public.get_daily_stats(
  campaign_id_param UUID,
  start_date timestamptz
)
RETURNS TABLE(
  date date,
  sent bigint,
  delivered bigint,
  bounced bigint
)
LANGUAGE plpgsql
SECURITY DEFINER -- Consider SECURITY INVOKER if user context is needed/safe
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH days AS (
    SELECT generate_series(
      date_trunc('day', start_date),
      date_trunc('day', CURRENT_DATE),
      '1 day'::interval
    )::date as day
  ),
  email_counts AS (
    SELECT
      DATE(e.created_at) as email_date,
      COUNT(CASE WHEN e.status = 'SENT' THEN 1 END) as sent,
      COUNT(CASE WHEN e.status = 'DELIVERED' THEN 1 END) as delivered,
      COUNT(CASE WHEN e.status = 'BOUNCED' THEN 1 END) as bounced
    FROM public.emails e
    WHERE e.campaign_id = campaign_id_param
    AND e.created_at >= start_date
    GROUP BY email_date
  )
  SELECT
    d.day,
    COALESCE(ec.sent, 0)::bigint,
    COALESCE(ec.delivered, 0)::bigint,
    COALESCE(ec.bounced, 0)::bigint
  FROM days d
  LEFT JOIN email_counts ec ON d.day = ec.email_date
  ORDER BY d.day;
END;
$$;

-- Dynamic lead table creation function
CREATE OR REPLACE FUNCTION public.create_dynamic_lead_table(table_name_param text, column_definitions text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Requires elevated privileges to create tables/policies
SET search_path = public
AS $$
DECLARE
  full_table_name text;
  sanitized_table_name text;
BEGIN
  -- Basic sanitization and add suffix
  sanitized_table_name := lower(regexp_replace(table_name_param, '[^a-zA-Z0-9_]+', '', 'g'));
  IF sanitized_table_name = '' OR sanitized_table_name = 'leads' THEN
      RAISE EXCEPTION 'Invalid table name provided: %', table_name_param;
  END IF;
  full_table_name := sanitized_table_name || '_leads';

  -- Validate column definitions (basic check for potentially harmful commands - needs improvement for production)
  IF column_definitions ILIKE '%drop %' OR column_definitions ILIKE '%delete %' OR column_definitions ILIKE '%update %' THEN
      RAISE EXCEPTION 'Invalid characters found in column definitions.';
  END IF;

  -- Create the table with the provided columns
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS public.%I (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      %s, -- column_definitions are inserted here
      processed BOOLEAN DEFAULT FALSE, -- Flag to track if this record has been normalized
      normalized_lead_id UUID, -- Reference to the ID in the leads table once normalized
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )', full_table_name, column_definitions);

  -- Enable RLS on the new table
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', full_table_name);

  -- Create policies for the new table (using the policy creation function defined later)
  -- Note: This assumes the policy creation function exists when this function is called.
  -- Consider creating policies after all functions are defined if issues arise.
  PERFORM public.create_policy_if_not_exists(
    format('Enable read access for authenticated users on %I', full_table_name),
    full_table_name,
    'SELECT',
    'auth.role() IN (''authenticated'', ''service_role'')'
  );
  PERFORM public.create_policy_if_not_exists(
    format('Enable insert for authenticated users on %I', full_table_name),
    full_table_name,
    'INSERT',
    'true',
    'auth.role() IN (''authenticated'', ''service_role'')'
  );
   PERFORM public.create_policy_if_not_exists(
    format('Enable update for authenticated users on %I', full_table_name),
    full_table_name,
    'UPDATE',
    'auth.role() IN (''authenticated'', ''service_role'')'
  );
   PERFORM public.create_policy_if_not_exists(
    format('Enable delete for authenticated users on %I', full_table_name),
    full_table_name,
    'DELETE',
    'auth.role() IN (''authenticated'', ''service_role'')'
  );

  -- Grant permissions to service_role for the new table
  EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', full_table_name);
  -- Grant permissions to authenticated role (adjust as needed)
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO authenticated', full_table_name);


  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error creating dynamic table %: %', full_table_name, SQLERRM;
    RETURN FALSE;
END;
$$;

-- SQL execution function (USE WITH EXTREME CAUTION - SERVICE ROLE ONLY)
CREATE OR REPLACE FUNCTION public.execute_sql(sql text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- DANGEROUS: Allows executing arbitrary SQL as the function definer
SET search_path = public
AS $$
BEGIN
  -- Only allow service_role to execute this
  IF auth.role() != 'service_role' THEN
    RETURN json_build_object('success', false, 'error', 'Permission denied');
  END IF;

  EXECUTE sql;
  RETURN json_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execution permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role; -- Trigger function, usually not called directly
GRANT EXECUTE ON FUNCTION public.get_table_columns() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_dynamic_lead_tables() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_dynamic_lead_table(text, text) TO service_role; -- Potentially dangerous, restrict further if needed
GRANT EXECUTE ON FUNCTION public.execute_sql(text) TO service_role; -- VERY DANGEROUS, SERVICE ROLE ONLY
GRANT EXECUTE ON FUNCTION public.query_dynamic_lead_table(text, text, integer, integer, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.group_by_status(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_sender_stats(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_daily_stats(UUID, timestamptz) TO authenticated, service_role;

-- Add function documentation
COMMENT ON FUNCTION public.handle_new_user IS 'Trigger function to create a profile entry when a new user signs up in auth.users.';
COMMENT ON FUNCTION public.get_table_columns IS 'Returns information about all columns in the public schema tables.';
COMMENT ON FUNCTION public.list_dynamic_lead_tables IS 'Lists all dynamically created lead tables (ending in _leads) with their record count.';
COMMENT ON FUNCTION public.create_dynamic_lead_table IS 'Creates a new dynamic lead table with the specified columns, enables RLS, and adds basic policies. Requires elevated privileges.';
COMMENT ON FUNCTION public.execute_sql IS 'Executes arbitrary SQL commands with service role privileges. USE WITH EXTREME CAUTION. Restricted to service_role.';
COMMENT ON FUNCTION public.query_dynamic_lead_table IS 'Queries a dynamic lead table with pagination, filtering, and sorting.';
COMMENT ON FUNCTION public.group_by_status IS 'Calculates the count of emails grouped by status for a specific campaign.';
COMMENT ON FUNCTION public.get_sender_stats IS 'Calculates email statistics (sent, delivered, bounced) per sender for a specific campaign.';
COMMENT ON FUNCTION public.get_daily_stats IS 'Calculates daily email statistics (sent, delivered, bounced) for a specific campaign starting from a given date.';


-- Step 7: Create RLS Policies (conditionally)

-- Function to check if a policy exists and create it if not
CREATE OR REPLACE FUNCTION public.create_policy_if_not_exists(
  policy_name text,
  table_name text,
  operation text, -- e.g., 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL'
  using_expr text,
  with_check_expr text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  policy_exists boolean;
  qualified_table_name text := 'public.' || table_name; -- Ensure schema qualification
BEGIN
  -- Check if policy exists
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = table_name
    AND policyname = policy_name
  ) INTO policy_exists;

  -- Create policy if it doesn't exist
  IF NOT policy_exists THEN
    -- For INSERT policies, only WITH CHECK is allowed (not USING)
    IF upper(operation) = 'INSERT' THEN
      -- For INSERT, use with_check_expr or fall back to using_expr for the WITH CHECK clause
      EXECUTE format('CREATE POLICY %I ON %s FOR %s WITH CHECK (%s)',
                  policy_name, qualified_table_name, upper(operation), 
                  COALESCE(with_check_expr, using_expr));
    ELSE
      -- For other operations (SELECT, UPDATE, DELETE, ALL)
      IF with_check_expr IS NULL THEN
        EXECUTE format('CREATE POLICY %I ON %s FOR %s USING (%s)',
                    policy_name, qualified_table_name, upper(operation), using_expr);
      ELSE
        EXECUTE format('CREATE POLICY %I ON %s FOR %s USING (%s) WITH CHECK (%s)',
                    policy_name, qualified_table_name, upper(operation), using_expr, with_check_expr);
      END IF;
    END IF;
    RAISE NOTICE 'Policy "%" created for table "%".', policy_name, table_name;
  ELSE
    RAISE NOTICE 'Policy "%" already exists for table "%". Skipping.', policy_name, table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on helper function (needed if called by other functions/roles)
GRANT EXECUTE ON FUNCTION public.create_policy_if_not_exists(text, text, text, text, text) TO service_role;

-- Apply policies using the helper function

-- Profiles table policies
DO $$
BEGIN
  -- First, ensure RLS is enabled on profiles table
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  -- Create 'Service role can manage all profiles' policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Service role can manage all profiles'
  ) THEN
    CREATE POLICY "Service role can manage all profiles" 
    ON public.profiles 
    USING (auth.role() = 'service_role');
  END IF;

  -- Create 'Users can update their own profile' policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can update their own profile'
  ) THEN
    CREATE POLICY "Users can update their own profile" 
    ON public.profiles 
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;

  -- Create 'Users can view their own profile' policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'Users can view their own profile'
  ) THEN
    CREATE POLICY "Users can view their own profile" 
    ON public.profiles 
    FOR SELECT
    USING (auth.uid() = id);
  END IF;
END
$$;

-- Generic policies for most tables (Authenticated users can perform CRUD)
DO $$
DECLARE
  tbl text;
  auth_expr text := 'auth.role() IN (''authenticated'', ''service_role'')';
BEGIN
  -- Updated array to remove 'leads' and 'contacts' tables
  FOREACH tbl IN ARRAY ARRAY['lead_sources', 'senders', 'templates', 'campaigns', 'campaign_senders', 'campaign_leads', 'emails', 'email_events']
  LOOP
    -- SELECT policy (only needs USING clause)
    PERFORM public.create_policy_if_not_exists(
      format('Enable read access for authenticated users on %s', tbl), 
      tbl, 
      'SELECT', 
      auth_expr
    );
    
    -- INSERT policy (only needs WITH CHECK clause for INSERT)
    PERFORM public.create_policy_if_not_exists(
      format('Enable insert for authenticated users on %s', tbl), 
      tbl, 
      'INSERT', 
      auth_expr
    );
    
    -- UPDATE policy (needs both USING and WITH CHECK)
    PERFORM public.create_policy_if_not_exists(
      format('Enable update for authenticated users on %s', tbl), 
      tbl, 
      'UPDATE', 
      auth_expr, 
      auth_expr
    );
    
    -- DELETE policy (only needs USING clause)
    PERFORM public.create_policy_if_not_exists(
      format('Enable delete for authenticated users on %s', tbl), 
      tbl, 
      'DELETE', 
      auth_expr
    );
  END LOOP;
END;
$$;

-- Storage bucket policies
DO $$
DECLARE
  bucket_name text;
  bucket_id text;
  policy_name text;
  policy_exists boolean;
BEGIN
  -- Check if storage schema exists
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    
    -- Lead-imports bucket policies
    bucket_name := 'lead-imports';
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = bucket_name) THEN
      -- Get the bucket ID
      SELECT id INTO bucket_id FROM storage.buckets WHERE name = bucket_name;
      
      -- Read policy
      policy_name := 'Allow authenticated read on lead imports';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR SELECT
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Insert policy
      policy_name := 'Allow authenticated insert on lead imports';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Update policy
      policy_name := 'Allow authenticated update on lead imports';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR UPDATE
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Delete policy
      policy_name := 'Allow authenticated delete on lead imports';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR DELETE
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
    END IF;
    
    -- Templates bucket policies
    bucket_name := 'templates';
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = bucket_name) THEN
      -- Get the bucket ID
      SELECT id INTO bucket_id FROM storage.buckets WHERE name = bucket_name;
      
      -- Read policy
      policy_name := 'Allow authenticated read on templates';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR SELECT
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Insert policy
      policy_name := 'Allow authenticated insert on templates';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Update policy
      policy_name := 'Allow authenticated update on templates';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR UPDATE
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Delete policy
      policy_name := 'Allow authenticated delete on templates';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR DELETE
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
    END IF;
    
    -- Generated documents bucket policies (public read, authenticated write)
    bucket_name := 'generated-documents';
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE name = bucket_name) THEN
      -- Get the bucket ID
      SELECT id INTO bucket_id FROM storage.buckets WHERE name = bucket_name;
      
      -- Read policy - public access (anyone can read)
      policy_name := 'Allow public read on generated documents';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR SELECT
          USING (bucket_id = ''%s'')',  -- No auth check for public read
          policy_name, bucket_id
        );
      END IF;
      
      -- Insert policy - authenticated only
      policy_name := 'Allow authenticated insert on generated documents';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR INSERT
          WITH CHECK (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Update policy - authenticated only
      policy_name := 'Allow authenticated update on generated documents';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR UPDATE
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
      
      -- Delete policy - authenticated only
      policy_name := 'Allow authenticated delete on generated documents';
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = policy_name 
        AND tablename = 'objects'
        AND schemaname = 'storage'
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        EXECUTE format('
          CREATE POLICY "%s"
          ON storage.objects FOR DELETE
          USING (bucket_id = ''%s'' AND auth.role() IN (''authenticated'', ''service_role''))',
          policy_name, bucket_id
        );
      END IF;
    END IF;
    
    -- Enable RLS on storage.objects if not already enabled
    -- Check if RLS is enabled using pg_class and pg_namespace instead of pg_tables
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'storage'
      AND c.relname = 'objects'
      AND c.relrowsecurity = true
    ) THEN
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    END IF;
    
  ELSE
    RAISE NOTICE 'Storage schema not found. Skipping storage policies.';
  END IF;
END
$$;

-- Add a helper function to check if a table exists
CREATE OR REPLACE FUNCTION public.check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = $1
  );
END;
$$;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION public.check_table_exists(text) TO authenticated, service_role;

-- Commit Transaction
COMMIT;

-- =========================================================
-- SETUP SCRIPT COMPLETE
-- =========================================================