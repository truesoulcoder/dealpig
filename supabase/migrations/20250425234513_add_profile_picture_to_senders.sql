-- Add profile picture and verified email columns to the senders table
ALTER TABLE senders ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE senders ADD COLUMN IF NOT EXISTS verified_email TEXT;
ALTER TABLE senders ADD COLUMN IF NOT EXISTS oauth_token TEXT;