<p align="center">
  <img src="./public/dealpig.svg" alt="DealPig Logo" width="100%" />
Even a blind pig finds a nut from time to time?
</p>

# DealPig 
The comprehensive deal procurement platform designed exclusively for real estate investors and wholesalers. It simplifies lead management, document generation, and email communications through an intuitive web interface. DealPig features multi-sender automailer system drip marketing campaigns and spam filter avoidance. With rich text template editor, analytics and reporting, and CRM purpose built for real estate investor workflow automation; Its subversively progressive performatively seditious autonomous inbound lead handling engine fueled by open source intelligence for pragmatically skiptraced target acquisitions leveraging buyer advantaged market positioning designed so well it would make a blind pig sick of nuts in the middle of a cashew famine.

## 🌟 Features

### Lead Management
- **Lead Import & Export**: Bulk import leads from CSV files, export lead data in multiple formats
- **Lead Tracking**: Monitor status changes and history for each property with advanced timeline views
- **Contact Management**: Maintain multiple contacts for each property with relationship tracking
- **Property Details**: Track property attributes, market values, and days on market with visual data representations
- **Lead Scoring**: Automatically prioritize leads based on customizable scoring algorithms

### Communication Tools
- **Email Campaigns**: Create and schedule multi-touch email campaigns with automated follow-ups
- **Email Tracking**: Monitor opens, clicks, replies, and bounces with detailed analytics and engagement metrics
- **Bulk Email**: Send personalized emails to multiple leads simultaneously with dynamic content insertion
- **Gmail Integration**: Seamless connection with Gmail for sending emails with improved deliverability
- **SMTP Support**: Use custom SMTP servers for email delivery with detailed delivery reports
- **Email Templates**: Rich text editor with dynamic variables and conditional content blocks

### Document Generation
- **Letter of Intent (LOI)**: Generate professional LOI documents with property details and custom clauses
- **Bulk Document Generation**: Create multiple LOIs at once for selected properties with batch processing
- **Document Templates**: Create and manage reusable document templates with version control
- **PDF & DOCX Export**: Download generated documents in multiple formats with custom branding
- **E-Signature Integration**: Send documents for electronic signature with status tracking

### Dashboard & Analytics
- **Campaign Performance**: Track email campaign effectiveness with detailed metrics and conversion funnels
- **Lead Status Analytics**: Visual breakdown of lead pipeline and conversions with predictive analytics
- **Weekly Performance**: Monitor trends and activity over time with customizable date ranges
- **Sender Analytics**: Track performance metrics by team member with comparative analysis
- **ROI Calculation**: Measure campaign effectiveness with cost-per-acquisition metrics
- **Custom Reports**: Create and schedule custom reports for stakeholders

### User Management
- **Sender Profiles**: Add multiple team members as email senders with customizable signatures
- **OAuth Authentication**: Secure Gmail authorization with OAuth 2.0 and automatic token refresh
- **Daily Email Quotas**: Set sending limits for each team member with usage monitoring
- **Access Controls**: Define user roles and permissions with fine-grained access management
- **Team Collaboration**: Share leads, templates, and campaigns across team members
- **Activity Logging**: Track user activities with detailed audit logs

### Mobile-Responsive Design
- **Responsive Interface**: Optimized for desktop, tablet, and mobile devices with adaptive layouts
- **Mobile-Specific Components**: Custom UI for smaller screens with touch-optimized controls
- **Offline Capabilities**: Basic functionality available without internet connection
- **Push Notifications**: Real-time alerts for important events and lead activities

### AI-Powered Features
- **Smart Reply Suggestions**: AI-generated response templates based on lead communications
- **Lead Quality Prediction**: ML models to predict lead conversion likelihood
- **Content Optimization**: Suggestions for improving email and document effectiveness
- **Market Trend Analysis**: Automated insights from property and market data

## 🔧 Tech Stack

### Frontend
- **React 19**: UI library for building interactive user interfaces with concurrent rendering
- **Next.js 14**: React framework with App Router for server-side rendering and routing
- **TailwindCSS**: Utility-first CSS framework for responsive design with custom theme
- **HeroUI**: Component library for modern UI elements with accessibility features
- **TanStack/react-query**: State management for asynchronous data with optimistic updates
- **tRPC**: End-to-end typesafe API layer with automatic validation
- **React Hook Form**: Form handling with validation and error management
- **Chart.js**: Interactive data visualization components

