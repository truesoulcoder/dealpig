PLEASE CAREFULLY REVIEW OUR LEAD INGESTION PROCESS STEPS AND WRITE YOUR CODE ACCORDINGLY.

OUR 5 STEP PROCESS WRITTEN VERBOSELY:

STEP 1:  UPLOAD IS INITIATED BY THE USER ON THE LEADS PAGE USING THE 'LeadUploader.tsx' COMPONENT MODULE TO UPLOAD A CSV FILE LESS THAN 50MB IN SIZE TO OUR STORAGE BUCKET NAMED 'lead-imports' NAMED WITH A NAMING CONVENTION OF 'filename_uniquehash.csv' A PROGRESS METER BEGINS SO THE USER KNOWS THE UPLOADING HAS BEGUN.  ONCE THE FILE IS RECEIVED IN THE BUCKET, THE 'lead_source' METADATA IS RECORDED TO FILL ALL DATA POINTS IN THE TABLE FOR THAT FILE UPLOAD.  DUPLICATION PREVENTION WILL TAKE PLACE BEFORE THE UNIQUE HASH IS APPENDED TO COMPARE FILENAMES TO EXISTING UPLOADS FILENAMES, IN ORDER TO PREVENT DUPLICATING OF FILES.  ONCE THE VALUES ARE FILLED OUT IN THE 'lead_sources'THE'LeadUploader.tsx' SCRIPT EMITS A SUCCESS MESSAGE TO LOG AND SOMETHING ELSE TRIGGERS STEP 2.

//  STEP 2 INGESTS LEADS FROM THE FILE TO THE RAW TABLE NAMED 
// 'leads'JUST FINE. WE NEED TO FIGURE OUT THE REST

