-- SQL function to create health_checks table if it doesn't exist
CREATE OR REPLACE FUNCTION create_health_checks_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Check if the health_checks table exists
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'health_checks'
    ) THEN
        -- Create the health_checks table
        CREATE TABLE public.health_checks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            service_name TEXT NOT NULL,
            status TEXT NOT NULL,
            latency INTEGER NOT NULL,
            last_checked TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add row level security policies
        ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;

        -- Allow authenticated users to select
        CREATE POLICY health_checks_select_policy
            ON public.health_checks
            FOR SELECT
            TO authenticated
            USING (true);

        -- Allow service role to insert/update
        CREATE POLICY health_checks_insert_policy
            ON public.health_checks
            FOR INSERT
            TO service_role
            WITH CHECK (true);

        CREATE POLICY health_checks_update_policy
            ON public.health_checks
            FOR UPDATE
            TO service_role
            USING (true);

        -- Initialize with some data
        INSERT INTO public.health_checks (service_name, status, latency, last_checked)
        VALUES ('system', 'operational', 0, NOW());

        RAISE NOTICE 'Created health_checks table';
    ELSE
        RAISE NOTICE 'health_checks table already exists';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create the health_checks_log table if it doesn't exist
CREATE OR REPLACE FUNCTION create_health_logs_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- Check if the health_checks_log table exists
    IF NOT EXISTS (
        SELECT FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'health_checks_log'
    ) THEN
        -- Create the health_checks_log table for historical data
        CREATE TABLE public.health_checks_log (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            service_name TEXT NOT NULL,
            status TEXT NOT NULL,
            latency INTEGER NOT NULL,
            checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );

        -- Add row level security policies
        ALTER TABLE public.health_checks_log ENABLE ROW LEVEL SECURITY;

        -- Allow authenticated users to select
        CREATE POLICY health_logs_select_policy
            ON public.health_checks_log
            FOR SELECT
            TO authenticated
            USING (true);

        -- Allow service role to insert
        CREATE POLICY health_logs_insert_policy
            ON public.health_checks_log
            FOR INSERT
            TO service_role
            WITH CHECK (true);

        RAISE NOTICE 'Created health_checks_log table';
    ELSE
        RAISE NOTICE 'health_checks_log table already exists';
    END IF;
END;
$$ LANGUAGE plpgsql;