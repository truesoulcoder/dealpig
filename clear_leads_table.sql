-- Simple SQL script to clear all data from the leads table
-- Run this in the Supabase dashboard SQL editor

-- Delete all rows from the leads table
DELETE FROM leads;

-- Verify the deletion
SELECT COUNT(*) FROM leads;
