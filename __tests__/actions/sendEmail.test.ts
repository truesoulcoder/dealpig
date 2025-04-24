import { sendEmail } from '../../actions/sendEmail.action';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

// Mock googleapis correctly to match the implementation
jest.mock('googleapis', () => {
  // Mock for gmail.users.messages.send
  const mockSend = jest.fn().mockResolvedValue({
    data: { id: 'test-message-id' }
  });
  
  // Mock for gmail service
  const mockGmailInstance = {
    users: {
      messages: {
        send: mockSend
      }
    }
  };
  
  // Mock for OAuth2 client
  const mockSetCredentials = jest.fn();
  const mockGetAccessToken = jest.fn().mockResolvedValue({ token: 'mock-token' });
  const mockOAuth2 = jest.fn().mockImplementation(() => ({
    setCredentials: mockSetCredentials,
    getAccessToken: mockGetAccessToken,
  }));
  
  return {
    google: {
      auth: {
        OAuth2: mockOAuth2
      },
      gmail: jest.fn().mockImplementation(() => mockGmailInstance)
    }
  };
});

// Mock fs
jest.mock('fs', () => ({
  readFileSync: jest.fn().mockImplementation((path) => {
    if (path.includes('token')) {
      return JSON.stringify({
        client_id: 'mock-client-id',
        client_secret: 'mock-client-secret',
        redirect_uri: 'mock-redirect-uri',
        refresh_token: 'mock-refresh-token',
      });
    }
    return Buffer.from('mock-file-content');
  }),
  existsSync: jest.fn().mockImplementation(() => true),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  basename: jest.fn().mockImplementation((path) => {
    if (typeof path === 'string') {
      const parts = path.split('/');
      return parts[parts.length - 1];
    }
    return 'mock-filename.pdf';
  }),
}));

describe('sendEmail action', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { 
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'mock-client-id',
      GOOGLE_CLIENT_SECRET: 'mock-client-secret',
      GOOGLE_REDIRECT_URI: 'mock-redirect-uri',
      GOOGLE_REFRESH_TOKEN: 'mock-refresh-token'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
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
      emailId: 'test-message-id',
    });
    expect(google.auth.OAuth2).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String)
    );
    expect(google.gmail).toHaveBeenCalledWith(
      expect.objectContaining({
        version: 'v1',
        auth: expect.any(Object)
      })
    );
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
    expect(google.gmail).toHaveBeenCalled();
    
    // Check if path-related functions were called for the attachment
    expect(fs.existsSync).toHaveBeenCalled();
    expect(path.basename).toHaveBeenCalled();
  });

  it('should handle errors when token file is not found', async () => {
    // Setup
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
    (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('File not found');
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
    // Since the implementation falls back to environment variables, this should succeed
    // as long as the environment variables are properly set in the test
    expect(result.success).toBe(true);
    expect(result.message).toContain('Email sent successfully');
  });

  it('should handle errors during email sending', async () => {
    // Setup
    const mockGmail = require('googleapis').google.gmail;
    (mockGmail().users.messages.send as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to send email')
    );

    const emailParams = {
      to: 'recipient@example.com',
      subject: 'Test Email',
      body: '<p>This is a test email</p>',
      senderEmail: 'sender@example.com',
    };

    // Execute
    const result = await sendEmail(emailParams);

    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to send email');
  });
});