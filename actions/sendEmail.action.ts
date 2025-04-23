"use server";

import { google } from 'googleapis';
import fs from 'fs';

interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  attachmentPath?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<void> {
  const { to, subject, body, attachmentPath } = params;

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ];

  if (attachmentPath) {
    const attachment = fs.readFileSync(attachmentPath).toString('base64');
    messageParts.push(
      '',
      '--boundary',
      'Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document; name="attachment.docx"',
      'Content-Transfer-Encoding: base64',
      '',
      attachment
    );
  }

  const message = messageParts.join('\r\n');
  const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage,
    },
  });
}