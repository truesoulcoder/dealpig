-- NORMALIZED_LEAD_PROCESSING.sql
-- STEP 3: Normalize Lead Processing
INSERT INTO events (type, message, timestamp) VALUES ('info', 'Normalization process started', NOW());
DROP TABLE IF EXISTS normalized_leads;
CREATE TABLE normalized_leads (
    id SERIAL PRIMARY KEY,
    original_lead_id TEXT,
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
    wholesale_value TEXT,
    assessed_total TEXT,
    mls_curr_status TEXT,
    mls_curr_days_on_market TEXT
);
-- STEP 4: Insert normalized data
INSERT INTO normalized_leads (
    original_lead_id, contact_name, contact_email,
    property_address, property_city, property_state, property_postal_code,
    property_type, baths, beds, year_built, square_footage,
    wholesale_value, assessed_total, mls_curr_status, mls_curr_days_on_market
)
SELECT id, Contact1Name, Contact1Email_1, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
FROM leads
WHERE Contact1Name IS NOT NULL AND TRIM(Contact1Name) <> '' AND Contact1Email_1 IS NOT NULL AND TRIM(Contact1Email_1) <> ''
UNION ALL
SELECT id, Contact2Name, Contact2Email_1, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
FROM leads
WHERE Contact2Name IS NOT NULL AND TRIM(Contact2Name) <> '' AND Contact2Email_1 IS NOT NULL AND TRIM(Contact2Email_1) <> ''
UNION ALL
SELECT id, Contact3Name, Contact3Email_1, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
FROM leads
WHERE Contact3Name IS NOT NULL AND TRIM(Contact3Name) <> '' AND Contact3Email_1 IS NOT NULL AND TRIM(Contact3Email_1) <> ''
UNION ALL
SELECT id, MLS_Curr_ListAgentName, MLS_Curr_ListAgentEmail, PropertyAddress, PropertyCity, PropertyState, PropertyPostalCode, PropertyType, Baths, Beds, YearBuilt, SquareFootage, WholesaleValue, AssessedTotal, MLS_Curr_Status, MLS_Curr_DaysOnMarket
FROM leads
WHERE MLS_Curr_ListAgentName IS NOT NULL AND TRIM(MLS_Curr_ListAgentName) <> '' AND MLS_Curr_ListAgentEmail IS NOT NULL AND TRIM(MLS_Curr_ListAgentEmail) <> '';
-- STEP 5: Archive and cleanup
DO $$
DECLARE
  new_name TEXT := 'normalized_' || to_char(NOW(), 'YYYYMMDD_HH24MISS') || '_' || floor(random()*100000)::TEXT;
BEGIN
  EXECUTE format('ALTER TABLE normalized_leads RENAME TO %I', new_name);
END $$;
INSERT INTO events (type, message, timestamp) VALUES ('info', 'Normalization and archiving completed successfully', NOW());
TRUNCATE TABLE leads;
IS NOT NULL AND TRIM(MLS_Curr_ListAgentEmail) <> '';

-- 3. (Optional) Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_normalized_leads_email ON normalized_leads (contact_email);
CREATE INDEX IF NOT EXISTS idx_normalized_leads_property_address ON normalized_leads (property_address);
