-- ===================== POLICIES & RLS =========================

-- Storage policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can upload to lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can upload to lead-uploads"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'lead-uploads' AND
    auth.role() = 'authenticated' AND
    owner = auth.uid()
  );
DROP POLICY IF EXISTS "Authenticated users can view their own uploads in lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can view their own uploads in lead-uploads"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'lead-uploads' AND
    auth.uid() = owner
  );
DROP POLICY IF EXISTS "Authenticated users can update their own uploads in lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can update their own uploads in lead-uploads"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'lead-uploads' AND
    auth.uid() = owner
  );
DROP POLICY IF EXISTS "Authenticated users can delete their own uploads in lead-uploads" ON storage.objects;
CREATE POLICY "Authenticated users can delete their own uploads in lead-uploads"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'lead-uploads' AND
    auth.uid() = owner
  );
DROP POLICY IF EXISTS "Service role full access to lead-uploads" ON storage.objects;
CREATE POLICY "Service role full access to lead-uploads"
  ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'lead-uploads' AND
    auth.role() = 'service_role'
  );

-- Lead sources policies
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users read access" ON public.lead_sources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access" ON public.lead_sources FOR ALL USING (auth.role() = 'service_role');
GRANT SELECT ON TABLE public.lead_sources TO authenticated;
GRANT ALL ON TABLE public.lead_sources TO service_role;

-- Profiles policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);
GRANT SELECT ON TABLE public.profiles TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

-- Leads policies
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read all leads" ON public.leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert leads" ON public.leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to update leads" ON public.leads FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to delete leads" ON public.leads FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to leads" ON public.leads FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.leads TO authenticated;
GRANT ALL ON TABLE public.leads TO service_role;

-- Normalized leads policies
ALTER TABLE public.normalized_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read normalized_leads" ON public.normalized_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert normalized_leads" ON public.normalized_leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow service_role full access to normalized_leads" ON public.normalized_leads FOR ALL USING (auth.role() = 'service_role');
GRANT ALL ON public.normalized_leads TO service_role;
GRANT SELECT, INSERT ON public.normalized_leads TO authenticated;

-- Console log events policies
ALTER TABLE public.console_log_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow authenticated users to read console_log_events" ON public.console_log_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users to insert console_log_events" ON public.console_log_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Service role full access to console_log_events" ON public.console_log_events FOR ALL USING (auth.role() = 'service_role');
GRANT SELECT, INSERT ON public.console_log_events TO authenticated;
GRANT ALL ON public.console_log_events TO service_role;

-- Processing Status policies
ALTER TABLE public.processing_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own processing_status" ON public.processing_status FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role full access to processing_status" ON public.processing_status FOR ALL USING (auth.role() = 'service_role');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processing_status TO authenticated;
GRANT ALL ON public.processing_status TO service_role;
