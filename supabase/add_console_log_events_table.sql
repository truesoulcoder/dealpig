-- =========================================================
-- SCRIPT TO ADD CONSOLE_LOG_EVENTS TABLE WITH POLICIES
-- =========================================================

-- Start Transaction
BEGIN;

-- Create console_log_events table for tracking upload events
CREATE TABLE IF NOT EXISTS public.console_log_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type text NOT NULL CHECK (type IN ('info', 'error', 'success')),
    message text NOT NULL,
    timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Add index on timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_console_log_events_timestamp ON public.console_log_events(timestamp DESC);

-- Add index on user_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_console_log_events_user_id ON public.console_log_events(user_id);

-- Add index on type for filtering by event type
CREATE INDEX IF NOT EXISTS idx_console_log_events_type ON public.console_log_events(type);

-- Enable Row Level Security
ALTER TABLE public.console_log_events ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Allow authenticated users to read console_log_events
DROP POLICY IF EXISTS "Allow authenticated users to read console_log_events" ON public.console_log_events;
CREATE POLICY "Allow authenticated users to read console_log_events" 
ON public.console_log_events 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert console_log_events
DROP POLICY IF EXISTS "Allow authenticated users to insert console_log_events" ON public.console_log_events;
CREATE POLICY "Allow authenticated users to insert console_log_events" 
ON public.console_log_events 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow service_role full access to console_log_events
DROP POLICY IF EXISTS "Allow service_role full access to console_log_events" ON public.console_log_events;
CREATE POLICY "Allow service_role full access to console_log_events" 
ON public.console_log_events 
USING (auth.role() = 'service_role');

-- Grant permissions to authenticated users and service_role
GRANT SELECT, INSERT ON public.console_log_events TO authenticated;
GRANT ALL ON public.console_log_events TO service_role;

-- No sequence to grant for UUID primary key
-- UUID is generated using uuid_generate_v4() function

-- Commit transaction
COMMIT;

-- Verify table creation
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'console_log_events'
) AS "console_log_events_table_exists";

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'console_log_events';
