-- ===================== TRIGGERS =========================

-- Trigger function for normalization
CREATE OR REPLACE FUNCTION fn_trigger_normalize_leads()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM normalize_staged_leads();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

create trigger trigger_normalize_on_leads_insert
after INSERT on leads for EACH STATEMENT
execute FUNCTION fn_trigger_normalize_leads ();
