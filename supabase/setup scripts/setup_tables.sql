-- ===================== TABLES ============================

-- Lead Sources Table
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    file_name TEXT,
    last_imported TIMESTAMPTZ,
    record_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    storage_path TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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


-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid not null default extensions.uuid_generate_v4 (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  status text not null default 'NEW'::text,
  lead_source_id uuid null,
  assigned_to uuid null,
  notes text null,
  last_contacted_at timestamp with time zone null,
  raw_lead_table text null,
  raw_lead_id text null,
  contact1_name text null,
  contact1_email_1 text null,
  contact2_name text null,
  contact2_email_1 text null,
  property_address text null,
  property_city text null,
  property_state text null,
  property_postal_code text null,
  property_type text null,
  baths text null,
  beds text null,
  year_built text null,
  square_footage text null,
  wholesale_value text null,
  assessed_total text null,
  mls_curr_status text null,
  mls_curr_days_on_market text null,
  avm text null,
  source_id text null,
  address_hash text null,
  airconditioning text null,
  first_name text null,
  last_name text null,
  recipient_address text null,
  recipient_city text null,
  recipient_state text null,
  recipient_postal_code text null,
  county text null,
  owner_type text null,
  last_sales_date text null,
  last_sales_price text null,
  price_per_sqft text null,
  lot_size_sqft text null,
  contact1_phone_1 text null,
  contact1_phone_1_type text null,
  contact1_phone_1_dnc text null,
  contact1_phone_1_litigator text null,
  contact1_phone_2 text null,
  contact1_phone_2_type text null,
  contact1_phone_2_dnc text null,
  contact1_phone_2_litigator text null,
  contact1_phone_3 text null,
  contact1_phone_3_type text null,
  contact1_phone_3_dnc text null,
  contact1_phone_3_litigator text null,
  contact1_email_2 text null,
  contact1_email_3 text null,
  contact2_phone_1 text null,
  contact2_phone_1_type text null,
  contact2_phone_1_dnc text null,
  contact2_phone_1_litigator text null,
  contact2_phone_2 text null,
  contact2_phone_2_type text null,
  contact2_phone_2_dnc text null,
  contact2_phone_2_litigator text null,
  contact2_phone_3 text null,
  contact2_phone_3_type text null,
  contact2_phone_3_dnc text null,
  contact2_phone_3_litigator text null,
  contact2_email_2 text null,
  contact2_email_3 text null,
  contact3_name text null,
  contact3_phone_1 text null,
  contact3_phone_1_type text null,
  contact3_phone_1_dnc text null,
  contact3_phone_1_litigator text null,
  contact3_email_1 text null,
  contact3_phone_2 text null,
  contact3_phone_2_type text null,
  contact3_phone_2_dnc text null,
  contact3_phone_2_litigator text null,
  contact3_email_2 text null,
  contact3_phone_3 text null,
  contact3_phone_3_type text null,
  contact3_phone_3_dnc text null,
  contact3_phone_3_litigator text null,
  contact3_email_3 text null,
  house_style text null,
  assessed_year text null,
  school_district text null,
  stories text null,
  heating_fuel text null,
  subdivision text null,
  zoning text null,
  units text null,
  condition text null,
  exterior text null,
  interior_walls text null,
  basement text null,
  roof text null,
  roof_shape text null,
  water text null,
  sewer text null,
  location_influence text null,
  heating text null,
  air_conditioning text null,
  fireplace text null,
  garage text null,
  patio text null,
  pool text null,
  porch text null,
  tax_amount text null,
  rental_estimate_low text null,
  rental_estimate_high text null,
  market_value text null,
  mls_curr_listing_id text null,
  mls_curr_list_date text null,
  mls_curr_sold_date text null,
  mls_curr_list_price text null,
  mls_curr_sale_price text null,
  mls_curr_description text null,
  mls_curr_source text null,
  mls_curr_list_agent_name text null,
  mls_curr_list_agent_phone text null,
  mls_curr_list_agent_email text null,
  mls_curr_list_agent_office text null,
  mls_curr_price_per_sqft text null,
  mls_curr_sqft text null,
  mls_curr_basement text null,
  mls_curr_lot text null,
  mls_curr_beds text null,
  mls_curr_baths text null,
  mls_curr_garage text null,
  mls_curr_stories text null,
  mls_curr_year_built text null,
  mls_curr_photos text null,
  mls_prev_listing_id text null,
  mls_prev_status text null,
  mls_prev_list_date text null,
  mls_prev_sold_date text null,
  mls_prev_days_on_market text null,
  mls_prev_list_price text null,
  mls_prev_sale_price text null,
  mls_prev_description text null,
  mls_prev_source text null,
  mls_prev_list_agent_name text null,
  mls_prev_list_agent_phone text null,
  mls_prev_list_agent_email text null,
  mls_prev_list_agent_office text null,
  mls_prev_price_per_sqft text null,
  mls_prev_sqft text null,
  mls_prev_basement text null,
  mls_prev_lot text null,
  mls_prev_beds text null,
  mls_prev_baths text null,
  mls_prev_garage text null,
  mls_prev_stories text null,
  mls_prev_year_built text null,
  mls_prev_photos text null,
  constraint leads_pkey primary key (id),
  constraint leads_assigned_to_fkey foreign KEY (assigned_to) references profiles (id) on delete set null,
  constraint leads_lead_source_id_fkey foreign KEY (lead_source_id) references lead_sources (id) on delete set null
) TABLESPACE pg_default;

-- Normalized Leads Table
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
    wholesale_value NUMERIC,
    assessed_total NUMERIC,
    mls_curr_status TEXT,
    mls_curr_days_on_market TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Console Log Events Table
CREATE TABLE IF NOT EXISTS public.console_log_events (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    type text NOT NULL CHECK (type IN ('info', 'error', 'success')),
    message text NOT NULL,
    timestamp bigint NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    file text,
    status text,
    completed_at timestamptz,
    normalized_at timestamptz,
    PRIMARY KEY (id)
);
