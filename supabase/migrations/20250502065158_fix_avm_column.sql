-- Ensure AVM column exists with proper type
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS avm numeric;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_avm ON leads(avm);

-- Update any existing data to ensure proper type casting
UPDATE leads
SET avm = CAST(avm::text AS numeric)
WHERE avm IS NOT NULL AND avm::text !~ '^\d+(\.\d+)?$';
