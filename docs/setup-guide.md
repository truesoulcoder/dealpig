# DealPig Setup Guide

This guide covers the step-by-step process to set up and run the DealPig application for development or production use.

## Prerequisites

- Node.js (v18.x or later)
- NPM (v9.x or later)
- A Supabase account
- A Google Cloud Platform account (for Gmail API)
- Git

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dealpig.git
cd dealpig
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the project root with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth Configuration
GMAIL_CLIENT_ID=your_google_client_id
GMAIL_CLIENT_SECRET=your_google_client_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DealPig

# Security
CSRF_SECRET=a_random_32_character_string_for_csrf_protection
ENCRYPTION_KEY=a_random_32_character_string_for_encryption

# Email Configuration
EMAIL_FROM=noreply@example.com
EMAIL_REPLY_TO=support@example.com

# Optional Monitoring
ENABLE_MONITORING=true
ALERT_EMAIL=admin@example.com
```

### 4. Set Up Supabase

1. Create a new project in the [Supabase Dashboard](https://app.supabase.io/)
2. Get your project URL and API keys and add them to the `.env.local` file
3. Run the database setup script:

```bash
npx supabase db diff -f setup-complete > setup.sql
cat supabase/setup-complete-schema.sql >> setup.sql
npx supabase db execute < setup.sql
```

4. Set up storage buckets:
   - Go to Storage in Supabase Dashboard
   - Create buckets: `lead-imports`, `templates`, `generated-documents`
   - Set appropriate permissions for each bucket

### 5. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Gmail API
4. Configure the OAuth consent screen
5. Create OAuth client ID credentials (Web application)
6. Add your authorized redirect URIs:
   - `http://localhost:3000/api/auth/gmail/callback` (development)
   - `https://yourproductionurl.com/api/auth/gmail/callback` (production)
7. Copy the Client ID and Secret to your `.env.local` file

## Database Setup

The application requires several tables to function properly. The setup script should have created these, but verify that you have:

- `leads` - Stores lead information
- `campaigns` - Stores campaign details
- `emails` - Stores email tracking information
- `senders` - Stores email sender accounts
- `profiles` - Stores user profile information
- `health_checks` - Stores system health information

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the application in development mode at `http://localhost:3000`.

### Production Build

```bash
npm run build
npm start
```

## Post-Setup Configuration

### 1. Create Admin User

1. Register a new user through the application
2. Connect to your Supabase database and run:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'youradminemail@example.com';
```

### 2. Configure Email Senders

1. Log in as admin
2. Go to the Accounts section
3. Add email sender accounts
4. Follow the OAuth flow to authenticate with Gmail

### 3. Setup Document Templates

1. Go to Templates section
2. Upload your document templates
3. Configure template variables

## Verifying Setup

Verify your setup by running the health check:

1. Navigate to `/api/health` in your browser
2. Verify all services show as "operational"

## Security Considerations

1. **API Keys**: Keep your Supabase service role key secure
2. **CSRF Protection**: Ensure a strong random CSRF secret is set
3. **Encryption**: Use a secure random key for encryption
4. **Authentication**: Store OAuth tokens securely in the database

## Monitoring & Maintenance

The application includes several monitoring systems:

1. **Health checks**: Available at `/api/health`
2. **System monitoring**: Automatically runs on startup
3. **Email tracking**: Records email opens and replies

Schedule regular:
- Database backups
- Token refreshes
- Security audits

## Troubleshooting Common Issues

### Database Connection Issues

Check:
- Supabase credentials in `.env.local`
- Network connectivity to Supabase
- Service status of Supabase

### Gmail Authentication Problems

Check:
- Google Cloud project configuration
- API is enabled
- OAuth credentials are correct
- Authorized redirect URIs match exactly

### Email Sending Failures

Check:
- Gmail API quota
- Token expiration
- Rate limiting
- Network connectivity

## Support and Community

- GitHub Issues: [https://github.com/yourusername/dealpig/issues](https://github.com/yourusername/dealpig/issues)
- Documentation: [https://github.com/yourusername/dealpig/docs](https://github.com/yourusername/dealpig/docs)

## License

This project is licensed under the MIT License - see the LICENSE file for details.