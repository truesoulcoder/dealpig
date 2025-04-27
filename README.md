<p align="center">
  <img src="./public/dealpig.svg" alt="DealPig Logo" width="100%" />
Even a blind pig finds a nut from time to time?
</p>

# DealPig 
The comprehensive deal procurement platform designed exclusively for real estate investors and wholesalers. It simplifies lead management, document generation, and email communications through an intuitive web interface. DealPig features multi-sender automailer system drip marketing campaigns and spam filter avoidance. With rich text template editor, analytics and reporting, and CRM purpose built for real estate investor workflow automation; Its subversively progressive performatively seditious autonomous inbound lead handling engine fueled by open source intelligence for pragmatically skiptraced target acquisitions leveraging buyer advantaged market positioning designed so well it would make a blind pig sick of nuts in the middle of a cashew famine.

## Table of Contents
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
- [Usage](#usage)
  - [Lead Management](#lead-management)
  - [Campaign Creation](#campaign-creation)
  - [Email Templates](#email-templates)
  - [Document Templates](#document-templates)
  - [Email Automation](#email-automation)
- [System Architecture](#system-architecture)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

### Lead Management
- **CSV Import**: Quickly import leads from CSV files with intelligent field mapping
- **Lead Tracking**: Monitor lead status from initial contact through to closing
- **Lead Assignment**: Assign leads to team members and track ownership
- **Property Data**: Store and access comprehensive property information including addresses, owner details, and valuation metrics

### Campaign Management
- **Campaign Creation**: Set up targeted campaigns with customizable parameters
- **Lead Distribution**: Set daily lead processing limits and schedule campaigns
- **Performance Analytics**: Track open rates, response rates, and conversion metrics

### Email Automation
- **Multi-Sender Support**: Configure multiple sender accounts to improve deliverability
- **Drip Campaigns**: Schedule follow-up emails over time
- **Email Templates**: Create and manage reusable email templates
- **Email Tracking**: Monitor opens, clicks, and replies
- **Spam Filter Avoidance**: Smart sending patterns and natural language templates

### Document Generation
- **Template-Based Documents**: Generate Letters of Intent (LOIs), contracts, and other documents
- **Variable Substitution**: Auto-fill templates with lead and property data
- **PDF Generation**: Convert templates to professional PDF documents
- **E-Signature Support**: Send documents for electronic signature

### User Interface
- **Modern Dashboard**: Clean, responsive interface built with Next.js and Tailwind CSS
- **Dark/Light Mode**: Switch between display modes for optimal viewing
- **Role-Based Access**: Control user permissions based on roles

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- PostgreSQL database (or Supabase account)
- Gmail account with API access for email sending

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

3. Set up the database:
```bash
npm run db:setup
```
   Or if using Supabase, import the schema from `supabase/setup-complete-schema.sql`

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Authentication
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Email Configuration
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REDIRECT_URI=your_gmail_redirect_uri

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage

### Lead Management
1. Navigate to the Leads section
2. Import leads using the CSV uploader
3. View and manage leads in the interactive table
4. Add notes and update lead status as needed

### Campaign Creation
1. Go to the Campaigns section
2. Click "Create Campaign"
3. Set campaign parameters (name, description, sending schedule)
4. Select email templates and document templates
5. Add leads to the campaign
6. Configure sender accounts
7. Activate the campaign

### Email Templates
1. Go to the Templates section
2. Select "Email Templates"
3. Create or edit templates using the rich text editor
4. Use variable placeholders like `{{lead.owner_name}}` for personalization
5. Save templates for reuse across campaigns

### Document Templates
1. Go to the Templates section
2. Select "Document Templates"
3. Create templates for LOIs, contracts, or custom letters
4. Use variable placeholders to auto-populate with lead data
5. Preview generated documents before sending

### Email Automation
1. Set up sender accounts in the Accounts section
2. Configure daily sending limits and time windows
3. Monitor email performance in the dashboard

## System Architecture

DealPig is built with the following technologies:

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Next.js API routes, Supabase Functions
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **Email**: Gmail API integration
- **Document Generation**: Custom HTML-to-PDF conversion

## API Documentation

API endpoints are available at `/api/*` and include:

- `/api/leads`: Lead management endpoints
- `/api/campaigns`: Campaign configuration
- `/api/senders`: Email sender management
- `/api/auth`: Authentication endpoints
- `/api/webhooks`: Webhook handlers for email tracking

For detailed API documentation, see the `/docs` directory.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the terms found in the [LICENSE](./LICENSE) file.



