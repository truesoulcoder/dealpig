-- Simplified normalization: select directly from staging 'leads' table
DROP TABLE IF EXISTS normalized_leads;

-- Create normalized_leads from staged leads
CREATE TABLE normalized_leads AS
SELECT
  id AS original_lead_id,
  owner_name AS contact_name,
  owner_email AS contact_email,
  property_address,
  property_city,
  property_state,
  property_zip AS property_postal_code,
  property_type,
  baths::TEXT AS baths,
  beds,
  year_built,
  square_footage,
  wholesale_value,
  assessed_total,
  mls_status AS mls_curr_status,
  days_on_market AS mls_curr_days_on_market
FROM leads;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_normalized_leads_email ON normalized_leads(contact_email);
CREATE INDEX IF NOT EXISTS idx_normalized_leads_property_address ON normalized_leads(property_address);