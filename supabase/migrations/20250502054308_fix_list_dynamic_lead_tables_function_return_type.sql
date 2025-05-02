-- Final, minimal, type‑safe version
DROP FUNCTION IF EXISTS public.list_dynamic_lead_tables;

CREATE FUNCTION public.list_dynamic_lead_tables()
RETURNS SETOF text
LANGUAGE sql
STABLE
AS $$
  SELECT tablename::text
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename LIKE 'leads_%'
  ORDER BY tablename;
$$;