--FOR REFERENCE AND COPYING ONLY!!! DO NOT OVERWRITE OR DELETE THIS FILE!

-- Optional: Drop the table if it exists, useful if you need to rerun the script
DROP TABLE IF EXISTS normalized_leads;

-- 1. Create the target table 'normalized_leads'
-- Adjust data types as needed based on your specific data (e.g., NUMERIC for currency, INTEGER for counts)
CREATE TABLE normalized_leads (
    id SERIAL PRIMARY KEY, -- Add a unique ID for each normalized row
    original_lead_id BIGINT, -- Optional: To link back to the source row ID, adjust type if needed
    contact_name TEXT,
    contact_email TEXT,
    property_address TEXT,
    property_city TEXT,
    property_state TEXT,
    property_postal_code TEXT,
    property_type TEXT,
    baths TEXT, -- Using TEXT as source might have values like '2.5'
    beds INTEGER,
    year_built INTEGER,
    square_footage INTEGER,
    wholesale_value NUMERIC,
    assessed_total NUMERIC,
    mls_curr_status TEXT,
    mls_curr_days_on_market INTEGER
);

-- 2. Insert the normalized data from the 'leads' table (3 Contacts + 1 Agent)
INSERT INTO normalized_leads (
    -- original_lead_id, -- Uncomment if your 'leads' table has an 'id' column and you included it above
    contact_name, contact_email,
    property_address, property_city, property_state, property_postal_code,
    property_type, baths, beds, year_built, square_footage,
    wholesale_value, assessed_total, mls_curr_status, mls_curr_days_on_market
)
-- Block 1: Contact 1
SELECT
    -- leads.id, -- Uncomment if linking back using 'id' primary key from 'leads' table
    leads.contact1name, leads.contact1email_1,
    leads.propertyaddress, leads.propertycity, leads.propertystate, leads.propertypostalcode,
    leads.propertytype, leads.baths, leads.beds, leads.yearbuilt, leads.squarefootage,
    leads.wholesalevalue, leads.assessedtotal, leads.mls_curr_status, leads.mls_curr_daysonmarket
FROM
    leads
WHERE
    leads.contact1name IS NOT NULL AND trim(leads.contact1name) <> ''
    AND leads.contact1email_1 IS NOT NULL AND trim(leads.contact1email_1) <> ''

UNION ALL

-- Block 2: Contact 2
SELECT
    -- leads.id,
    leads.contact2name, leads.contact2email_1,
    leads.propertyaddress, leads.propertycity, leads.propertystate, leads.propertypostalcode,
    leads.propertytype, leads.baths, leads.beds, leads.yearbuilt, leads.squarefootage,
    leads.wholesalevalue, leads.assessedtotal, leads.mls_curr_status, leads.mls_curr_daysonmarket
FROM
    leads
WHERE
    leads.contact2name IS NOT NULL AND trim(leads.contact2name) <> ''
    AND leads.contact2email_1 IS NOT NULL AND trim(leads.contact2email_1) <> ''

UNION ALL

-- Block 3: Contact 3
SELECT
    -- leads.id,
    leads.contact3name, leads.contact3email_1,
    leads.propertyaddress, leads.propertycity, leads.propertystate, leads.propertypostalcode,
    leads.propertytype, leads.baths, leads.beds, leads.yearbuilt, leads.squarefootage,
    leads.wholesalevalue, leads.assessedtotal, leads.mls_curr_status, leads.mls_curr_daysonmarket
FROM
    leads
WHERE
    leads.contact3name IS NOT NULL AND trim(leads.contact3name) <> ''
    AND leads.contact3email_1 IS NOT NULL AND trim(leads.contact3email_1) <> ''

UNION ALL

-- Block 4: MLS Current Agent
SELECT
    -- leads.id,
    leads.mls_curr_listagentname, leads.mls_curr_listagentemail,
    leads.propertyaddress, leads.propertycity, leads.propertystate, leads.propertypostalcode,
    leads.propertytype, leads.baths, leads.beds, leads.yearbuilt, leads.squarefootage,
    leads.wholesalevalue, leads.assessedtotal, leads.mls_curr_status, leads.mls_curr_daysonmarket
FROM
    leads
WHERE
    leads.mls_curr_listagentname IS NOT NULL AND trim(leads.mls_curr_listagentname) <> ''
    AND leads.mls_curr_listagentemail IS NOT NULL AND trim(leads.mls_curr_listagentemail) <> ''; -- Semicolon ends the INSERT statement here

-- Optional: Add indexes for faster lookups on common query fields
CREATE INDEX IF NOT EXISTS idx_normalized_leads_email ON normalized_leads (contact_email);
CREATE INDEX IF NOT EXISTS idx_normalized_leads_property_address ON normalized_leads (property_address);