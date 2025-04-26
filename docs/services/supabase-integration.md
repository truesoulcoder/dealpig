# Supabase Integration

This document details how DealPig integrates with Supabase for database, authentication, and storage needs.

## Overview

DealPig uses Supabase as its primary backend service for:
- Database (PostgreSQL)
- Authentication and user management
- File storage
- Realtime subscriptions

## Setup Requirements

1. **Supabase Project**:
   - Create a project at [Supabase Dashboard](https://app.supabase.io/)
   - Note your project URL and API keys
   - Configure authentication providers

2. **Required API Keys**:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public API key for client-side operations
   - `SUPABASE_SERVICE_ROLE_KEY`: Private API key for admin operations (keep secure)

## Database Schema

DealPig's database is structured into the following key tables:

1. **leads**: Stores lead information and status
   - Primary key: `id` (UUID)
   - Key fields: `email`, `first_name`, `last_name`, `status`, etc.

2. **campaigns**: Stores marketing campaign details
   - Primary key: `id` (UUID)
   - Key fields: `name`, `description`, `status`, `stats` (JSONB)

3. **emails**: Stores email communication history
   - Primary key: `id` (UUID) 
   - Key fields: `subject`, `body`, `sender_id`, `lead_id`, `status`, `tracking_id`

4. **senders**: Stores email sender accounts
   - Primary key: `id` (UUID)
   - Key fields: `name`, `email`, `access_token`, `refresh_token`, `token_expires_at`

5. **profiles**: Stores user profile information
   - Primary key: `id` (UUID, maps to auth.users)
   - Key fields: `full_name`, `email`, `role`

6. **health_checks**: Stores system health check data
   - Primary key: `id` (UUID)
   - Key fields: `service_name`, `status`, `latency`, `last_checked`

## Row-Level Security (RLS)

DealPig implements row-level security policies:

| Table | Policy | Description |
|-------|--------|-------------|
| leads | `leads_select_policy` | Users can only view leads they have access to |
| campaigns | `campaigns_users_policy` | Users can only access their own campaigns |
| emails | `emails_user_policy` | Users can only access emails related to their leads |

## Initialization

The database schema is initialized through:
- `/supabase/setup-complete-schema.sql`: Full schema creation
- `/supabase/health-checks.sql`: Health monitoring tables
- Migration functions in `/lib/migrations/` for incremental updates

## Authentication Flow

DealPig uses Supabase Auth for user management:

1. **Registration**:
   - User submits email/password via registration form
   - Supabase creates user account
   - System creates a corresponding profile record

2. **Login**:
   - User submits credentials
   - Supabase validates and returns session
   - Session token stored in cookie for subsequent requests

3. **Session Management**:
   - Session validated on each authenticated request
   - Middleware checks for valid session and redirects if needed
   - RBAC implemented via user roles stored in profiles table

## Storage Implementation

File storage is handled through Supabase Storage:

- `lead-imports`: Bucket for CSV imports of leads
- `templates`: Bucket for document templates
- `generated-documents`: Bucket for generated PDFs and documents

The `useStorage` wrapper in `utils/supabase/safeStorage.ts` provides a safe interface for storage operations.

## Error Handling

Database operations handle these common error scenarios:

| Error | Handling Strategy |
|-------|------------------|
| Connection failure | Retry with exponential backoff |
| Query error | Log detailed error, return appropriate error code |
| Auth error | Prompt user to re-authenticate |
| Constraint violation | Provide clear validation message to user |

## Security Considerations

1. Service role key is only used server-side
2. Client only uses anon key with RLS policies
3. Sensitive data is encrypted before storage
4. Health monitoring tracks database performance

## Troubleshooting

Common issues and solutions:

- **RLS blocking access**: Check user roles and policies
- **Slow queries**: Review indexes, optimize queries
- **Auth issues**: Verify credentials and token expiration
- **Storage access denied**: Check bucket policies and permissions