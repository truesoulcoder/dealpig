import { db } from "@/lib/database";
import { exec } from "child_process";

export async function runRawLeadProcessing(filename: string, userId: string) {
  // Log start
  await db.query("INSERT INTO events (type, message, timestamp) VALUES ('info', $1, NOW())", [`Raw lead processing started for ${filename}`]);
  // Truncate leads table
  await db.query("TRUNCATE TABLE leads");
  // Import CSV into leads
  // (Assumes server can access file path; adapt as needed for your infra)
  await db.query(`COPY leads FROM '/path/to/lead-imports/${filename}' WITH (FORMAT csv, HEADER true)`);
  // Log complete
  await db.query("INSERT INTO events (type, message, timestamp) VALUES ('info', $1, NOW())", [`Raw lead processing completed for ${filename}`]);
  // Mark processing status with user_id
  await db.query("INSERT INTO processing_status (file, status, completed_at, user_id) VALUES ($1, 'raw_complete', NOW(), $2)", [filename, userId]);
}

export async function runNormalizationProcessing(filename: string) {
  // Log start
  await db.query("INSERT INTO events (type, message, timestamp) VALUES ('info', $1, NOW())", [`Normalization started for ${filename}`]);
  // Drop and recreate normalized_leads table (all TEXT columns)
  await db.query(`DROP TABLE IF EXISTS normalized_leads`);
  await db.query(`CREATE TABLE normalized_leads (
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
  )`);
  // Insert normalized data
  await db.query(`INSERT INTO normalized_leads (...columns...) SELECT ... FROM leads WHERE ...`); // Use your normalization SQL here
  // Archive (rename) table
  await db.query(`DO $$
DECLARE
  new_name TEXT := 'normalized_' || to_char(NOW(), 'YYYYMMDD_HH24MISS') || '_' || floor(random()*100000)::TEXT;
BEGIN
  EXECUTE format('ALTER TABLE normalized_leads RENAME TO %I', new_name);
END $$;`);
  // Log complete
  await db.query("INSERT INTO events (type, message, timestamp) VALUES ('info', $1, NOW())", [`Normalization and archiving completed for ${filename}`]);
  // Cleanup
  await db.query("TRUNCATE TABLE leads");
  await db.query("UPDATE processing_status SET status = 'normalized', normalized_at = NOW() WHERE file = $1", [filename]);
}
