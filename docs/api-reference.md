# DealPig API Reference

This document provides a detailed reference for all API endpoints available in the DealPig application.

## Authentication

### User Authentication

#### Register New User

```
POST /api/auth/register-new
```

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully"
}
```

#### Gmail OAuth Initiation

```
GET /api/auth/gmail
```

Initiates Gmail OAuth flow for a sender account.

**Query Parameters:**
- `email`: Email address to authorize
- `name`: Sender's name
- `title`: Job title (optional)
- `dailyQuota`: Daily email quota (optional, defaults to 100)

**Response:**
- Redirects to Google OAuth consent screen

#### Gmail OAuth Callback

```
GET /api/auth/gmail/callback
```

Handles OAuth callback from Google.

**Query Parameters:**
- `code`: Authorization code from Google
- `state`: Encoded state with sender ID

**Response:**
- Redirects to `/accounts` with success or error message

#### Gmail Token Refresh

```
GET /api/auth/gmail/refresh
```

Refreshes Gmail OAuth tokens for a sender.

**Query Parameters:**
- `sender_id`: ID of the sender account

**Response:**
- Redirects to Google OAuth consent screen

## Lead Management

### Lead Operations

#### Get All Leads

```
GET /api/leads
```

Retrieve all leads with optional filtering.

**Query Parameters:**
- `status`: Filter by lead status
- `page`: Page number for pagination
- `limit`: Number of leads per page
- `sortBy`: Field to sort by
- `order`: Sort order (asc/desc)

**Response:**
```json
{
  "leads": [
    {
      "id": "uuid",
      "property_address": "123 Main St",
      "property_city": "Anytown",
      "property_state": "CA",
      "property_zip": "90210",
      "wholesale_value": 150000,
      "market_value": 200000,
      "status": "new",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

#### Create Lead

```
POST /api/leads
```

Create a new lead.

**Request Body:**
```json
{
  "property_address": "123 Main St",
  "property_city": "Anytown",
  "property_state": "CA",
  "property_zip": "90210",
  "wholesale_value": 150000,
  "market_value": 200000,
  "contacts": [
    {
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "555-123-4567",
      "is_primary": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "leadId": "uuid",
  "message": "Lead created successfully"
}
```

#### Update Lead Status

```
POST /api/leads/update-status
```

Update lead status.

**Request Body:**
```json
{
  "leadId": "uuid",
  "status": "contacted",
  "notes": "Left voicemail"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead status updated successfully"
}
```

#### Import Leads

```
POST /api/leads/import
```

Import multiple leads from CSV file.

**Request Body:**
Multipart form data with `file` field containing CSV file.

**Response:**
```json
{
  "success": true,
  "imported": 10,
  "errors": 0,
  "message": "10 leads imported successfully"
}
```

## Campaign Management

### Campaign Operations

#### List All Campaigns

```
GET /api/campaigns
```

Retrieve all campaigns.

**Query Parameters:**
- `status`: Filter by campaign status
- `page`: Page number for pagination
- `limit`: Number of campaigns per page

**Response:**
```json
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Spring 2025 Outreach",
      "description": "Outreach to high-value leads",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z",
      "leads_count": 50
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

#### Get Campaign Details

```
GET /api/campaigns/{id}
```

Get details for a specific campaign.

**Path Parameters:**
- `id`: Campaign UUID

**Response:**
```json
{
  "id": "uuid",
  "name": "Spring 2025 Outreach",
  "description": "Outreach to high-value leads",
  "status": "active",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z",
  "stats": {
    "total_leads": 50,
    "emails_sent": 45,
    "opened": 30,
    "clicked": 15,
    "replied": 5,
    "bounced": 2
  }
}
```

#### Update Campaign Status

```
POST /api/campaigns/{id}/status
```

Update campaign status.

**Path Parameters:**
- `id`: Campaign UUID

**Request Body:**
```json
{
  "status": "paused",
  "reason": "Temporarily paused for strategy adjustment"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Campaign status updated successfully"
}
```

#### Assign Leads to Campaign

```
POST /api/campaigns/assign
```

Assign leads to a campaign.

**Request Body:**
```json
{
  "campaignId": "uuid",
  "leadIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "assignedCount": 3,
  "message": "3 leads assigned to campaign"
}
```

#### Send Test Email

```
POST /api/campaigns/{id}/test-email
```

Send test email for a campaign.

**Path Parameters:**
- `id`: Campaign UUID

**Request Body:**
```json
{
  "recipientEmail": "test@example.com",
  "senderId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully"
}
```

#### Campaign Senders

```
GET /api/campaigns/{id}/senders
```

Get all senders assigned to a campaign.

**Path Parameters:**
- `id`: Campaign UUID

**Response:**
```json
{
  "senders": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "title": "Acquisition Specialist",
      "daily_quota": 100,
      "emails_sent": 45
    }
  ]
}
```

#### Verify Sender for Campaign

```
POST /api/campaigns/{id}/senders/{senderId}/verify
```

Verify sender's email authentication for a campaign.

**Path Parameters:**
- `id`: Campaign UUID
- `senderId`: Sender UUID

**Response:**
```json
{
  "success": true,
  "message": "Sender verification successful",
  "deliverabilityScore": 95
}
```

## Email Tracking

### Tracking Operations

#### Email Pixel Tracking

```
GET /api/tracking/pixel
```

Track email opens via tracking pixel.

**Query Parameters:**
- `id`: Tracking ID

**Response:**
1x1 transparent GIF image

#### Click Tracking

```
GET /api/tracking
```

Track email link clicks.

**Query Parameters:**
- `id`: Tracking ID
- `url`: Original URL to redirect to

**Response:**
Redirects to the original URL

#### Monitor Email Replies

```
POST /api/tracking/monitor
```

Manually trigger monitoring for email replies.

**Request Body:**
```json
{
  "emailIds": ["uuid1", "uuid2"]
}
```

**Response:**
```json
{
  "success": true,
  "processed": 2,
  "repliesFound": 1,
  "message": "Email monitoring completed"
}
```

## Sender Management

### Sender Operations

#### Get Sender

```
GET /api/senders/{id}
```

Get sender details.

**Path Parameters:**
- `id`: Sender UUID

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "title": "Acquisition Specialist",
  "daily_quota": 100,
  "emails_sent": 45,
  "profile_picture": "https://example.com/profile.jpg",
  "created_at": "2025-01-01T00:00:00Z",
  "last_token_refresh": "2025-01-01T00:00:00Z"
}
```

#### Delete Sender

```
DELETE /api/senders/{id}
```

Delete a sender.

**Path Parameters:**
- `id`: Sender UUID

**Response:**
```json
{
  "success": true,
  "message": "Sender deleted successfully"
}
```

## System & Health

### System Operations

#### CSRF Token

```
GET /api/csrf
```

Get CSRF token for form submissions.

**Response:**
```json
{
  "csrfToken": "token-value"
}
```

#### Health Check

```
GET /api/health
```

Check system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "services": {
    "database": "operational",
    "email": "operational",
    "storage": "operational"
  },
  "version": "1.0.0"
}
```

#### Cron Jobs

```
POST /api/cron
```

Trigger background jobs.

**Query Parameters:**
- `job`: Specific job to run (optional)

**Headers:**
- `Authorization`: Bearer token with CRON_SECRET

**Response:**
```json
{
  "success": true,
  "job": "token-refresh",
  "message": "Job completed successfully"
}
```

## Webhooks

### Webhook Endpoints

#### Email Webhook

```
POST /api/webhooks/email
```

Webhook for email status updates.

**Request Body:**
Varies based on provider.

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

#### Email Bounce Webhook

```
POST /api/webhooks/email-bounce
```

Webhook for email bounce notifications.

**Request Body:**
Varies based on provider.

**Response:**
```json
{
  "success": true,
  "message": "Bounce processed"
}
```

## tRPC API

DealPig also provides a tRPC API for type-safe client-server communication.

### Base URL

```
/api/trpc
```

### Available Procedures

#### Leads

- `trpc.leads.getAll`: Get all leads
- `trpc.leads.getById`: Get lead by ID
- `trpc.leads.create`: Create new lead
- `trpc.leads.update`: Update lead
- `trpc.leads.updateStatus`: Update lead status
- `trpc.leads.delete`: Delete lead

#### Campaigns

- `trpc.campaigns.getAll`: Get all campaigns
- `trpc.campaigns.getById`: Get campaign by ID
- `trpc.campaigns.create`: Create new campaign
- `trpc.campaigns.update`: Update campaign
- `trpc.campaigns.updateStatus`: Update campaign status
- `trpc.campaigns.assignLeads`: Assign leads to campaign

#### Emails

- `trpc.emails.send`: Send single email
- `trpc.emails.sendBulk`: Send bulk emails
- `trpc.emails.getByLeadId`: Get emails for lead
- `trpc.emails.getStats`: Get email statistics

#### Documents

- `trpc.documents.generateLoi`: Generate LOI
- `trpc.documents.generateBulkLoi`: Generate multiple LOIs
- `trpc.templates.getAll`: Get all templates
- `trpc.templates.getById`: Get template by ID

### Usage Example

```typescript
// Client-side usage
import { trpc } from '@/utils/trpc';

// Query
const { data, isLoading } = trpc.leads.getAll.useQuery({
  status: 'new',
  limit: 10
});

// Mutation
const mutation = trpc.leads.updateStatus.useMutation();
mutation.mutate({
  leadId: 'uuid',
  status: 'contacted'
});
```

## Rate Limiting

All API endpoints are rate-limited to prevent abuse:

- Default limit: 100 requests per minute per IP
- Authentication endpoints: 20 requests per minute per IP
- Webhook endpoints: 200 requests per minute

## Error Responses

Standard error response format:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Detailed error message",
    "details": {}
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INVALID_REQUEST`: Invalid request parameters
- `RATE_LIMITED`: Too many requests
- `SERVER_ERROR`: Internal server error