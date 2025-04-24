import { sendEmail } from '../../actions/sendEmail.action';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import fs from 'fs';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      accepted: ['test@example.com'],
    }),
  }),
}));

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        setCredentials: jest.fn(),
        getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' }),
      })),
    },
  },
}));

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation(() => JSON.stringify({
    refresh_token: 'mock-refresh-token',
    client_id: 'mock-client-id',
    client_secret: 'mock-client-secret',
  })),
  existsSync: jest.fn().mockReturnValue(true),
}));

describe('sendEmail action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send an email successfully', async () => {
    // Setup
    const emailParams = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      body: '<p>This is a test email</p>',
      senderEmail: 'sender@example.com',
    };

    // Execute
    const result = await sendEmail(emailParams);

    // Assert
    expect(result).toEqual({
      success: true,
      message: expect.stringContaining('Email sent successfully'),
      messageId: 'test-message-id',
    });
    expect(nodemailer.createTransport).toHaveBeenCalled();
    expect(google.auth.OAuth2).toHaveBeenCalled();
    expect(fs.readFileSync).toHaveBeenCalled();
  });

  it('should handle sending an email with attachment', async () => {
    // Setup
    const emailParams = {
      to: 'recipient@example.com',
      subject: 'Test Email with Attachment',
      body: '<p>This is a test email with attachment</p>',
      senderEmail: 'sender@example.com',
      attachmentPath: '/path/to/attachment.pdf',
    };

    // Execute
    const result = await sendEmail(emailParams);

    // Assert
    expect(result.success).toBe(true);
    expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        attachments: expect.arrayContaining([
          expect.objectContaining({
            path: '/path/to/attachment.pdf',
          }),
        ]),
      })
    );
  });

  it('should handle errors when token file is not found', async () => {
    // Setup
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
    
    const emailParams = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      body: '<p>This is a test email</p>',
      senderEmail: 'unknown@example.com',
    };

    // Execute
    const result = await sendEmail(emailParams);

    // Assert
    expect(result).toEqual({
      success: false,
      message: expect.stringContaining('Auth token not found'),
    });
  });

  it('should handle errors in sending email', async () => {
    // Setup
    const sendMailMock = jest.fn().mockRejectedValue(new Error('Failed to send email'));
    (nodemailer.createTransport as jest.Mock).mockReturnValueOnce({
      sendMail: sendMailMock,
    });

    const emailParams = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      body: '<p>This is a test email</p>',
      senderEmail: 'sender@example.com',
    };

    // Execute
    const result = await sendEmail(emailParams);

    // Assert
    expect(result).toEqual({
      success: false,
      message: expect.stringContaining('Failed to send email'),
    });
  });
});