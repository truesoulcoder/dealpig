-- =========================================================
-- COMPLETE SUPABASE CLEANUP SCRIPT FOR DEALPIG APPLICATION
-- This script will remove ALL tables, functions, policies, 
-- triggers, storage buckets, and other database objects 
-- created by the setup script.
-- =========================================================

-- Start Transaction
BEGIN;

-- Disable triggers temporarily to avoid constraint issues during drop
SET session_replication_role = 'replica';

-- Step 1: Drop all custom policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      policy_rec.policyname, policy_rec.tablename);
    END LOOP;
END
$$;

-- Step 2: Remove Storage Policies and Buckets if exists
DO $$
DECLARE
  policy_rec RECORD;
BEGIN
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    -- Drop policies on storage.objects
    FOR policy_rec IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'storage'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.%I', 
                      policy_rec.policyname, policy_rec.tablename);
    END LOOP;
    
    -- Delete all objects and buckets
    DELETE FROM storage.objects WHERE bucket_id IN 
        (SELECT id FROM storage.buckets WHERE name IN ('lead-imports', 'templates', 'generated-documents'));
    DELETE FROM storage.buckets WHERE name IN ('lead-imports', 'templates', 'generated-documents');
  END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error cleaning up storage: %', SQLERRM;
END
$$;

-- Step 3: Drop all triggers
DO $$
DECLARE
  trigger_rec RECORD;
  table_rec RECORD;
BEGIN
  -- Drop the auth user trigger specifically
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Drop any other triggers in public schema
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
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I CASCADE', 
                    trigger_rec.trigger_name, table_rec.tablename);
    END LOOP;
  END LOOP;
END
$$;

-- Step 4: Drop all custom functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_table_columns() CASCADE;
DROP FUNCTION IF EXISTS public.list_dynamic_lead_tables() CASCADE;
DROP FUNCTION IF EXISTS public.query_dynamic_lead_table(text, text, integer, integer, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.group_by_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_sender_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_daily_stats(UUID, timestamptz) CASCADE;
DROP FUNCTION IF EXISTS public.create_dynamic_lead_table(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.execute_sql(text) CASCADE;
DROP FUNCTION IF EXISTS public.create_policy_if_not_exists(text, text, text, text, text) CASCADE;

-- Step 5: Drop all dynamic lead tables
DO $$
DECLARE
  tbl_name text;  -- Changed variable name to avoid ambiguity
BEGIN
  FOR tbl_name IN 
    SELECT information_schema.tables.table_name  -- Fully qualify the column name
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND information_schema.tables.table_name LIKE '%_leads'  -- Fully qualify all references
    AND information_schema.tables.table_name != 'campaign_leads'
    AND information_schema.tables.table_name != 'leads'
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl_name);  -- Use the renamed variable
  END LOOP;
END
$$;

-- Step 6: Drop all standard tables in correct order (respecting foreign keys)
-- Drop junction/child tables first
DROP TABLE IF EXISTS public.email_events CASCADE;
DROP TABLE IF EXISTS public.campaign_leads CASCADE;
DROP TABLE IF EXISTS public.campaign_senders CASCADE;
DROP TABLE IF EXISTS public.emails CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.lead_sources CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.senders CASCADE;
DROP TABLE IF EXISTS public.templates CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Step 7: Revoke permissions
-- Revoke permissions from service_role
REVOKE ALL PRIVILEGES ON SCHEMA public FROM service_role;

-- Handle storage schema if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    REVOKE ALL PRIVILEGES ON SCHEMA storage FROM service_role;
  END IF;
END
$$;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verification
DO $$
DECLARE
    table_count integer;
    function_count integer;
    policy_count integer;
BEGIN
    -- Check for remaining tables
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'leads', 'contacts', 'lead_sources', 'senders', 
                      'templates', 'campaigns', 'campaign_senders', 'campaign_leads', 'emails');
    
    -- Check for remaining functions
    SELECT COUNT(*)
    INTO function_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.proname IN ('handle_new_user', 'get_table_columns', 'list_dynamic_lead_tables',
                     'query_dynamic_lead_table', 'group_by_status', 'get_sender_stats',
                     'create_dynamic_lead_table', 'execute_sql');
    
    -- Check for remaining policies
    SELECT COUNT(*)
    INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Report status
    IF table_count = 0 AND function_count = 0 AND policy_count = 0 THEN
        RAISE NOTICE 'Cleanup successful! All DealPig application objects have been removed.';
    ELSE
        RAISE NOTICE 'Cleanup finished but some objects remain. Tables: %, Functions: %, Policies: %', 
                    table_count, function_count, policy_count;
    END IF;
END
$$;

-- DON'T drop extensions as they might be used by other apps
-- Uncomment if you specifically want to remove these extensions
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";

COMMIT;

-- =========================================================
-- CLEANUP SCRIPT COMPLETE
-- =========================================================