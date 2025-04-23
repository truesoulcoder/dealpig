# Development Plan

## Core Features to Implement

1. **Generate a Document (LOI)**
   - Generate a Letter of Intent (LOI) document with the provided data.
   - Attach the company logo to the document.

2. **Send an Email with the Generated Document**
   - Use OAuth tokens and Google API to send the email with the LOI attached.

3. **Ingest Leads from a CSV File**
   - Parse the CSV file and insert the data into the Supabase database.

4. **Save Authorization Tokens**
   - Save OAuth tokens for email accounts to a secure location (e.g., Supabase or local JSON files).

5. **Display Leads and Email Status**
   - Show a table of leads and their email statuses (e.g., sent, opened, bounced).

6. **Document Preview and Rich Text Editor**
   - Add a feature to preview the generated document (LOI) before sending.
   - Include a rich text editor to allow on-the-fly editing of templates.

---

## Development Steps

### Step 1: Review and Organize Salvaged Code
- **Files to Review:**
  - `generateLoi.ts` (Document generation logic)
  - `sendEmails.ts` (Email sending logic)
  - `ingestLeads.ts` (CSV ingestion logic)
  - `generateTokens.ts` (OAuth token generation)
  - `tokenLoader.ts` (Token management)
  - `emailTemplates.ts` (Email content templates)
- **Action:** Extract reusable functions and ensure they are modular and compatible with the new template.

---

### Step 2: Backend API Endpoints
We will create API endpoints in the `pages/api/` folder to handle server-side actions:
1. **`/api/generate-loi`**  
   - Input: Lead data (from the database or form).
   - Output: Generate and return the LOI document path.

2. **`/api/send-email`**  
   - Input: Email address, subject, body, and attachment path.
   - Output: Send the email and return the status.

3. **`/api/ingest-leads`**  
   - Input: CSV file (uploaded via the UI).
   - Output: Parse and insert leads into the database.

4. **`/api/save-tokens`**  
   - Input: OAuth tokens and email account details.
   - Output: Save tokens securely.

5. **`/api/preview-document`**
   - Input: Template and lead data.
   - Output: Render a preview of the document (LOI).

---

### Step 3: Frontend UI Components
We will create a single-page dashboard with the following sections:
1. **Generate Document (LOI)**  
   - A form to input lead details and generate the LOI.

2. **Send Email**  
   - A form to input recipient email and send the LOI.

3. **Ingest Leads**  
   - A file upload input to ingest leads from a CSV file.

4. **Save Tokens**  
   - A form to save OAuth tokens for email accounts.

5. **Leads Table**  
   - Display leads and their email statuses in a table.

6. **Document Preview and Editor**
   - A section to preview the generated document (LOI).
   - A rich text editor to allow on-the-fly editing of templates.

---

### Step 4: Database Integration
- **Supabase Setup:**
  - Use the provided database models (`Lead`, `Contact`, `Sender`, etc.) to create tables in Supabase.
  - Ensure the API endpoints interact with Supabase for data storage and retrieval.

---

### Step 5: Testing
- **Unit Testing:** Test individual functions (e.g., document generation, email sending).
- **Integration Testing:** Test API endpoints and their interaction with the database.
- **UI Testing:** Ensure the frontend components work as expected.

---

### Step 6: Deployment
- **Vercel Deployment:**
  - Ensure the app builds and runs without errors.
  - Push the project to a GitHub repository and deploy it to Vercel.

---

## Deliverables
1. A single-page web application with the following sections:
   - Generate Document
   - Send Email
   - Ingest Leads
   - Save Tokens
   - Leads Table
   - Document Preview and Editor

2. Fully functional API endpoints for backend actions.

3. Supabase database integration for storing leads, tokens, and email statuses.

4. A production-ready app deployed on Vercel.

---

## Timeline
- **Day 1:** Review salvaged code, set up API endpoints, and integrate Supabase.
- **Day 2:** Build the frontend UI components and connect them to the API.
- **Day 3:** Test the application (unit, integration, and UI testing).
- **Day 4:** Finalize and deploy to Vercel.