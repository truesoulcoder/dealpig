# DealPig Developer Guide

This comprehensive guide provides technical information for developers working on or extending the DealPig application.

## Architecture Overview

DealPig is built using a modern serverless architecture with the following key components:

1. **Next.js Application**: Server components and API routes
2. **Supabase Database**: PostgreSQL database with real-time capabilities
3. **Gmail API Integration**: For email sending and tracking
4. **Document Generation System**: For creating LOIs and other documents

### Application Structure

```
dealpig/
├── actions/              # Server actions for data mutations
├── app/                  # Next.js app router components
│   ├── (app)/            # Main application routes
│   ├── (auth)/           # Authentication routes
│   ├── api/              # API routes
│   └── providers/        # Context providers
├── components/           # React components
├── lib/                  # Core libraries and utilities
├── server/               # Server-side code and tRPC routers
└── supabase/             # Database schema and migrations
```

## Core Technologies

### Frontend

- **React 18+**: For building interactive user interfaces
- **Next.js 14+**: React framework with server components
- **TailwindCSS**: Utility-first CSS framework
- **HeroUI**: Component library for modern interfaces
- **TanStack/react-query**: Data fetching and state management
- **tRPC**: Type-safe API layer
- **Chart.js**: Data visualization

### Backend

- **Next.js API Routes**: RESTful API endpoints
- **Server Actions**: Form handling with progressive enhancement
- **tRPC**: End-to-end typesafe API layer
- **Edge Functions**: Performance-critical operations
- **Supabase**: PostgreSQL database with real-time capabilities
- **Gmail API**: Email sending and monitoring

## Core Subsystems

### Authentication System

The authentication system uses Supabase Auth and custom OAuth flows:

1. **User Authentication**: Handled through Supabase Auth
2. **Gmail OAuth**: Custom implementation for email sending
3. **Role-Based Access Control**: Via the `roles` field in `profiles` table
4. **Token Management**: Automatic refreshing of OAuth tokens

Key files:
- `actions/auth.action.ts`: Core authentication functions
- `app/api/auth/*`: Authentication API endpoints
- `lib/oauthCredentials.ts`: OAuth token management

### Lead Management System

The lead management system handles property and contact data:

1. **Lead Database**: Structured in the `leads` table
2. **Contact Management**: One-to-many relationship with `contacts`
3. **Lead Status Tracking**: Lifecycle management with status history
4. **Lead Import/Export**: CSV processing and validation

Key files:
- `actions/ingestLeads.action.ts`: Lead import logic
- `app/(app)/leads/*`: Lead management UI
- `lib/leadAssignmentService.ts`: Lead distribution logic

### Campaign Management System

The campaign system handles bulk email communication:

1. **Campaign Creation**: Define audience and message
2. **Sender Rotation**: Distribute emails across multiple senders
3. **Scheduling**: Timing distribution for optimal delivery
4. **Analytics**: Track campaign performance metrics

Key files:
- `actions/campaign.action.ts`: Campaign operations
- `app/(app)/campaigns/*`: Campaign UI
- `lib/campaignScheduler.ts`: Email scheduling logic

### Email Delivery System

The email system handles reliable email delivery:

1. **Gmail API Integration**: Send emails via authenticated users
2. **Tracking**: Open and click tracking with unique identifiers
3. **Bounce Management**: Track and handle bounced emails
4. **Rate Limiting**: Respect Gmail API quotas and sending limits

Key files:
- `actions/sendEmail.action.ts`: Email sending logic
- `app/api/tracking/*`: Tracking endpoints
- `lib/emailTrackingService.ts`: Email tracking implementation

### Document Generation

The document system creates professional documents from templates:

1. **Template Management**: DOCX and HTML templates with variables
2. **Document Generation**: Fill templates with lead/deal data
3. **PDF Conversion**: Convert DOCX to PDF for delivery
4. **Merge Fields**: Support for conditional content and dynamic fields

Key files:
- `actions/generateLoi.action.ts`: LOI generation logic
- `app/(app)/leads/bulk-loi`: LOI generation UI
- `lib/docxUtils.ts`: Document manipulation utilities

## State Management

DealPig uses a combination of state management approaches:

1. **React Server Components**: For initial data loading
2. **TanStack Query**: For client-side data fetching and mutations
3. **React Context**: For global UI state (notifications, modals)
4. **Local Component State**: For component-specific state

Key points:
- Server data is fetched via Server Components or tRPC
- Client-side mutations use Server Actions or tRPC mutations
- Global UI state lives in context providers

## API Integration

### Gmail API

Gmail API integration enables sending emails from user accounts:

1. **Authentication**: OAuth 2.0 flow with refresh tokens
2. **Email Sending**: Using Gmail's send API
3. **Monitoring**: Tracking message status and replies
4. **Token Management**: Automatic token refresh before expiration

