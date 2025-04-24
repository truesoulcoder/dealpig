# DealPig - Real Estate Deal Management Platform

DealPig is a comprehensive real estate deal management platform designed for real estate investors and wholesalers. It simplifies lead management, document generation, and email communications through an intuitive web interface.

## Features

- **Lead Management**: Import, track, and manage real estate leads
- **Document Generation**: Create professional Letters of Intent (LOIs) and other documents
- **Email Communication**: Send and track emails through Gmail integration
- **CSV Import**: Bulk import leads from CSV files
- **Template Management**: Create and manage document and email templates
- **User Management**: Manage team members and access controls

## Tech Stack

- **Frontend**: Next.js 14, React 19, TailwindCSS, HeroUI components
- **Backend**: Next.js API routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Email**: Gmail API
- **Document Generation**: docx, pdf-lib
- **Deployment**: Vercel

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- npm (v9 or later)
- A Supabase account and project
- A Google Cloud Platform account with Gmail API configured

## Installation

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

4. Set up the database:
   Run the database migration script in your Supabase project:
   ```sql
   -- Execute the supabase-schema.sql in your Supabase SQL editor
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## API Reference

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

### Email

- `POST /api/leads/:id/send-email`: Send email related to a lead
- `GET /api/leads/:id/emails`: Get emails for a lead

### Documents

- `POST /api/leads/:id/generate-loi`: Generate a Letter of Intent (LOI) for a lead
- `GET /api/templates`: Get document/email templates
- `POST /api/templates`: Create a new template
- `PUT /api/templates/:id`: Update a template

## Directory Structure

```
dealpig/
├── actions/              # Server actions for form handling
├── app/                  # Next.js app router components
├── auth_tokens/          # Gmail API auth tokens (gitignored)
├── components/           # Reusable React components
├── config/               # Application configuration
├── data/                 # Sample data and assets
├── helpers/              # Helper functions and utilities
├── lib/                  # Core libraries, database access
├── public/               # Static assets
├── styles/               # Global styles
└── __tests__/            # Test files
```

## Testing

The project uses Jest and React Testing Library for testing. Run the tests with:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

## Deployment

The project is configured for deployment on Vercel.

1. Connect your GitHub repository to Vercel
2. Set up environment variables in the Vercel dashboard based on `.env.example`
3. Deploy from the Vercel dashboard or use the Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```

## Database Documentation

### Tables

#### leads
- `id`: UUID primary key
- `property_address`: Text, property street address
- `property_city`: Text, city name
- `property_state`: Text, state abbreviation
- `property_zip`: Text, postal code
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

#### emails
- `id`: UUID primary key
- `lead_id`: UUID, foreign key to leads
- `sender_id`: UUID, foreign key to senders
- `subject`: Text, email subject
- `body`: Text, email HTML body
- `status`: Text, email status (draft, sent, opened, replied, bounced)
- `tracking_id`: Text, unique tracking ID
- `sent_at`: Timestamp with timezone
- `opened_at`: Timestamp with timezone
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

#### templates
- `id`: UUID primary key
- `name`: Text, template name
- `type`: Text, template type (email, document)
- `content`: Text, template HTML content
- `created_at`: Timestamp with timezone
- `updated_at`: Timestamp with timezone

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@dealpig.com or open an issue in the GitHub repository.
