import { sendLoiEmail } from '../../actions/sendLoiEmail.action';
import { generateLoi } from '../../actions/generateLoi.action';
import { sendEmail } from '../../actions/sendEmail.action';
import { createEmail, updateEmailStatus, getLeadById, getSenderByEmail } from '../../lib/database';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('../../actions/generateLoi.action');
jest.mock('../../actions/sendEmail.action');
jest.mock('../../lib/database');
jest.mock('path');
jest.mock('uuid');

describe('sendLoiEmail action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (generateLoi as jest.Mock).mockResolvedValue('/mock-loi-path.pdf');
    (getSenderByEmail as jest.Mock).mockResolvedValue({ id: 'sender-id-123', email: 'test@example.com' });
    (createEmail as jest.Mock).mockResolvedValue({ id: 'email-id-123' });
    (updateEmailStatus as jest.Mock).mockResolvedValue({ success: true });
    (getLeadById as jest.Mock).mockResolvedValue({ id: 'lead-id-123', status: 'NEW' });
    (sendEmail as jest.Mock).mockResolvedValue({ success: true, message: 'Email sent successfully' });
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (uuidv4 as jest.Mock).mockReturnValue('mock-uuid-12345');
    
    // Mock fetch for updateLeadStatus
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  it('should successfully send LOI email', async () => {
    // Setup
    const mockParams = {
      leadId: 'lead-id-123',
      recipientEmail: 'recipient@example.com',
      recipientName: 'John Doe',
      subject: 'Letter of Intent for 123 Main St',
      body: '<p>Please see the attached LOI</p>',
      senderEmail: 'sender@example.com',
      loiParams: {
        propertyAddress: '123 Main St',
        propertyCity: 'Test City',
        propertyState: 'TX',
        propertyZip: '12345',
        offerPrice: 250000,
        earnestMoney: 5000,
        closingDate: '2025-05-15'
      }
    };

    // Execute
    const result = await sendLoiEmail(mockParams);

    // Assert
    expect(result.success).toBe(true);
    expect(result.loiPath).toBe('/mock-loi-path.pdf');
    expect(result.emailId).toBe('email-id-123');
    expect(generateLoi).toHaveBeenCalledWith(expect.objectContaining({
      propertyAddress: '123 Main St',
      recipientName: 'John Doe'
    }));
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'recipient@example.com',
      subject: 'Letter of Intent for 123 Main St',
      attachmentPath: expect.any(String)
    }));
    expect(updateEmailStatus).toHaveBeenCalledWith('email-id-123', 'SENT', expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('/api/leads/update-status', expect.any(Object));
  });

  it('should handle LOI generation failure', async () => {
    // Setup
    (generateLoi as jest.Mock).mockResolvedValue(null);
    
    // Execute
    const result = await sendLoiEmail({
      leadId: 'lead-id-123',
      recipientEmail: 'recipient@example.com',
      recipientName: 'John Doe',
      subject: 'Test Subject',
      body: 'Test Body',
      senderEmail: 'sender@example.com',
      loiParams: {
        propertyAddress: '123 Main St',
        propertyCity: 'Test City',
        propertyState: 'TX',
        propertyZip: '12345',
        offerPrice: 250000,
        earnestMoney: 5000,
        closingDate: '2025-05-15'
      }
    });
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to generate LOI document');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('should handle sender not found error', async () => {
    // Setup
    (getSenderByEmail as jest.Mock).mockResolvedValue(null);
    
    // Execute
    const result = await sendLoiEmail({
      leadId: 'lead-id-123',
      recipientEmail: 'recipient@example.com',
      recipientName: 'John Doe',
      subject: 'Test Subject',
      body: 'Test Body',
      senderEmail: 'unknown@example.com',
      loiParams: {
        propertyAddress: '123 Main St',
        propertyCity: 'Test City',
        propertyState: 'TX',
        propertyZip: '12345',
        offerPrice: 250000,
        earnestMoney: 5000,
        closingDate: '2025-05-15'
      }
    });
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain('Sender with email unknown@example.com not found');
  });

  it('should handle email creation failure', async () => {
    // Setup
    (createEmail as jest.Mock).mockResolvedValue(null);
    
    // Execute
    const result = await sendLoiEmail({
      leadId: 'lead-id-123',
      recipientEmail: 'recipient@example.com',
      recipientName: 'John Doe',
      subject: 'Test Subject',
      body: 'Test Body',
      senderEmail: 'sender@example.com',
      loiParams: {
        propertyAddress: '123 Main St',
        propertyCity: 'Test City',
        propertyState: 'TX',
        propertyZip: '12345',
        offerPrice: 250000,
        earnestMoney: 5000,
        closingDate: '2025-05-15'
      }
    });
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to create email record');
  });

  it('should handle email sending failure', async () => {
    // Setup
    (sendEmail as jest.Mock).mockResolvedValue({
      success: false,
      message: 'SMTP error: Failed to connect to server'
    });
    
    // Execute
    const result = await sendLoiEmail({
      leadId: 'lead-id-123',
      recipientEmail: 'recipient@example.com',
      recipientName: 'John Doe',
      subject: 'Test Subject',
      body: 'Test Body',
      senderEmail: 'sender@example.com',
      loiParams: {
        propertyAddress: '123 Main St',
        propertyCity: 'Test City',
        propertyState: 'TX',
        propertyZip: '12345',
        offerPrice: 250000,
        earnestMoney: 5000,
        closingDate: '2025-05-15'
      }
    });
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain('Failed to send email');
    expect(updateEmailStatus).toHaveBeenCalledWith('email-id-123', 'FAILED', expect.any(Object));
  });
  
  it('should handle unexpected exceptions', async () => {
    // Setup
    (generateLoi as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });
    
    // Execute
    const result = await sendLoiEmail({
      leadId: 'lead-id-123',
      recipientEmail: 'recipient@example.com',
      recipientName: 'John Doe',
      subject: 'Test Subject',
      body: 'Test Body',
      senderEmail: 'sender@example.com',
      loiParams: {
        propertyAddress: '123 Main St',
        propertyCity: 'Test City',
        propertyState: 'TX',
        propertyZip: '12345',
        offerPrice: 250000,
        earnestMoney: 5000,
        closingDate: '2025-05-15'
      }
    });
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.message).toContain('Error: Unexpected error');
  });
});