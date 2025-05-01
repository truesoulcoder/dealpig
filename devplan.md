# DealPig Development Plan

**Last Updated:** May 1, 2025

This document outlines the current development status of the DealPig application based on the features described in the README.

## Overall Status

The core structure of the application using Next.js, Supabase, and HeroUI is established. Authentication and basic user management are functional. Lead import and initial management are partially implemented. Campaign and sender management have been started. Email automation foundations exist, but advanced features like drip campaigns and detailed tracking need work. Document generation is largely pending.

## Completed Features

*   **Authentication:**
    *   User Registration (`/register`)
    *   User Login (`/login`)
    *   Password Reset (`/forgot-password`, `/reset-password`)
    *   Auth Callback Handling (`/callback`)
    *   Basic Middleware for route protection
    *   Google OAuth Login (Server-side redirect fixed for PKCE)
*   **Basic UI Structure:**
    *   Next.js App Router setup
    *   Tailwind CSS integration
    *   HeroUI component library integration
    *   Basic Layout (`app/layout.tsx`, `app/(app)/layout.tsx`)
    *   Sidebar Navigation (`components/sidebar`)
    *   Navbar (`components/navbar`)

## In Progress Features

*   **Lead Management:**
    *   CSV Upload (`components/leads/UploadLeadsForm.tsx`, `/api/leads`) - **Functional**
    *   CSV Header Mapping/Configuration (`components/leads/ConfigureSourceModal.tsx`, `/api/leads/headers`) - **Functional**
    *   Lead Processing (Initial ingestion from configured CSV) (`/api/leads/process`) - **Functional**
    *   Displaying Lead List (`app/(app)/leads/page.tsx`, `components/leads/index.tsx`, `/api/leads/list`) - **Functional (UI errors fixed)**
    *   *Needs Work:* Detailed lead view, status updates, lead assignment, advanced filtering/searching.
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
    *   Detailed Lead View Page/Modal
    *   Manual Lead Editing/Updating Status
    *   Lead Assignment to Team Members
    *   Advanced Filtering and Searching
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