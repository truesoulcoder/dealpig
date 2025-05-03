-- =============================
-- Campaigns & Related Tables
-- =============================

-- Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'DRAFT',
  email_template_id uuid,
  loi_template_id uuid,
  lead_source_id uuid,
  leads_per_day integer NOT NULL DEFAULT 10,
  start_time text,
  end_time text,
  min_interval_minutes integer,
  max_interval_minutes integer,
  attachment_type text,
  tracking_enabled boolean DEFAULT true,
  total_leads integer DEFAULT 0,
  leads_worked integer DEFAULT 0,
  company_logo_path text,
  email_subject text,
  email_body text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  CONSTRAINT fk_lead_source FOREIGN KEY (lead_source_id) REFERENCES public.lead_sources(id) ON DELETE SET NULL
);

-- Campaign Leads table
CREATE TABLE IF NOT EXISTS public.campaign_leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING',
  assigned_to uuid,
  assigned_at timestamptz,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  bounced_at timestamptz,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Campaign Senders table
CREATE TABLE IF NOT EXISTS public.campaign_senders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL, -- references to your sender/user table
  emails_sent_today integer DEFAULT 0,
  total_emails_sent integer DEFAULT 0,
  daily_quota integer DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email Templates table (if not already present)
CREATE TABLE IF NOT EXISTS public.email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Document Templates table (if not already present)
CREATE TABLE IF NOT EXISTS public.document_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================
-- RLS & Policies
-- =============================

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Campaigns Policies
CREATE POLICY "Allow authenticated users to read campaigns" ON public.campaigns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert campaigns" ON public.campaigns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update campaigns" ON public.campaigns FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete campaigns" ON public.campaigns FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to campaigns" ON public.campaigns FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Campaign Leads Policies
CREATE POLICY "Allow authenticated users to read campaign_leads" ON public.campaign_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert campaign_leads" ON public.campaign_leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update campaign_leads" ON public.campaign_leads FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete campaign_leads" ON public.campaign_leads FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to campaign_leads" ON public.campaign_leads FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Campaign Senders Policies
CREATE POLICY "Allow authenticated users to read campaign_senders" ON public.campaign_senders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert campaign_senders" ON public.campaign_senders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update campaign_senders" ON public.campaign_senders FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete campaign_senders" ON public.campaign_senders FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to campaign_senders" ON public.campaign_senders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Email Templates Policies
CREATE POLICY "Allow authenticated users to read email_templates" ON public.email_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert email_templates" ON public.email_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update email_templates" ON public.email_templates FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete email_templates" ON public.email_templates FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to email_templates" ON public.email_templates FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Document Templates Policies
CREATE POLICY "Allow authenticated users to read document_templates" ON public.document_templates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert document_templates" ON public.document_templates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update document_templates" ON public.document_templates FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete document_templates" ON public.document_templates FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to document_templates" ON public.document_templates FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign_id ON public.campaign_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_leads_lead_id ON public.campaign_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_senders_campaign_id ON public.campaign_senders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_senders_sender_id ON public.campaign_senders(sender_id);
