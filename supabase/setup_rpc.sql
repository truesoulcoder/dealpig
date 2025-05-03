-- ===================== RPC FUNCTIONS =========================

-- Helper function to get the latest filename from lead_sources
CREATE OR REPLACE FUNCTION public.get_latest_lead_filename()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT file_name FROM public.lead_sources WHERE created_at = (SELECT MAX(created_at) FROM public.lead_sources) LIMIT 1;
$$;
