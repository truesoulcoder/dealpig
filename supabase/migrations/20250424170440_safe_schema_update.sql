-- Safe schema update that checks for existence before creating objects
-- Extension already exists so we keep the IF NOT EXISTS clause
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix any missing tables (using IF NOT EXISTS)
DO $$
BEGIN
    -- Check and create contacts table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        CREATE TABLE public.contacts (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR NOT NULL,
            email VARCHAR NOT NULL,
            lead_id UUID NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- We'll add the foreign key after we ensure the leads table exists
        RAISE NOTICE 'Created contacts table';
    END IF;
    
    -- Fix foreign key references for contacts table
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') 
        AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads')
        AND NOT EXISTS (
            SELECT FROM pg_constraint 
            WHERE conname = 'contacts_lead_id_fkey' 
            AND conrelid = 'public.contacts'::regclass
        ) 
    THEN
        ALTER TABLE public.contacts
        ADD CONSTRAINT contacts_lead_id_fkey
        FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added foreign key constraint to contacts table';
    END IF;
END$$;

-- Safely add indexes (only if they don't exist)
DO $$
DECLARE
    idx_exists boolean;
BEGIN
    -- Check for leads indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'leads' 
        AND indexname = 'idx_leads_status'
    ) INTO idx_exists;
    
    IF NOT idx_exists THEN
        CREATE INDEX idx_leads_status ON public.leads(status);
        RAISE NOTICE 'Created index idx_leads_status';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'leads' 
        AND indexname = 'idx_leads_source_id'
    ) INTO idx_exists;
    
    IF NOT idx_exists THEN
        CREATE INDEX idx_leads_source_id ON public.leads(source_id);
        RAISE NOTICE 'Created index idx_leads_source_id';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'leads' 
        AND indexname = 'idx_leads_created_at'
    ) INTO idx_exists;
    
    IF NOT idx_exists THEN
        CREATE INDEX idx_leads_created_at ON public.leads(created_at);
        RAISE NOTICE 'Created index idx_leads_created_at';
    END IF;
    
    -- Check for contacts indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'contacts' 
        AND indexname = 'idx_contacts_lead_id'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
        CREATE INDEX idx_contacts_lead_id ON public.contacts(lead_id);
        RAISE NOTICE 'Created index idx_contacts_lead_id';
    END IF;
    
    -- Check for emails indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'emails' 
        AND indexname = 'idx_emails_lead_id'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emails') THEN
        CREATE INDEX idx_emails_lead_id ON public.emails(lead_id);
        RAISE NOTICE 'Created index idx_emails_lead_id';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'emails' 
        AND indexname = 'idx_emails_sender_id'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emails') THEN
        CREATE INDEX idx_emails_sender_id ON public.emails(sender_id);
        RAISE NOTICE 'Created index idx_emails_sender_id';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'emails' 
        AND indexname = 'idx_emails_status'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emails') THEN
        CREATE INDEX idx_emails_status ON public.emails(status);
        RAISE NOTICE 'Created index idx_emails_status';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'emails' 
        AND indexname = 'idx_emails_tracking_id'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'emails') THEN
        CREATE INDEX idx_emails_tracking_id ON public.emails(tracking_id);
        RAISE NOTICE 'Created index idx_emails_tracking_id';
    END IF;
    
    -- Check for campaign_leads indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'campaign_leads' 
        AND indexname = 'idx_campaign_leads_campaign_id'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_leads') THEN
        CREATE INDEX idx_campaign_leads_campaign_id ON public.campaign_leads(campaign_id);
        RAISE NOTICE 'Created index idx_campaign_leads_campaign_id';
    END IF;
    
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'campaign_leads' 
        AND indexname = 'idx_campaign_leads_status'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_leads') THEN
        CREATE INDEX idx_campaign_leads_status ON public.campaign_leads(status);
        RAISE NOTICE 'Created index idx_campaign_leads_status';
    END IF;
    
    -- Check for campaign_senders indexes
    SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'campaign_senders' 
        AND indexname = 'idx_campaign_senders_campaign_id'
    ) INTO idx_exists;
    
    IF NOT idx_exists AND EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_senders') THEN
        CREATE INDEX idx_campaign_senders_campaign_id ON public.campaign_senders(campaign_id);
        RAISE NOTICE 'Created index idx_campaign_senders_campaign_id';
    END IF;
END$$;