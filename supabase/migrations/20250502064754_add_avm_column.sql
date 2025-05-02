-- Add AVM column to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS avm numeric;