### Backend
- **Next.js API Routes**: Backend API endpoints with built-in middleware support
- **Server Actions**: Form submissions and data mutations with progressive enhancement
- **tRPC**: Type-safe API layer between client and server with automatic documentation
- **Edge Functions**: Performance-critical operations running on edge network
- **Cron Jobs**: Scheduled background processes for maintenance and monitoring

### Database & Storage
- **Supabase**: PostgreSQL database with real-time capabilities and row-level security
- **Row-level Security**: Fine-grained access control policies based on user roles
- **Supabase Storage**: Document and file storage solution with access controls
- **Caching Layer**: Redis-based caching for frequently accessed data
- **Database Migrations**: Versioned schema changes with rollback capability

### Authentication & Security
- **NextAuth.js**: Authentication solution for Next.js with multiple providers
- **OAuth 2.0**: Secure authentication with Gmail API and token management
- **CSRF Protection**: Cross-Site Request Forgery prevention with token validation
- **Data Encryption**: Sensitive data encryption at rest and in transit
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Input Validation**: Server-side validation with zod schema enforcement

### Email Services
- **Gmail API**: Send emails through user Gmail accounts with high deliverability
- **Email Templates**: HTML email template system with responsive design
- **Email Tracking**: Open, click, and reply tracking with privacy controls
- **Spam Score Analysis**: Pre-flight checks for spam likelihood reduction
- **DMARC Compliance**: Tools for ensuring email authentication standards
- **Bounce Management**: Automated handling of bounced emails with retry logic

### Document Processing
- **docx**: Document generation library for DOCX files with advanced formatting
- **pdf-lib**: PDF creation and modification with digital signatures
- **html2canvas**: HTML to image conversion for document previews and thumbnails
- **OCR Integration**: Extract text from uploaded documents and images
- **Document Comparison**: Compare versions with change highlighting

### Developer Tools
- **TypeScript**: Static type-checking for JavaScript with strict mode enabled
- **ESLint**: JavaScript and TypeScript linter with custom rule configuration
- **Prettier**: Code formatter with consistent styling across the project
- **Vercel**: Deployment platform with CI/CD integration and preview environments
- **Testing Framework**: Jest and React Testing Library for unit and integration tests
- **Performance Monitoring**: Real-time application performance tracking

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- npm (v9 or later)
- A Supabase account and project
- A Google Cloud Project with Gmail API enabled and OAuth consent screen configured

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dealpig.git
   cd dealpig
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the `.env.example` file to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

### Setting Up Supabase

