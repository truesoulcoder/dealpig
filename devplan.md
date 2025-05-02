# DealPig Development Plan

**Last Updated:** May 1, 2025

This document outlines the current development status of the DealPig application based on the features described in the README.

## Overall Status

The core structure of the application using Next.js, Supabase, and HeroUI is established. Authentication and basic user management are functional. Lead import uses an asynchronous server-action-based approach. Campaign and sender management have been started. Email automation foundations exist. Document generation is pending.

## Completed Features

*   **Authentication:**
    *   User Registration (`/register`) - Uses `@supabase/ssr` Action Client
    *   User Login (`/login`) - Uses `@supabase/ssr` Action Client
    *   Password Reset (`/forgot-password`, `/reset-password`) - Uses `@supabase/ssr` Action Client
    *   Auth Callback Handling (`/api/auth/callback`) - Uses `@supabase/ssr` Route Handler Client
    *   Basic Middleware for route protection
    *   Google OAuth Login (Server Action using `@supabase/ssr` Action Client for PKCE) - **Verified Working**
*   **Basic UI Structure:**
    *   Next.js App Router setup
    *   Tailwind CSS integration
    *   HeroUI component library integration
    *   Basic Layout (`app/layout.tsx`, `app/(app)/layout.tsx`)
    *   Sidebar Navigation (`components/sidebar`)
    *   Navbar (`components/navbar`)
*   **Lead Management:**
    *   CSV import pipeline (`actions/leadUpload.action.ts`) – Uploads CSV to storage, records source, triggers normalization asynchronously – **Implemented**
    *   Lead normalization (`actions/leadIngestion.action.ts::normalizeLeads`) – Parses each CSV row into multiple lead records (contacts + agent) and bulk inserts into `leads` table – **Implemented**

## In Progress Features

*   **Lead Management:**
    *   **Asynchronous Import Process (Server Actions):**
        *   Frontend Uploader (`components/leads/LeadUploader.tsx`) - **Implemented**
        *   Upload Server Action (`actions/leadUpload.action.ts`) - Uploads to storage, creates `lead_sources` record (status: `UPLOADED`), triggers normalization asynchronously. **Implemented**
        *   Normalization Server Action (`actions/leadIngestion.action.ts::normalizeLeadsForSource`) - Runs asynchronously. Updates status (`PROCESSING`), downloads CSV, parses headers/rows, calculates hash, normalizes data (creates multiple leads per row), bulk inserts into `leads` table, updates status (`PROCESSED` or `ERROR`) with counts and metadata. **Implemented**
    *   Displaying Lead List (`app/(app)/leads/page.tsx`, `components/leads/index.tsx`, `components/leads/LeadsTable.tsx`, `actions/leads.action.ts::getLeads`) - **Functional**
    *   Displaying Lead Sources (Needs implementation, likely fetching from `lead_sources` table to show import status/history).
    *   *Needs Work:* Detailed lead view, manual status updates, lead assignment, advanced filtering/searching, robust error display/feedback on frontend for background processing status, potentially replacing fire-and-forget with a more robust background job queue.
    *   *Removed/Replaced:* Previous `pgloader`-based workflow, separate `ingestLeadSource` preparation step.
*   **Email Automation - Sender Management:**
    *   Adding/Listing Sender Accounts (`app/(app)/accounts/page.tsx`, `components/accounts`, `/api/senders`) - **Partially Implemented**
    *   *Needs Work:* OAuth connection flow for Gmail, validation, error handling, sender limits configuration.
*   **Campaign Management:**
    *   Basic Campaign Listing/Settings UI (`app/(app)/campaigns/page.tsx`, `components/campaigns`) - **Started**
    *   *Needs Work:* Full campaign creation flow, associating leads/templates/senders, scheduling logic, lead distribution logic (`lib/leadDistribution.ts` exists but might need integration).
*   **Email Automation - Core Sending:**
    *   Basic Email Sending Logic (`lib/gmail.ts`, `lib/emailQueue.ts`, `lib/emailDrafter.ts`) - **Foundations Exist**
    *   *Needs Work:* Integration with campaigns, drip sequence logic, robust error handling, email tracking implementation (open/click/reply via webhooks - `/api/webhooks` exists but likely needs implementation).
*   **Templates:**
    *   Basic Template Listing UI (`app/(app)/templates/page.tsx`) - **Started**
    *   *Needs Work:* Rich text editor implementation for Email Templates, variable insertion logic, saving/updating templates via API.

