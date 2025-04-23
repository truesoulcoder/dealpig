-- Supabase Migration SQL
-- This creates all the necessary tables for the property-email-automation system if they don't exist
-- or adds data to existing tables

-- Check the type of the id column in the leads table
DO $$ 
DECLARE
  lead_id_type text;
BEGIN
  SELECT data_type INTO lead_id_type
  FROM information_schema.columns
  WHERE table_name = 'leads' AND column_name = 'id';

  -- If leads table uses bigint for id, ensure all related tables use compatible types
  IF lead_id_type = 'bigint' THEN
    RAISE NOTICE 'Detected lead id type as bigint, using compatible types for related tables';
  ELSIF lead_id_type = 'uuid' THEN
    RAISE NOTICE 'Detected lead id type as UUID, using compatible types for related tables';
  ELSE
    RAISE NOTICE 'Lead id type is %', lead_id_type;
  END IF;
END $$;

-- Check and create leads table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
    CREATE TABLE leads (
      id BIGINT PRIMARY KEY,
      property_address TEXT NOT NULL,
      property_city TEXT NOT NULL,
      property_state TEXT NOT NULL,
      property_zip TEXT NOT NULL,
      wholesale_value DECIMAL NOT NULL,
      market_value DECIMAL NOT NULL,
      days_on_market INTEGER NOT NULL,
      mls_status TEXT NOT NULL,
      mls_list_date TIMESTAMP,
      mls_list_price DECIMAL,
      status TEXT NOT NULL DEFAULT 'NEW',
      source_id BIGINT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    -- Create indexes for leads table
    CREATE INDEX idx_leads_status ON leads (status);
    CREATE INDEX idx_leads_source_id ON leads (source_id);
  END IF;
END $$;

-- Check if source_id column exists in leads table and add it if it doesn't
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'source_id'
  ) THEN
    RAISE NOTICE 'Adding source_id column to leads table';
    ALTER TABLE leads ADD COLUMN source_id BIGINT;
  END IF;
END $$;

-- Check and create contacts table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
    CREATE TABLE contacts (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      lead_id BIGINT NOT NULL,
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
    );
    
    -- Create index for contacts table
    CREATE INDEX idx_contacts_lead_id ON contacts (lead_id);
  END IF;
END $$;

-- Check and create contact_emails table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_emails') THEN
    CREATE TABLE contact_emails (
      id BIGINT PRIMARY KEY,
      contact_id BIGINT NOT NULL,
      email TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- Check and create lead_sources table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_sources') THEN
    CREATE TABLE lead_sources (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      file_name TEXT NOT NULL,
      last_imported TIMESTAMP WITH TIME ZONE NOT NULL,
      record_count INTEGER NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Check and create senders table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'senders') THEN
    CREATE TABLE senders (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      oauth_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      emails_sent INTEGER NOT NULL DEFAULT 0,
      daily_quota INTEGER NOT NULL DEFAULT 50,
      last_sent_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Check and create emails table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emails') THEN
    CREATE TABLE emails (
      id BIGINT PRIMARY KEY,
      lead_id BIGINT NOT NULL,
      sender_id BIGINT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      loi_path TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',
      opened_at TIMESTAMP WITH TIME ZONE,
      replied_at TIMESTAMP WITH TIME ZONE,
      bounced_at TIMESTAMP WITH TIME ZONE,
      bounce_reason TEXT,
      sent_at TIMESTAMP WITH TIME ZONE,
      tracking_id TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE,
      FOREIGN KEY (sender_id) REFERENCES senders (id) ON DELETE CASCADE
    );
    
    -- Create indexes for emails table
    CREATE INDEX idx_emails_lead_id ON emails (lead_id);
    CREATE INDEX idx_emails_sender_id ON emails (sender_id);
    CREATE INDEX idx_emails_tracking_id ON emails (tracking_id);
  END IF;
END $$;

-- Check and create templates table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
    CREATE TABLE templates (
      id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'email',
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
  END IF;
END $$;

-- Check and create template_variables table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'template_variables') THEN
    CREATE TABLE template_variables (
      id BIGINT PRIMARY KEY,
      template_id BIGINT NOT NULL,
      name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
    );
  END IF;
END $$;

-- Check and create oauth_tokens table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'oauth_tokens') THEN
    CREATE TABLE oauth_tokens (
      id BIGINT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      scope TEXT NOT NULL,
      token_type TEXT NOT NULL,
      expiry_date BIGINT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    -- Create index for oauth_tokens table
    CREATE INDEX idx_oauth_tokens_email ON oauth_tokens (email);
  END IF;
END $$;

-- Add foreign key to leads table if it doesn't exist
DO $$ 
BEGIN
  -- First check if the source_id column exists in the leads table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leads' AND column_name = 'source_id'
  ) THEN
    -- Then check if the constraint already exists
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'fk_lead_source' 
      AND table_name = 'leads'
    ) THEN
      -- Create the index if it doesn't exist
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'leads' AND indexname = 'idx_leads_source_id'
      ) THEN
        CREATE INDEX idx_leads_source_id ON leads (source_id);
      END IF;
      
      -- Add the foreign key constraint
      ALTER TABLE leads ADD CONSTRAINT fk_lead_source
        FOREIGN KEY (source_id) REFERENCES lead_sources (id)
        ON DELETE SET NULL;
    END IF;
  ELSE
    RAISE NOTICE 'source_id column does not exist in leads table, skipping foreign key constraint';
  END IF;
END $$;

-- To insert data into the leads table, add INSERT statements like this:
-- Example:
-- INSERT INTO leads (id, property_address, property_city, property_state, property_zip, wholesale_value, market_value, days_on_market, mls_status, status)
-- VALUES 
--   (nextval('leads_id_seq'), '123 Main St', 'Austin', 'TX', '78701', 200000, 250000, 45, 'ACTIVE', 'NEW'),
--   (nextval('leads_id_seq'), '456 Elm St', 'Dallas', 'TX', '75201', 300000, 350000, 30, 'ACTIVE', 'NEW')
-- ON CONFLICT DO NOTHING;

-- To insert data into other tables, follow a similar pattern with INSERT statements