STEP 2:  WHEN THE CSV FILE FINISHES UPLOADING INTO OUR STORAGE BUCKET NAMED 'lead-imports' THE RAW LEAD PROCESSING SCRIPT IS TRIGGERED BY 'LeadUploader.tsx' (how?  that's your job, idk how) THIS SCRIPT TRANSFERS THE DATA VALUES FROM EVERY ROW OF THE RAW CSV FILE AND THE VALUES ARE PLACED INTO THE 'leads' TABLE UNDER THE PREFORMATTED COLUMN HEADERS THAT MATCH OUR MAPPING.  THE RAW CSV FILE HEADERS AND THE 'leads' TABLE HEADERS ARE PREFORMATTED FOR THIS STEP OF THE PROCESS TO BE MAPPED 1 TO 1 RELATIONALLY. WHEN EVERY ROW FROM THE RAW CSV IS PROCESSED INTO THE 'leads' TABLE BY THE RAW LEAD PROCESSING SCRIPT, THE SCRIPT WRITES A MESSAGE TO THE LOG THAT THE RAW LEAD PROCESSING WAS A SUCCESS. THE RAW LEAD PROCESSING IS NOW FINISHED AND THIS TRIGGERS STEP 3.

// STEP 3 DOESNT HAPPEN AND WE NEED TO FIND OUT WHY
// MAYBE THE CODE ISNT TRIGGERED AUTOMATICALLY?  IDK.

STEP 3: THE NORMALIZE LEAD PROCESSING SCRIPT GETS TRIGGERED WHEN STEP 2 FINISHES (SOMEHOW IDK). THIS SCRIPT CREATES A NEW TABLE DYNAMICALLY NAMED 'normalized_leads' AND WRITES COLUMN HEADERS FOR THIS TABLE ACCORDING TO THE MAPPING WE CREATED TO GUARANTEE DATA INTEGRITY. THE VALUES ARE TRANSFERED FROM UNDER THE TARGET COLUMN HEADERS OF THE RAW LEADS TABLE NAMED 'leads' TO THE DESTINATION TABLE NAMED 'normalized_leads' AND THESE VALUES ARE PLACED UNDER THE CORRECT COLUMN HEADERS WE MAPPED OUT FOR THE 'normalized_leads' TABLE.  THE SCRIPT NORMALIZES THE DATA VALUES IN THIS WAY FOR EACH ROW OF THE RAW 'leads' TABLE AND THE VALUES ARE PLACED INTO THE 'normalized_leads' TABLE USING OUR MAPPING. THIS SEQUENCE WILL ITERATE UNTIL ALL THE VALUES UNDER THE MAPPED COLUMN HEADINGS IN THE 'leads' TABLE GET TRANSFERED AND NORMALIZED TO THE ROWS UNDER THE MAPPED COLUMN HEADINGS IN THE 'normalized_leads' TABLE. THE NORMALIZED LEADS SCRIPT ENDS AND THIS TRIGGERS STEP 4.

STEP 4: THE 'normalized_leads' TABLE RENAMES ITSELF USING A "normalized_filename_uniquehash" NAMING CONVENTION AND THE NORMALIZATION PROCESS IS NOW COMPLETE. THE SCRIPT WRITES A MESSAGE TO THE LOG A THAT THE NORMALIZATION PROCESS WAS A SUCCESS OR FAILURE. THIS REFLECTS IN THE PROGRESS METER FOR THE USER OF THE LEADS PAGE AND ITS UI COMPONENTS, SIGNALLING COMPLETION AND TRIGGERING STEP 5.

STEP 5:  THE 'leads' TABLE TRUNCATES, RETAINING THE PREFORMATTED HEADERS ONLY AND IS NOW READY TO PROCESS ANOTHER RAW CSV FILE WHEN IT GETS UPLOADED. THE RAW LEAD PROCESSING IS COMPLETE.  THE LEAD INGESTION PROCESS IS NOW COMPLETE AS IT SENDS A SUCCESS MESSAGE TO THE LOG AND PERFORMS API POLLING TO REFRESH THE FRONT END UI COMPONENTS THAT GIVE CONFIRMATION TO THE USER OF THE TASK COMPLETEING SUCCESSFULLY.


DO YOU UNDERSTAND THIS PROCESS?


# Automated Lead Ingestion Pipeline

This document describes the complete, streamlined, and fully automated ingestion pipeline for leads, including triggers, normalization, and archiving.

---

## 1. CSV Upload & Ingestion
- User uploads a CSV file via the UI or API.
- Backend parses the CSV, using headers for column mapping.
- Data rows are inserted into the `leads` table.

---

## 2. Database Trigger: Normalize on Insert
- A database trigger (`trigger_normalize_on_leads_insert`) is set up on the `leads` table.
- After every insert (batch upload), this trigger fires and calls the normalization function (`normalize_staged_leads` or equivalent).
- This ensures normalization starts automatically after every batch insert—no manual or backend call required.

### Trigger SQL Example
```sql
CREATE OR REPLACE FUNCTION fn_trigger_normalize_leads()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM normalize_staged_leads();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_normalize_on_leads_insert
AFTER INSERT ON leads
FOR EACH STATEMENT
EXECUTE FUNCTION fn_trigger_normalize_leads();
```

---

## 3. Normalization Logic
- The normalization function (see `data/SQL_NORMALIZE_LEADS_TEMPLATE.sql`) drops and recreates the `normalized_leads` table.
- Inserts normalized data using the mapping and WHERE logic (only rows with both name and email).
- The function can be called by the trigger or by backend logic, depending on your preference for table naming.

---

## 4. Archiving & Truncation
- After normalization, backend logic (or an additional trigger, if desired) renames `normalized_leads` to `normalized_{filename}_{hash}` and truncates the `leads` table.
- This preserves the normalized results for each batch and resets the system for the next upload.

---

## 5. Documentation & Templates
- `PROCESS_AUTOMATED_LEAD_INGESTION.md` and `README_AUTOMATED_INGESTION.txt` explain the workflow, mapping, and maintenance.
- All SQL and trigger code is in `/data` for review and deployment.

---

## How It All Connects
- **Upload → Insert → Trigger fires → Normalize → Archive → Truncate → Ready for next batch**
- No manual steps required. All mapping, WHERE logic, and table management are explicit and robust.

---

## File References
- **API Handler:** `app/api/leads/upload/route.ts`
- **Normalization SQL Template:** `data/SQL_NORMALIZE_LEADS_TEMPLATE.sql`
- **Triggers:** `data/TRIGGERS_AUTOMATED_INGESTION.sql`
- **Process Docs:** `data/PROCESS_AUTOMATED_LEAD_INGESTION.md`, `README_AUTOMATED_INGESTION.txt`

---

**This is now a fully automated, trigger-driven, and robust ingestion pipeline.**
If you want the archiving/truncation step to also be handled by a trigger (instead of backend logic), that can be added as well.
