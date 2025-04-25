# DealPig - Real Estate Deal Management Platform

<p align="center">
  <img src="./public/dealpig.svg" alt="DealPig Logo" width="200" />
</p>

DealPig: The comprehensive deal procurement platform designed exclusively for real estate investors and wholesalers. It simplifies lead management, document generation, and email communications through an intuitive web interface. DealPig features multi-sender automailer system drip marketing campaigns and spam filter avoidance. With rich text template editor, analytics and reporting, and CRM purpose built for real estate investor workflow automation; Its subversively progressive performatively seditious autonomous inbound lead handling engine fueled by open source intelligence for pragmatically skiptraced target acquisitions leveraging buyer advantaged market positioning was designed to be so damn good - it would make a blind pig full of nuts in the middle of a cashew famine.

## 🌟 Features

### Lead Management
- **Lead Import & Export**: Bulk import leads from CSV files, export lead data
- **Lead Tracking**: Monitor status changes and history for each property
- **Contact Management**: Maintain multiple contacts for each property
- **Property Details**: Track property attributes, market values, and days on market

### Communication Tools
- **Email Campaigns**: Create and schedule multi-touch email campaigns
- **Email Tracking**: Monitor opens, clicks, replies, and bounces with detailed analytics
- **Bulk Email**: Send personalized emails to multiple leads simultaneously
- **Gmail Integration**: Seamless connection with Gmail for sending emails
- **SMTP Support**: Use custom SMTP servers for email delivery

### Document Generation
- **Letter of Intent (LOI)**: Generate professional LOI documents with property details
- **Bulk Document Generation**: Create multiple LOIs at once for selected properties
- **Document Templates**: Create and manage reusable document templates
- **PDF & DOCX Export**: Download generated documents in multiple formats

### Dashboard & Analytics
- **Campaign Performance**: Track email campaign effectiveness with detailed metrics
- **Lead Status Analytics**: Visual breakdown of lead pipeline and conversions
- **Weekly Performance**: Monitor trends and activity over time
- **Sender Analytics**: Track performance metrics by team member

### User Management
- **Sender Profiles**: Add multiple team members as email senders
- **OAuth Authentication**: Secure Gmail authorization with OAuth 2.0
- **Daily Email Quotas**: Set sending limits for each team member
- **Access Controls**: Define user roles and permissions

### Mobile-Responsive Design
- **Responsive Interface**: Optimized for desktop, tablet, and mobile devices
- **Mobile-Specific Components**: Custom UI for smaller screens

## 🔧 Tech Stack

### Frontend
- **React 19**: UI library for building interactive user interfaces
- **Next.js 14**: React framework with App Router for server-side rendering and routing
- **TailwindCSS**: Utility-first CSS framework for responsive design
- **HeroUI**: Component library for modern UI elements
- **TanStack/react-query**: State management for asynchronous data
- **tRPC**: End-to-end typesafe API layer

### Backend
- **Next.js API Routes**: Backend API endpoints
- **Server Actions**: Form submissions and data mutations
- **tRPC**: Type-safe API layer between client and server

### Database & Storage
- **Supabase**: PostgreSQL database with real-time capabilities
- **Row-level Security**: Fine-grained access control policies
- **Supabase Storage**: Document and file storage solution

### Authentication & Security
- **NextAuth.js**: Authentication solution for Next.js
- **OAuth 2.0**: Secure authentication with Gmail API
- **CSRF Protection**: Cross-Site Request Forgery prevention

### Email Services
- **Gmail API**: Send emails through user Gmail accounts
- **Email Templates**: HTML email template system
- **Email Tracking**: Open, click, and reply tracking

### Document Processing
- **docx**: Document generation library for DOCX files
- **pdf-lib**: PDF creation and modification
- **html2canvas**: HTML to image conversion for document previews

### Developer Tools
- **TypeScript**: Static type-checking for JavaScript
- **ESLint**: JavaScript and TypeScript linter
- **Prettier**: Code formatter
- **Vercel**: Deployment platform with CI/CD integration

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- npm (v9 or later)
- A Supabase account and project
- A Google Cloud Platform account with Gmail API configured

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
   
   Required environment variables:
   ```
   # Next Auth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   # Email tracking
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Set up the database:
   Run the database migration scripts in your Supabase project:
   ```bash
   # Using schema.sql file
   npm run db:migrate
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

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
