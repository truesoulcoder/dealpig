-- ===================== INDEXES =========================

CREATE INDEX IF NOT EXISTS idx_normalized_leads_contact_email ON public.normalized_leads(contact_email);
CREATE INDEX IF NOT EXISTS idx_normalized_leads_property_address ON public.normalized_leads(property_address);
CREATE INDEX IF NOT EXISTS idx_console_log_events_user_id ON public.console_log_events(user_id);
CREATE INDEX IF NOT EXISTS idx_console_log_events_type ON public.console_log_events(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_id ON public.campaign_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_senders_campaign_id ON public.campaign_senders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_senders_sender_id ON public.campaign_senders(sender_id);
