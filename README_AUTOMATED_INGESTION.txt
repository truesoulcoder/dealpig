AUTOMATED LEAD INGESTION SYSTEM
================================

This system automates the entire process of uploading, normalizing, and archiving leads from CSV files. The workflow is as follows:

1. User uploads a CSV file.
2. Data rows are inserted into the `leads` table using the CSV headers as column mappings.
3. The backend drops and recreates the `normalized_leads` table for each batch, matching the mapping schema.
4. Data is normalized and inserted into `normalized_leads` using robust WHERE logic (only rows with both name and email are included).
5. The `normalized_leads` table is renamed to `normalized_{filename}_{hash}` for archiving.
6. The `leads` table is truncated and ready for the next upload.

Key Files:
- API Handler: `app/api/leads/upload/route.ts`
- Normalization SQL: `data/SQL_NORMALIZE_LEADS_TEMPLATE.sql`
- Process Doc: `data/PROCESS_AUTOMATED_LEAD_INGESTION.md`

To update the mapping, edit both the SQL template and the backend handler. No manual SQL is required after setup.

This ensures a robust, repeatable, and scalable ingestion pipeline for your leads.
