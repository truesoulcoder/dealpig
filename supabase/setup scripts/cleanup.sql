-- =========================================================
-- COMPLETE SUPABASE CLEANUP SCRIPT FOR DEALPIG APPLICATION
-- This script will remove ALL tables, functions, policies,
-- triggers, storage buckets, and other database objects
-- created by the setupSupabaseCompleteScript.sql.
-- Date: 2025-05-01
-- =========================================================

-- Start Transaction
BEGIN;

-- Disable triggers temporarily to avoid constraint issues during drop
SET session_replication_role = 'replica';

-- Step 1: Drop all custom policies in the public schema
-- This includes policies on standard tables and dynamically created tables.
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    RAISE NOTICE 'Dropping policies in public schema...';
    FOR policy_rec IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        -- Check if the table still exists before trying to drop the policy
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = policy_rec.tablename) THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, policy_rec.tablename);
            RAISE NOTICE 'Dropped policy % on table %', policy_rec.policyname, policy_rec.tablename;
        ELSE
             RAISE NOTICE 'Table % not found, skipping policy drop for %', policy_rec.tablename, policy_rec.policyname;
        END IF;
    END LOOP;
    RAISE NOTICE 'Finished dropping policies in public schema.';
END
$$;

-- Step 2: Remove Storage Policies, Objects, and Buckets if storage schema exists
DO $$
DECLARE
  policy_rec RECORD;
  bucket_rec RECORD;
BEGIN
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    RAISE NOTICE 'Cleaning up storage...';
    -- Drop policies on storage.objects first
    RAISE NOTICE 'Dropping storage policies...';
    FOR policy_rec IN
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.%I', policy_rec.policyname, policy_rec.tablename);
        RAISE NOTICE 'Dropped storage policy %', policy_rec.policyname;
    END LOOP;

    -- Delete all objects from relevant buckets created by setup script
    RAISE NOTICE 'Deleting objects from storage buckets...';
    FOR bucket_rec IN SELECT id, name FROM storage.buckets WHERE name IN ('lead-uploads', 'templates', 'generated-documents') LOOP
        DELETE FROM storage.objects WHERE bucket_id = bucket_rec.id;
        RAISE NOTICE 'Deleted objects from bucket %', bucket_rec.name;
    END LOOP;

    -- Delete the buckets themselves
    RAISE NOTICE 'Deleting storage buckets...';
    DELETE FROM storage.buckets WHERE name IN ('lead-uploads', 'templates', 'generated-documents');
    RAISE NOTICE 'Deleted buckets: lead-uploads, templates, generated-documents.';

    RAISE NOTICE 'Finished cleaning up storage.';
  ELSE
    RAISE NOTICE 'Storage schema not found. Skipping storage cleanup.';
  END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error cleaning up storage: %', SQLERRM;
END
$$;

-- Step 3: Drop all custom triggers
DO $$
DECLARE
  trigger_rec RECORD;
  table_rec RECORD;
BEGIN
  RAISE NOTICE 'Dropping custom triggers...';
  -- Drop the auth user trigger specifically
  IF EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created'
      AND event_object_schema = 'auth'
      AND event_object_table = 'users'
  ) THEN
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      RAISE NOTICE 'Dropped trigger on_auth_user_created on auth.users.';
  END IF;

  -- Drop any other triggers in public schema (if any were added manually)
  FOR table_rec IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    FOR trigger_rec IN
      SELECT trigger_name
      FROM information_schema.triggers
      WHERE event_object_schema = 'public'
      AND event_object_table = table_rec.tablename
    LOOP
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', trigger_rec.trigger_name, table_rec.tablename);
      RAISE NOTICE 'Dropped trigger % on table %', trigger_rec.trigger_name, table_rec.tablename;
    END LOOP;
  END LOOP;
  RAISE NOTICE 'Finished dropping custom triggers.';
END
$$;

