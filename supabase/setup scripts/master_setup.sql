-- ===================== MASTER SETUP SCRIPT =========================
-- This script runs all modular setup scripts for DealPig in the correct order.
-- Usage: supabase db execute --file supabase/master_setup.sql

\i supabase/setup_roles.sql
\i supabase/setup_tables.sql
\i supabase/setup_index.sql
\i supabase/setup_functions.sql
\i supabase/setup_triggers.sql
\i supabase/setup_policies.sql
\i supabase/setup_rpc.sql
