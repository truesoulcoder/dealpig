-- Table to track processing status of each uploaded file
CREATE TABLE IF NOT EXISTS processing_status (
  id SERIAL PRIMARY KEY,
  file TEXT NOT NULL,
  status TEXT NOT NULL,
  completed_at TIMESTAMP,
  normalized_at TIMESTAMP
);
