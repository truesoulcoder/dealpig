-- Migration: Change numeric columns to text in normalized_leads
-- This migration is safe and idempotent

ALTER TABLE public.normalized_leads
  ALTER COLUMN wholesale_value TYPE TEXT USING wholesale_value::TEXT,
  ALTER COLUMN assessed_total TYPE TEXT USING assessed_total::TEXT;

-- (Optional) If you want to preserve existing triggers and indexes, nothing else to do.
-- If you want to add additional columns or adjust other types, add here.

-- You can run this with:
-- supabase db execute --file supabase/migrate_normalized_leads_to_text.sql
