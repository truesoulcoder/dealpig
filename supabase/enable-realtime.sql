-- Enable realtime for the emails table in Supabase
BEGIN;
  -- Add the emails table to the realtime publication if it's not already there
  DO $$
  BEGIN
    -- First check if supabase_realtime publication exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
      -- Check if emails table is already in the publication
      IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'emails'
      ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emails;
      END IF;
    ELSE
      -- Create the publication if it doesn't exist
      CREATE PUBLICATION supabase_realtime FOR TABLE public.emails;
    END IF;
  END
  $$;
COMMIT;

-- Verify the emails table is part of the realtime publication
SELECT pubname, schemaname, tablename
FROM pg_publication_tables 
WHERE tablename = 'emails';