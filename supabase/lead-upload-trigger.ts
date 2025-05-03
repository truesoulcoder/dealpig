// Supabase Edge Function: lead-upload-trigger
import { serve } from "std/server";

serve(async (req) => {
  const payload = await req.json();
  const { name, bucket, record } = payload;
  // Try to extract user_id from the webhook payload (adjust if needed)
  const user_id = record?.user_id || record?.owner || payload.user_id || null;
  if (bucket === "lead-imports" && name && user_id) {
    // Call orchestrator API to start full processing pipeline with user_id
    await fetch("https://dealpig.vercel.app/api/leads/orchestrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: name, userId: user_id })
    });
  }
  return new Response("ok");
});