1. **Create a Supabase project**:
   - Go to [Supabase](https://supabase.com) and create a new project
   - Note your project URL and API keys (anon key and service role key)

2. **Set up the database schema**:
   - Navigate to the SQL editor in your Supabase dashboard
   - Copy the contents of `supabase/setup-complete-schema.sql`
   - Run this script to create all required tables, functions, and security policies

3. **Configure storage buckets**:
   - The schema script will automatically create all necessary storage buckets
   - Verify that the following buckets exist in your Storage section:
     - `lead-imports`: For storing imported lead CSV files
     - `templates`: For document templates
     - `generated-documents`: For generated PDFs and DOCXs
     - `images`: For general image storage
     - `logos`: For company logos and branding

### Setting Up Google OAuth

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable the Gmail API for this project

2. **Configure OAuth Consent Screen**:
   - Set up the OAuth consent screen (external type is fine for testing)
   - Add the required scopes:
     - `https://www.googleapis.com/auth/gmail.send` (Send email on behalf of user)
     - `https://www.googleapis.com/auth/gmail.readonly` (Read emails for tracking replies)
     - `https://www.googleapis.com/auth/userinfo.profile` (Get user profile information)

3. **Create OAuth Client ID**:
   - Create OAuth Client ID credentials (Web Application type)
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/gmail/callback`
     - For production: `https://yourdomain.com/api/auth/gmail/callback`
   - Save your Client ID and Client Secret as environment variables:
     - `GMAIL_CLIENT_ID`
     - `GMAIL_CLIENT_SECRET`

### Environment Configuration

Set the following environment variables in your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_APP_NAME=DealPig

# Security
CRON_SECRET=random_secure_string_min_32_chars
CSRF_SECRET=another_random_secure_string_min_32_chars
ENCRYPTION_KEY=secure_encryption_key_32_chars

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
```

### Running the Application

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser

3. **Initial setup**:
   - Register an admin user
   - Connect your Gmail account through OAuth
   - Create your first document template

### Background Services

DealPig includes several background services that run automatically. In development, you can trigger them manually:

1. **Token refresh service**:
   This service automatically refreshes OAuth tokens before they expire.
   ```bash
   curl -X POST http://localhost:3000/api/cron?job=token-refresh \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

2. **Email monitoring service**:
   This service checks for email replies and updates the status of tracked emails.
   ```bash
   curl -X POST http://localhost:3000/api/cron?job=email-monitor \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

3. **All background jobs**:
   Run all background jobs at once:
   ```bash
   curl -X POST http://localhost:3000/api/cron \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Deploying to Vercel

1. **Connect your GitHub repository**:
   - Create a Vercel account and link your GitHub repository
   - Import the project into Vercel

2. **Configure environment variables**:
   - Copy all environment variables from your `.env.local` file to the Vercel project settings
   - Make sure to update `GOOGLE_REDIRECT_URI` to your production domain

3. **Deploy**:
   - Vercel will automatically deploy your application
   - The included `vercel.json` file configures:
     - Security headers
     - Cron job schedules:
       - All jobs: Every hour
       - Token refresh: Every 6 hours
       - Email monitoring: Every 30 minutes

4. **Post-deployment**:
   - Verify the health of your deployment by visiting `https://yourdomain.com/api/health`
   - Set up monitoring for this endpoint to ensure your app stays healthy

### Health Monitoring

The application includes a built-in health check endpoint at `/api/health` that verifies:
- Database connectivity
- Required environment variables
- API services

You can integrate this endpoint with uptime monitoring services like UptimeRobot, Pingdom, or StatusCake.

## 🔐 Security Features

### Token Encryption

All OAuth tokens are encrypted before storage using AES-256-GCM encryption. The encryption key is derived from the `ENCRYPTION_KEY` environment variable.

### Rate Limiting

The application includes rate limiting to protect against abuse:
- API endpoints are rate-limited based on IP address
- Configurable via environment variables

### CSRF Protection

Cross-Site Request Forgery protection is enabled for all form submissions using secure tokens.

### Environment Variable Validation

The application validates required environment variables during startup to prevent running with missing configuration.

## 📚 API Reference

### Authentication

The application uses NextAuth.js for authentication with Google OAuth integration.

- `POST /api/auth/signin`: Sign in endpoint
- `POST /api/auth/signout`: Sign out endpoint
- `GET /api/auth/session`: Get current session
- `GET /api/auth/csrf`: Get CSRF token

### Lead Management

- `GET /api/leads`: List all leads
- `POST /api/leads`: Create a new lead
- `GET /api/leads/:id`: Get lead by ID
- `PUT /api/leads/:id`: Update lead by ID
- `DELETE /api/leads/:id`: Delete lead by ID
- `POST /api/leads/import`: Import leads from CSV

### Campaign Management

- `GET /api/campaigns`: List all campaigns
- `POST /api/campaigns`: Create a new campaign
- `GET /api/campaigns/:id`: Get campaign by ID
- `PUT /api/campaigns/:id`: Update campaign by ID
- `DELETE /api/campaigns/:id`: Delete campaign by ID
- `GET /api/campaigns/:id/analytics`: Get campaign analytics

### Email Management

- `POST /api/leads/:id/send-email`: Send email related to a lead
- `GET /api/leads/:id/emails`: Get emails for a lead
- `POST /api/emails/bulk-send`: Send bulk emails
- `GET /api/emails/tracking/:id`: Track email opens and clicks

### Documents

- `POST /api/leads/:id/generate-loi`: Generate a Letter of Intent (LOI) for a lead
- `POST /api/documents/bulk-loi`: Generate multiple LOIs
- `GET /api/templates`: Get document/email templates
- `POST /api/templates`: Create a new template
- `PUT /api/templates/:id`: Update a template

### tRPC API

The application also provides a tRPC API for type-safe client-server communication:

- `trpc.leads.getAll`: Get all leads
- `trpc.campaigns.create`: Create a campaign
- `trpc.documents.generateBulkLoi`: Generate multiple LOIs
- `trpc.emails.sendBulkEmail`: Send bulk emails

## 📁 Directory Structure

```
dealpig/
├── actions/              # Server actions for form handling
│   ├── analytics/        # Analytics data processing
│   ├── auth.action.ts    # Authentication actions
│   ├── campaign.action.ts # Campaign-related actions
│   ├── generateLoi.action.ts # LOI generation
│   └── ...
├── app/                  # Next.js app router components
│   ├── (app)/            # Main application routes
│   ├── (auth)/           # Authentication routes
│   ├── api/              # API routes
│   └── providers/        # Context providers
├── auth_tokens/          # Gmail API auth tokens (gitignored)
├── components/           # Reusable React components
│   ├── accounts/         # Account management components
│   ├── auth/             # Authentication components
│   ├── home/             # Dashboard components
│   ├── layout/           # Layout components
│   ├── table/            # Data table components
│   └── ui/               # UI components
├── config/               # Application configuration
├── data/                 # Sample data and assets
├── helpers/              # Helper functions and utilities
├── lib/                  # Core libraries
│   ├── migrations/       # Database migrations
│   ├── database.ts       # Database client
│   └── ...
├── public/               # Static assets
├── server/               # Server-side code
│   └── trpc/             # tRPC router definitions
├── styles/               # Global styles
├── templates/            # Document and email templates
└── __tests__/            # Test files (not shown in tree)
```

## 🧪 Testing

The project uses Jest and React Testing Library for testing. Run the tests with:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

## 🚢 Deployment

The project is configured for deployment on Vercel.

1. Connect your GitHub repository to Vercel
2. Set up environment variables in the Vercel dashboard based on `.env.example`
3. Deploy from the Vercel dashboard or use the Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```

## 📊 Database Schema

### Tables

#### leads
- `id`: UUID primary key
- `property_address`: Text, property street address
- `property_city`: Text, city name
- `property_state`: Text, state abbreviation
- `property_zip`: Text, postal code
- `wholesale_value`: Numeric, estimated wholesale value
- `market_value`: Numeric, estimated market value
- `days_on_market`: Integer, days property has been listed
- `mls_status`: Text, MLS listing status
- `status`: Text, lead status (new, contacted, negotiating, closed, dead)
- `source`: Text, lead source
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

#### contacts
- `id`: UUID primary key
- `lead_id`: UUID, foreign key to leads
- `name`: Text, contact name
- `email`: Text, contact email address
- `phone`: Text, contact phone number
- `is_primary`: Boolean, indicates primary contact
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

#### campaigns
- `id`: UUID primary key
- `name`: Text, campaign name
- `description`: Text, campaign description
- `status`: Text, campaign status
- `stats`: JSONB, campaign statistics
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

#### campaign_leads
- `campaign_id`: UUID, foreign key to campaigns
- `lead_id`: UUID, foreign key to leads
- `status`: Text, status within campaign
- `created_at`: Timestamp with timezone

#### emails
- `id`: UUID primary key
- `lead_id`: UUID, foreign key to leads
- `campaign_id`: UUID, foreign key to campaigns (optional)
- `sender_id`: UUID, foreign key to senders
- `subject`: Text, email subject
- `body`: Text, email HTML body
- `status`: Text, email status (draft, sent, opened, replied, bounced)
- `tracking_id`: Text, unique tracking ID
- `sent_at`: Timestamp with timezone
- `opened_at`: Timestamp with timezone
- `clicked_at`: Timestamp with timezone
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

#### email_bounces
- `id`: UUID primary key
- `email`: Text, recipient email address
- `campaign_id`: UUID, foreign key to campaigns (optional)
- `bounce_type`: Text, bounce type (hard, soft)
- `bounce_code`: Text, bounce error code
- `description`: Text, bounce description
- `timestamp`: Timestamp with timezone
- `created_at`: Timestamp with timezone

#### senders
- `id`: UUID primary key
- `user_id`: UUID, foreign key to users
- `name`: Text, sender name
- `email`: Text, sender email address
- `title`: Text, job title
- `daily_quota`: Integer, daily email sending limit
- `oauth_token`: Text, encrypted OAuth token
- `oauth_refresh_token`: Text, encrypted OAuth refresh token
- `emails_sent`: Integer, count of emails sent
- `last_sent_at`: Timestamp with timezone
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

#### templates
- `id`: UUID primary key
- `name`: Text, template name
- `type`: Text, template type (email, document)
- `subject`: Text, email subject (for email templates)
- `content`: Text, template HTML content
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@dealpig.com or open an issue in the GitHub repository.

## 📋 Roadmap

- **CRM Integration**: Connect with popular CRM systems
- **Advanced Analytics**: Enhanced reporting and visualization
- **Mobile App**: Native mobile application for iOS and Android
- **Property Market Data**: Integration with MLS and property data APIs
- **Team Collaboration**: Enhanced team workflow and task assignment
