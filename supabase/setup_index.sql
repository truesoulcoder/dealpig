-- ===================== INDEXES =========================

CREATE INDEX IF NOT EXISTS idx_normalized_leads_contact_email ON public.normalized_leads(contact_email);
CREATE INDEX IF NOT EXISTS idx_normalized_leads_property_address ON public.normalized_leads(property_address);
CREATE INDEX IF NOT EXISTS idx_console_log_events_user_id ON public.console_log_events(user_id);
CREATE INDEX IF NOT EXISTS idx_console_log_events_type ON public.console_log_events(type);

CREATE INDEX IF NOT EXISTS idx_processing_status_user_id ON public.processing_status(user_id);
