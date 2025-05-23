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

-- Policies for processing_status
ALTER TABLE public.processing_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_access ON public.processing_status;
CREATE POLICY service_role_all_access ON public.processing_status
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS select_own_processing_status ON public.processing_status;
CREATE POLICY select_own_processing_status ON public.processing_status
    FOR SELECT
    USING (auth.uid() = user_id);
