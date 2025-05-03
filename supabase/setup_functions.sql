-- ===================== FUNCTIONS =========================

-- Normalize staged leads function
DROP FUNCTION IF EXISTS public.normalize_staged_leads();
CREATE OR REPLACE FUNCTION public.normalize_staged_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure the target table exists
    CREATE TABLE IF NOT EXISTS public.normalized_leads (
        id BIGSERIAL PRIMARY KEY,
        original_lead_id UUID,
        contact_name TEXT,
        contact_email TEXT,
        property_address TEXT,
        property_city TEXT,
        property_state TEXT,
        property_postal_code TEXT,
        property_type TEXT,
        baths TEXT,
        beds TEXT,
        year_built TEXT,
        square_footage TEXT,
        wholesale_value TEXT,
        assessed_total TEXT,
        mls_curr_status TEXT,
        mls_curr_days_on_market TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    -- ... rest of normalization logic ...
END;
$$;

-- Archive normalized leads function
CREATE OR REPLACE FUNCTION public.archive_normalized_leads(source_filename TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    archive_table_name TEXT;
    unique_hash TEXT;
BEGIN
    unique_hash := encode(digest(source_filename || now()::text, 'md5'), 'hex');
    archive_table_name := 'normalized_' || regexp_replace(split_part(source_filename, '.', 1), '[^a-zA-Z0-9]', '_', 'g') || '_' || substring(unique_hash from 1 for 8);
    archive_table_name := substring(archive_table_name from 1 for 63);
    EXECUTE format('CREATE TABLE public.%I AS TABLE public.normalized_leads', archive_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_contact_email ON public.%I (contact_email)', archive_table_name, archive_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_property_address ON public.%I (property_address)', archive_table_name, archive_table_name);
    EXECUTE format('COMMENT ON TABLE public.%I IS %L', archive_table_name, 'Archived normalized leads from ' || source_filename || ' created on ' || now()::text);
    -- Enable RLS and add default service_role policy
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', archive_table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access to %I" ON public.%I', archive_table_name, archive_table_name);
    EXECUTE format('CREATE POLICY "Service role full access to %I" ON public.%I FOR ALL USING (auth.role() = ''service_role'')', archive_table_name, archive_table_name);
    RAISE NOTICE 'Normalized leads archived to table: %.', archive_table_name;
END;
$$;

-- Normalize archive table column types function
CREATE OR REPLACE FUNCTION public.normalize_archive_table_types(archive_table_name TEXT)
RETURNS void AS $$
DECLARE
  rec RECORD;
  target_type TEXT;
BEGIN
  FOR rec IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = archive_table_name
  LOOP
    -- === COLUMN TYPE MAPPING SECTION ===
    IF rec.column_name = 'beds' THEN
      target_type := 'integer';
    ELSIF rec.column_name = 'baths' THEN
      target_type := 'integer';
    ELSIF rec.column_name = 'offer_price' THEN
      target_type := 'numeric';
    ELSIF rec.column_name = 'created_at' THEN
      target_type := 'timestamptz';
    ELSE
      CONTINUE;
    END IF;
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN %I TYPE %s USING %I::%s',
      archive_table_name, rec.column_name, target_type, rec.column_name, target_type
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get the latest filename from lead_sources
CREATE OR REPLACE FUNCTION public.get_latest_lead_filename()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT file_name FROM public.lead_sources WHERE created_at = (SELECT MAX(created_at) FROM public.lead_sources) LIMIT 1;
$$;