## Planned / Not Started Features

*   **Lead Management:**
    *   UI for displaying `lead_sources` table (Import History/Status).
    *   Detailed Lead View Page/Modal
    *   Manual Lead Editing/Updating Status
    *   Lead Assignment to Team Members
    *   Advanced Filtering and Searching
    *   Real-time feedback/polling for background import status.
    *   Consider replacing fire-and-forget async call with a proper background job queue (e.g., using Supabase Edge Functions with a queue, or external services like BullMQ/Redis).
*   **Campaign Management:**
    *   Campaign Performance Analytics (Open/Reply/Conversion Rates)
    *   A/B Testing capabilities
*   **Email Automation:**
    *   Full Drip Campaign Sequence Builder/Logic
    *   Advanced Spam Filter Avoidance Strategies (e.g., content spinning, dynamic sending patterns)
    *   Reply Handling/Inbox Monitoring
*   **Document Generation:**
    *   Document Template Editor (similar to Email Templates)
    *   Variable Substitution Logic for Documents
    *   PDF Generation from Templates
    *   E-Signature Integration (e.g., DocuSign, HelloSign API)
*   **User Interface:**
    *   Dashboard with Key Metrics/Analytics
    *   Dark/Light Mode Toggle (if not already implicitly supported by HeroUI/Tailwind)
    *   Role-Based Access Control (RBAC) implementation (defining roles, restricting access based on roles)
*   **API Documentation:**
    *   Generating detailed API documentation (e.g., using Swagger/OpenAPI).
*   **Testing:**
    *   Implementing unit, integration, and end-to-end tests.
*   **Database:**
    *   Ensure `lead_sources` table schema matches `types/supabase.ts` (including status enum, counts, timestamps, metadata JSON).
    *   Consider adding indexes to `leads` table (e.g., on `source_id`, `status`, `owner_email`).

# Development Plan

## Phase 1: Setup and Initial Data Ingestion

-   [x] Initialize Supabase project (`supabase init`)
-   [x] Link Supabase project (`supabase link --project-ref <your-project-ref>`)
-   [x] Create initial migration for `exec_sql` function (`supabase migration new add_exec_sql_function`) - `20240429_add_exec_sql_function.sql`
-   [x] Create migration for `lead_sources` table (`supabase migration new create_lead_sources_table`) - `20250502000000_create_lead_sources_table.sql`
-   [x] Create migration for `profiles` table (`supabase migration new create_profiles_table`) - `20250502000001_create_profiles_table.sql`
-   [x] Create migration for `leads` table (`supabase migration new create_leads_table`) - `20250502010000_create_leads_table.sql` (Renamed from `20250502045125`)
-   [x] Create migration to add all CSV columns to `leads` table (`supabase migration new add_all_csv_columns_to_leads`) - `20250502023012_add_all_csv_columns_to_leads.sql` (Corrected content)
-   [x] Create migration for `normalize_staged_leads` function (`supabase migration new create_normalize_staged_leads_function`) - `20250502014512_create_normalize_staged_leads_function.sql` (Corrected content)
-   [x] Create migration for `normalized_leads` table (Implicitly created by `normalize_staged_leads` function, but good to track)
-   [x] Apply migrations to remote database (`supabase db push --include-all`)
-   [x] Pull schema changes and generate initial types (`supabase db pull`)
-   [ ] Develop CSV upload action (`leadUpload.action.ts`)
    -   [ ] Parse CSV data
    -   [ ] Transform headers to snake_case
    -   [ ] Insert data into `leads` staging table
    -   [ ] Trigger `normalize_staged_leads` function
-   [ ] Create UI component for CSV upload
-   [ ] Test CSV upload and normalization process

## Phase 2: Lead Management UI

-   [ ] Display normalized leads in a table
-   [ ] Implement filtering and sorting for leads
-   [ ] Develop lead detail view
-   [ ] Add functionality to assign leads to users
-   [ ] Implement status updates for leads

## Phase 3: Communication Features

-   [ ] Integrate email sending service
-   [ ] Create action/component to send emails to leads
-   [ ] Log communication history

## Phase 4: Refinement and Deployment

-   [ ] Add comprehensive unit and integration tests
-   [ ] Implement user roles and permissions
-   [ ] Optimize database queries and functions
-   [ ] Set up production environment on Supabase
-   [ ] Deploy application



