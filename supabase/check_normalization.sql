-- Script to check if the normalization process worked correctly

-- Check if normalized_leads table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'normalized_leads'
) AS normalized_leads_exists;

-- Count rows in the normalized_leads table
SELECT COUNT(*) AS normalized_leads_count 
FROM public.normalized_leads;

-- Check for archived normalized tables (tables starting with 'normalized_')
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS table_size
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'normalized_%'
AND table_name != 'normalized_leads'
ORDER BY table_name;

-- Sample data from normalized_leads (if any)
SELECT * FROM public.normalized_leads LIMIT 10;

-- Check if trigger exists on leads table
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'leads'
AND trigger_name = 'trigger_normalize_on_leads_insert';

-- Check if normalization function exists
SELECT proname, prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'normalize_staged_leads';

-- Check if archive function exists
SELECT proname, prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'archive_normalized_leads';