Setup requirements:
- Google Cloud project with Gmail API enabled
- OAuth consent screen configuration
- Authorized redirect URIs configured

### Supabase Integration

Supabase provides database, authentication, and storage:

1. **Database**: PostgreSQL with Row Level Security
2. **Authentication**: User management and session handling
3. **Storage**: Document and image storage
4. **Real-time**: Subscriptions for live updates

Security considerations:
- Row Level Security policies control data access
- Service role key used only in secure server contexts
- Public anon key has limited permissions

## Testing Strategy

DealPig uses a comprehensive testing approach:

1. **Unit Tests**: For isolated function testing
2. **Component Tests**: For UI component verification
3. **Integration Tests**: For feature workflows
4. **E2E Tests**: For critical user journeys

Test files are located in the `__tests__` directory, organized by component or feature.

Key testing tools:
- Jest for unit and integration tests
- React Testing Library for component tests
- Cypress for E2E tests

## Build and Deployment

DealPig is configured for deployment on Vercel:

1. **Environment Variables**: Configure in Vercel project settings
2. **Database**: Connect to production Supabase instance
3. **OAuth**: Update redirect URIs for production domain
4. **Cron Jobs**: Set up webhook-triggered or Vercel cron jobs

Production considerations:
- Staging environment recommended for pre-production testing
- Database migrations must be applied before deployment
- OAuth consent verification required for production use

## Performance Optimization

Key performance optimizations include:

1. **Server Components**: Reduce client-side JavaScript
2. **Edge Functions**: Reduce latency for critical operations
3. **Component Chunking**: Optimize code splitting
4. **Image Optimization**: Next.js image optimization
5. **Caching**: React Query and Supabase caching strategies

## Security Best Practices

Security measures implemented in DealPig:

1. **Authentication**: Secure authentication flows
2. **Authorization**: Row-level security and RBAC
3. **CSRF Protection**: Tokens for form submissions
4. **Encryption**: Sensitive data encrypted at rest
5. **Input Validation**: Server-side validation of all inputs
6. **Rate Limiting**: Protection against abuse
7. **Secure Headers**: Set via middleware or Vercel config

## Error Handling

Error handling strategy:

1. **Client-Side**: React Error Boundaries
2. **Server-Side**: Structured error responses
3. **Logging**: Structured logs with appropriate levels
4. **Recovery**: Graceful degradation where possible
5. **User Feedback**: Clear error messages to users

## Monitoring and Observability

Production monitoring capabilities:

1. **Health Checks**: `/api/health` endpoint for system status
2. **Logging**: Structured logging throughout the application
3. **Performance Monitoring**: Vercel Analytics integration
4. **Error Tracking**: Client and server-side error capture
5. **Usage Analytics**: Optional integration with analytics providers

## Extending DealPig

### Adding New Features

To add new features to DealPig:

1. **Component Creation**: Add React components in `components/`
2. **Server Logic**: Add server actions in `actions/` directory
3. **API Routes**: Add API routes in `app/api/` as needed
4. **Database Changes**: Update schema in `supabase/` directory

### Custom Integration

DealPig can be extended with additional integrations:

1. **Email Providers**: Beyond Gmail API
2. **CRM Integration**: Connect to external CRM systems
3. **Property Data**: Connect to property data APIs
4. **Payment Processing**: Add payment functionality

## Troubleshooting Development Issues

### Common Issues and Solutions

1. **Database Connection Issues**
   - Check Supabase credentials in `.env.local`
   - Verify network connectivity
   - Check Supabase service status

2. **Gmail API Authentication Problems**
   - Verify OAuth configuration in Google Cloud Console
   - Check redirect URI exact match
   - Inspect network requests during authentication flow

3. **API Errors**
   - Check developer console for details
   - Verify CORS configuration if applicable
   - Check required environment variables

4. **Build Failures**
   - Check for TypeScript errors
   - Verify dependency compatibility
   - Check for missing environment variables

## Configuration Reference

### Environment Variables

Full list of supported environment variables:

```
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
NEXT_PUBLIC_APP_URL=
CSRF_SECRET=
ENCRYPTION_KEY=

# Optional
NEXT_PUBLIC_APP_NAME=DealPig
EMAIL_FROM=
EMAIL_REPLY_TO=
ENABLE_MONITORING=
ALERT_EMAIL=
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### Feature Flags

DealPig supports feature flags through environment variables:

```
FEATURE_REALTIME_UPDATES=true
FEATURE_ADVANCED_ANALYTICS=true
FEATURE_DOCUMENT_AI=false
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Gmail API Documentation](https://developers.google.com/gmail/api/guides)
- [tRPC Documentation](https://trpc.io/docs)