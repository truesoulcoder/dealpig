-- Final fix for list_dynamic_lead_tables function

-- Drop existing function
DROP FUNCTION IF EXISTS public.list_dynamic_lead_tables();

-- Create a simple SQL function that returns an array of text values
CREATE OR REPLACE FUNCTION public.list_dynamic_lead_tables()
RETURNS TABLE(table_name text) -- Match exactly what the frontend expects
LANGUAGE sql
STABLE
AS $$
  SELECT CAST(table_name AS text) -- Explicit cast to text type
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name LIKE 'leads_%'
  ORDER BY table_name;
$$;