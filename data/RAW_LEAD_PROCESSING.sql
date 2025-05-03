-- RAW_LEAD_PROCESSING.sql
-- STEP 2: Raw Lead Processing
INSERT INTO events (type, message, timestamp) VALUES ('info', 'Raw lead processing started', NOW());
TRUNCATE TABLE leads;
-- Import CSV into leads (1:1 mapping with headers)
-- Example (PostgreSQL):
-- \copy leads FROM '/path/to/lead-imports/filename_uniquehash.csv' WITH (FORMAT csv, HEADER true)
INSERT INTO events (type, message, timestamp) VALUES ('info', 'Raw lead processing completed successfully', NOW());
