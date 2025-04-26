# Gmail Integration

This document explains how DealPig integrates with Gmail for sending and monitoring emails.

## Overview

DealPig uses Gmail API to:
- Send emails to leads and clients
- Monitor replies to sent emails
- Track email engagement (opens, replies)
- Handle bounces and other email delivery issues

## Setup Requirements

1. **Google Cloud Project**:
   - Create a project in [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Gmail API
   - Configure OAuth consent screen
   - Create OAuth client ID credentials

2. **Required Scopes**:
   - `https://www.googleapis.com/auth/gmail.send` - To send emails
   - `https://www.googleapis.com/auth/gmail.readonly` - To read emails for monitoring replies
   - `https://www.googleapis.com/auth/gmail.modify` - To modify email settings/labels

## Authentication Flow

DealPig uses the OAuth 2.0 flow to authenticate with Gmail:

1. User initiates Gmail account connection from the Accounts page
2. System redirects to Google's OAuth consent screen
3. User grants permissions to DealPig
4. Google redirects back to our application with an authorization code
5. Backend exchanges authorization code for access and refresh tokens
6. Tokens are securely stored in the database
7. Access token is refreshed automatically when expired

## Implementation Details

### Sending Emails

The `sendEmail.action.ts` file handles email sending through Gmail API. Key functions:

- `prepareEmail`: Formats the email with proper headers and tracking pixel
- `sendGmailEmail`: Encodes the email in base64 and sends via Gmail API
- `createTrackingId`: Generates a unique tracking ID for each email

### Email Monitoring

The `gmailMonitor.ts` file handles email monitoring logic:

- Periodically fetches new emails from Gmail accounts
- Identifies replies to previously sent emails
- Updates email tracking status in the database
- Records reply timestamps and updates campaign statistics

### Token Refresh

The `tokenRefresher.ts` file manages OAuth token refresh:

- Checks for expired tokens before API calls
- Automatically refreshes tokens using the stored refresh token
- Updates the database with new access tokens
- Handles token refresh errors and alerts on authentication issues

## Error Handling

Email integration handles these common error scenarios:

| Error                         | Handling Strategy                                          |
|-------------------------------|-----------------------------------------------------------|
| Authentication failure        | Alert admin, mark sender as requiring re-authentication    |
| Rate limit exceeded           | Implement exponential backoff, retry with other senders    |
| Mailbox quota exceeded        | Mark sender as temporarily unavailable, rotate to others   |
| Email sending failure         | Retry with backoff, record detailed error, alert if critical |
| Token refresh failure         | Prompt user to re-authenticate, provide clear instructions |

## Monitoring and Health Checks

The health check system monitors Gmail integration by:

1. Periodically testing API connectivity
2. Verifying authentication status of connected accounts
3. Monitoring quota usage and rate limits
4. Alerting on repeated failures or issues

## Security Considerations

1. All tokens are encrypted at rest in the database
2. Access tokens are only decrypted when needed for API calls
3. Application uses least-privilege scopes wherever possible
4. Regular token rotation and validation

## Troubleshooting

Common issues and solutions:

- **Authentication errors**: Check token validity, re-authenticate if needed
- **Rate limiting**: Increase sender pool, implement better distribution
- **Missing replies**: Check monitoring frequency, verify Gmail labels
- **Tracking inaccuracies**: Check if tracking pixel is being blocked