-- Step 4: Drop all custom functions created by the setup script
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_table_columns() CASCADE;
DROP FUNCTION IF EXISTS public.list_dynamic_lead_tables() CASCADE; -- Drops both versions if they exist
DROP FUNCTION IF EXISTS public.query_dynamic_lead_table(text, text, integer, integer, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.group_by_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_sender_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_stats(UUID, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.create_dynamic_lead_table(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.execute_sql(text) CASCADE;
DROP FUNCTION IF EXISTS public.create_policy_if_not_exists(text, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.run_sql(text) CASCADE;
DROP FUNCTION IF EXISTS public.normalize_staged_leads() CASCADE;
DROP FUNCTION IF EXISTS public.archive_normalized_leads(TEXT) CASCADE; -- Drop archive function
DROP FUNCTION IF EXISTS public.fn_trigger_normalize_leads() CASCADE; -- Drop trigger function

-- Step 5: Drop all dynamic lead tables (ending in _leads, excluding 'leads' and 'campaign_leads')
DO $$
DECLARE
  tbl_name text;
BEGIN
  RAISE NOTICE 'Dropping dynamic lead tables...';
  FOR tbl_name IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE '%_leads'
    AND table_name NOT IN ('leads', 'campaign_leads') -- Exclude the main and junction tables
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl_name);
    RAISE NOTICE 'Dropped dynamic table %', tbl_name;
  END LOOP;
  RAISE NOTICE 'Finished dropping dynamic lead tables.';
END
$$;

-- Step 6: Drop all standard tables in correct dependency order
-- Drop indexes explicitly (in case some remain after CASCADE)
DROP INDEX IF EXISTS idx_normalized_leads_contact_email;
DROP INDEX IF EXISTS idx_normalized_leads_property_address;
DROP INDEX IF EXISTS idx_console_log_events_user_id;
DROP INDEX IF EXISTS idx_console_log_events_type;
DROP INDEX IF EXISTS idx_campaigns_user_id;
DROP INDEX IF EXISTS idx_campaign_leads_campaign_id;
DROP INDEX IF EXISTS idx_campaign_leads_lead_id;
DROP INDEX IF EXISTS idx_campaign_senders_campaign_id;
DROP INDEX IF EXISTS idx_campaign_senders_sender_id;

-- Drop junction/child tables first
DROP TABLE IF EXISTS public.campaign_leads CASCADE;
DROP TABLE IF EXISTS public.campaign_senders CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS public.document_templates CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.console_log_events CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.normalized_leads CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.lead_sources CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
-- Add any other tables created by setup_tables.sql here

-- Step 7: Revoke permissions (Optional but good practice)
-- Note: Dropping objects usually removes associated grants. Explicit revoke is generally not needed here.
-- Example: REVOKE ALL PRIVILEGES ON SCHEMA public FROM service_role;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verification Step
DO $$
DECLARE
    table_count integer;
    function_count integer;
    policy_count integer;
    dynamic_table_count integer;
    trigger_exists boolean;
    bucket_count integer;
BEGIN
    RAISE NOTICE 'Starting verification...';
    -- Check for remaining standard tables created by setup
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'leads', 'lead_sources', 'senders',
                      'templates', 'campaigns', 'campaign_senders', 'campaign_leads', 'emails', 'email_events',
                      'normalized_leads', 'console_log_events', 'processing_status');

    -- Check for remaining dynamic tables created by setup
    SELECT COUNT(*)
    INTO dynamic_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name LIKE '%_leads'
    AND table_name NOT IN ('leads', 'campaign_leads');

    -- Check for remaining functions created by setup
    SELECT COUNT(*)
    INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('handle_new_user', 'get_table_columns', 'list_dynamic_lead_tables',
                     'query_dynamic_lead_table', 'group_by_status', 'get_sender_stats',
                     'get_daily_stats', 'create_dynamic_lead_table', 'execute_sql',
                     'create_policy_if_not_exists', 'run_sql',
                     'normalize_staged_leads', 'archive_normalized_leads', 'fn_trigger_normalize_leads'); -- Added normalize_staged_leads

    -- Check for remaining policies in public schema
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';

    -- Check if auth trigger exists
    SELECT EXISTS (
      SELECT 1 FROM information_schema.triggers
      WHERE trigger_name = 'on_auth_user_created'
      AND event_object_schema = 'auth'
      AND event_object_table = 'users'
    ) INTO trigger_exists;

    -- Check for remaining storage buckets
    IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        SELECT COUNT(*)
        INTO bucket_count
        FROM storage.buckets
        WHERE name IN ('lead-uploads', 'templates', 'generated-documents');
    ELSE
        bucket_count := 0; -- Storage schema doesn't exist
    END IF;


    -- Report status
    IF table_count = 0 AND dynamic_table_count = 0 AND function_count = 0 AND policy_count = 0 AND NOT trigger_exists AND bucket_count = 0 THEN
        RAISE NOTICE 'Verification successful! All DealPig application objects appear to have been removed.';
    ELSE
        RAISE WARNING 'Verification finished but some objects may remain.';
        IF table_count > 0 THEN RAISE WARNING '- Standard Tables remaining: %', table_count; END IF;
        IF dynamic_table_count > 0 THEN RAISE WARNING '- Dynamic Tables remaining: %', dynamic_table_count; END IF;
        IF function_count > 0 THEN RAISE WARNING '- Functions remaining: %', function_count; END IF;
        IF policy_count > 0 THEN RAISE WARNING '- Public Policies remaining: %', policy_count; END IF;
        IF trigger_exists THEN RAISE WARNING '- Auth trigger remaining.'; END IF;
        IF bucket_count > 0 THEN RAISE WARNING '- Storage Buckets remaining: %', bucket_count; END IF;
    END IF;
END
$$;

-- DON'T drop extensions as they might be used by other apps or Supabase itself.
-- Uncomment if you are absolutely sure you want to remove these extensions.
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";

COMMIT;

-- =========================================================
-- CLEANUP SCRIPT COMPLETE
-- =========================================================