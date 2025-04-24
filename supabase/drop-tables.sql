-- DealPig Database Tables Cleanup Script
-- WARNING: This script will remove all tables and data from your database
-- Make sure you have backups if needed before running this

-- Disable triggers temporarily to avoid constraint issues during drop
SET session_replication_role = 'replica';

-- Drop all tables in the correct order to handle foreign key constraints
-- First drop junction tables and tables with dependencies

-- Drop additional dependency tables first
DROP TABLE IF EXISTS contact_emails CASCADE;

-- Drop campaign-related junction tables
DROP TABLE IF EXISTS campaign_leads CASCADE;
DROP TABLE IF EXISTS campaign_senders CASCADE;

-- Drop entity tables with foreign keys
DROP TABLE IF EXISTS template_variables CASCADE;
DROP TABLE IF EXISTS emails CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS oauth_tokens CASCADE;

-- Drop main entity tables
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS lead_sources CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS senders CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Drop metrics tables if they exist
DROP TABLE IF EXISTS campaign_metrics CASCADE;
DROP TABLE IF EXISTS email_metrics CASCADE;
DROP TABLE IF EXISTS document_generations CASCADE;

-- Drop document related tables
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS document_templates CASCADE;

-- Drop auth-related tables (if not managed by Supabase Auth)
-- NOTE: Be careful with these as they may be managed by Supabase Auth
-- Only uncomment if you are managing these tables yourself
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP TABLE IF EXISTS api_keys CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify tables are dropped
DO $$
DECLARE
    table_count integer;
BEGIN
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Remaining tables in the public schema: %', table_count;
END $$;