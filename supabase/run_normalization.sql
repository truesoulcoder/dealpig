-- Script to manually run the normalization process on existing leads data
-- This will create and populate the normalized_leads table based on the current data in the leads table

-- Start a transaction
BEGIN;

-- Check if the normalization function exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'normalize_staged_leads'
  ) THEN
    RAISE EXCEPTION 'The normalize_staged_leads function does not exist. Please create it first.';
  END IF;
END $$;

-- Call the normalization function to process existing data
SELECT public.normalize_staged_leads();

-- Verify the results
SELECT COUNT(*) AS normalized_leads_count FROM public.normalized_leads;

-- Show a sample of the normalized data
SELECT * FROM public.normalized_leads LIMIT 10;

-- Commit the transaction
COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Normalization process completed successfully.';
END $$;
