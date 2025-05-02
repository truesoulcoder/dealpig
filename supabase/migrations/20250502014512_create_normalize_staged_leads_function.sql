-- Drop the function if it exists to ensure idempotency
DROP FUNCTION IF EXISTS public.normalize_staged_leads();

-- Recreate the function with correct snake_case column names
CREATE OR REPLACE FUNCTION public.normalize_staged_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure the target table exists
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

    -- Clear the target table before inserting new normalized data
    TRUNCATE TABLE public.normalized_leads;

    -- Insert normalized data from the 'leads' staging table using snake_case
    INSERT INTO public.normalized_leads (
        original_lead_id,
        contact_name, contact_email,
        property_address, property_city, property_state, property_postal_code,
        property_type, baths, beds, year_built, square_footage,
        wholesale_value, assessed_total, mls_curr_status, mls_curr_days_on_market
    )
    -- Block 1: Contact 1
    SELECT
        leads.id,
        leads.contact1_name, leads.contact1_email_1,
        leads.property_address, leads.property_city, leads.property_state, leads.property_postal_code,
        leads.property_type, leads.baths, leads.beds, leads.year_built, leads.square_footage,
        leads.wholesale_value, leads.assessed_total, leads.mls_curr_status, leads.mls_curr_days_on_market
    FROM public.leads
    WHERE leads.contact1_name IS NOT NULL AND trim(leads.contact1_name) <> '' AND leads.contact1_email_1 IS NOT NULL AND trim(leads.contact1_email_1) <> ''
    UNION ALL
    -- Block 2: Contact 2
    SELECT
        leads.id, leads.contact2_name, leads.contact2_email_1,
        leads.property_address, leads.property_city, leads.property_state, leads.property_postal_code,
        leads.property_type, leads.baths, leads.beds, leads.year_built, leads.square_footage,
        leads.wholesale_value, leads.assessed_total, leads.mls_curr_status, leads.mls_curr_days_on_market
    FROM public.leads
    WHERE leads.contact2_name IS NOT NULL AND trim(leads.contact2_name) <> '' AND leads.contact2_email_1 IS NOT NULL AND trim(leads.contact2_email_1) <> ''
    UNION ALL
    -- Block 3: Contact 3
    SELECT
        leads.id, leads.contact3_name, leads.contact3_email_1,
        leads.property_address, leads.property_city, leads.property_state, leads.property_postal_code,
        leads.property_type, leads.baths, leads.beds, leads.year_built, leads.square_footage,
        leads.wholesale_value, leads.assessed_total, leads.mls_curr_status, leads.mls_curr_days_on_market
    FROM public.leads
    WHERE leads.contact3_name IS NOT NULL AND trim(leads.contact3_name) <> '' AND leads.contact3_email_1 IS NOT NULL AND trim(leads.contact3_email_1) <> ''
    UNION ALL
    -- Block 4: MLS Current Agent
    SELECT
        leads.id, leads.mls_curr_list_agent_name, leads.mls_curr_list_agent_email,
        leads.property_address, leads.property_city, leads.property_state, leads.property_postal_code,
        leads.property_type, leads.baths, leads.beds, leads.year_built, leads.square_footage,
        leads.wholesale_value, leads.assessed_total, leads.mls_curr_status, leads.mls_curr_days_on_market
    FROM public.leads
    WHERE leads.mls_curr_list_agent_name IS NOT NULL AND trim(leads.mls_curr_list_agent_name) <> '' AND leads.mls_curr_list_agent_email IS NOT NULL AND trim(leads.mls_curr_list_agent_email) <> '';
END;
$$;