-- Remove the trigger if it exists
DROP TRIGGER IF EXISTS trigger_archive_on_normalized_leads_insert ON public.normalized_leads;

-- Remove the trigger function if it exists
DROP FUNCTION IF EXISTS fn_trigger_archive_normalized_leads();