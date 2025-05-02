-- Create the lead_sources table
CREATE TABLE IF NOT EXISTS public.lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Policies (adjust as needed)
CREATE POLICY "Allow authenticated users read access" ON public.lead_sources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access" ON public.lead_sources FOR ALL USING (auth.role() = 'service_role');

-- Grants
GRANT SELECT ON TABLE public.lead_sources TO authenticated;
GRANT ALL ON TABLE public.lead_sources TO service_role;