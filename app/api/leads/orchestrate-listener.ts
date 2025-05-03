// This script would be run as a cron job or background process
// It checks for new 'raw_complete' statuses and triggers normalization automatically
import { runNormalizationProcessing } from "@/lib/leadOrchestrator";
import { db } from "@/lib/database";

export async function checkAndNormalize() {
  const jobs = await db.query("SELECT * FROM processing_status WHERE status = 'raw_complete' AND normalized_at IS NULL");
  for (const job of jobs.rows) {
    await runNormalizationProcessing(job.file);
    await db.query("UPDATE processing_status SET status = 'normalized', normalized_at = NOW() WHERE id = $1", [job.id]);
  }
}
