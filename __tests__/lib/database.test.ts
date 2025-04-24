import { 
  createLead, 
  getLeads, 
  getLeadById, 
  createContact, 
  getContactsByLeadId,
  getEmailsByLeadId,
  createEmail,
  updateEmailStatus,
  getTemplates,
} from '../../lib/database';
import { supabase } from '../../lib/supabaseClient';

// Mock the Supabase client
jest.mock('../../lib/supabaseClient', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis()
  };
  
  return {
    supabase: mockSupabase
  };
});

describe('Database Functions', () => {
  let mockResponse: { data: any; error: any };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = { data: null, error: null };
    
    // Make non-terminal methods return the mock itself for chaining
    (supabase.from as jest.Mock).mockReturnThis();
    (supabase.select as jest.Mock).mockReturnThis();
    (supabase.eq as jest.Mock).mockReturnThis();
    (supabase.order as jest.Mock).mockReturnThis();
    (supabase.insert as jest.Mock).mockReturnThis();
    (supabase.update as jest.Mock).mockReturnThis();
    (supabase.match as jest.Mock).mockReturnThis();
    (supabase.range as jest.Mock).mockReturnThis();
    (supabase.limit as jest.Mock).mockReturnThis();
    (supabase.or as jest.Mock).mockReturnThis();
    
    // Make terminal methods return the mockResponse
    (supabase.single as jest.Mock).mockResolvedValue(mockResponse);
    (supabase.maybeSingle as jest.Mock).mockResolvedValue(mockResponse);
    (supabase.delete as jest.Mock).mockResolvedValue(mockResponse);
  });

  describe('Leads Functions', () => {
    it('should create a lead', async () => {
      // Setup
      const mockLead = {
        property_address: '123 Test St',
        property_city: 'Test City',
        property_state: 'TX',
        property_zip: '12345',
      };
      
      const mockReturnData = { ...mockLead, id: 'test-lead-id' };
      mockResponse.data = [mockReturnData]; // Supabase returns array for insert
      mockResponse.error = null;

      // Execute
      const result = await createLead(mockLead);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('leads');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockReturnData);
    });

    it('should get all leads', async () => {
      // Setup
      const mockLeads = [
        { id: 'lead1', property_address: '123 Test St' },
        { id: 'lead2', property_address: '456 Other St' },
      ];
      mockResponse.data = mockLeads;
      mockResponse.error = null;

      // Execute
      const result = await getLeads();

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('leads');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.order).toHaveBeenCalled();
      expect(result).toEqual(mockLeads);
    });

    it('should get a lead by ID', async () => {
      // Setup
      const mockLead = { id: 'lead1', property_address: '123 Test St' };
      mockResponse.data = mockLead;
      mockResponse.error = null;

      // Execute
      const result = await getLeadById('lead1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('leads');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalled();
      expect(result).toEqual(mockLead);
    });
  });

  describe('Contacts Functions', () => {
    it('should create a contact', async () => {
      // Setup
      const mockContact = {
        lead_id: 'lead1',
        name: 'Test Contact',
        email: 'test@example.com',
        is_primary: true,
      };
      
      const mockReturnData = { ...mockContact, id: 'test-contact-id' };
      mockResponse.data = [mockReturnData]; // Supabase returns array for insert
      mockResponse.error = null;

      // Execute
      const result = await createContact(mockContact);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockReturnData);
    });

    it('should get contacts by lead ID', async () => {
      // Setup
      const mockContacts = [
        { id: 'contact1', name: 'Test Contact 1', email: 'test1@example.com' },
        { id: 'contact2', name: 'Test Contact 2', email: 'test2@example.com' },
      ];
      mockResponse.data = mockContacts;
      mockResponse.error = null;

      // Execute
      const result = await getContactsByLeadId('lead1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalled();
      expect(result).toEqual(mockContacts);
    });
  });

  describe('Emails Functions', () => {
    it('should create an email', async () => {
      // Setup
      const mockEmail = {
        lead_id: 'lead1',
        sender_id: 'sender1',
        subject: 'Test Email',
        body: '<p>Test content</p>',
      };
      
      const mockReturnData = { ...mockEmail, id: 'test-email-id', status: 'PENDING' };
      mockResponse.data = [mockReturnData]; // Supabase returns array for insert
      mockResponse.error = null;

      // Execute
      const result = await createEmail(mockEmail);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('emails');
      expect(supabase.insert).toHaveBeenCalled();
      expect(result).toEqual(mockReturnData);
    });

    it('should update email status', async () => {
      // Setup
      const mockEmail = {
        id: 'email1',
        status: 'OPENED',
        opened_at: expect.any(String),
      };
      
      mockResponse.data = [mockEmail]; // Supabase returns array for update
      mockResponse.error = null;

      // Execute
      const result = await updateEmailStatus('email1', 'OPENED');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('emails');
      expect(supabase.update).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalled();
      expect(result).toEqual(mockEmail);
    });

    it('should get emails by lead ID', async () => {
      // Setup
      const mockEmails = [
        { id: 'email1', subject: 'Email 1', status: 'SENT' },
        { id: 'email2', subject: 'Email 2', status: 'OPENED' },
      ];
      mockResponse.data = mockEmails;
      mockResponse.error = null;

      // Execute
      const result = await getEmailsByLeadId('lead1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('emails');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalled();
      expect(result).toEqual(mockEmails);
    });
  });

  describe('Templates Functions', () => {
    it('should get templates by type', async () => {
      // Setup
      const mockTemplates = [
        { id: 'template1', name: 'Template 1', content: '<p>Content 1</p>', type: 'document' },
        { id: 'template2', name: 'Template 2', content: '<p>Content 2</p>', type: 'document' },
      ];
      mockResponse.data = mockTemplates;
      mockResponse.error = null;

      // Execute
      const result = await getTemplates('document');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('templates');
      expect(supabase.select).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalled();
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when creating a lead', async () => {
      // Setup
      mockResponse.error = { message: 'Database error' };
      mockResponse.data = null;

      // Execute
      const result = await createLead({ 
        property_address: 'Test',
        property_city: 'City',
        property_state: 'State',
        property_zip: '12345'
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should handle errors when retrieving leads', async () => {
      // Setup
      mockResponse.error = { message: 'Database error' };
      mockResponse.data = null;

      // Execute
      const result = await getLeads();

      // Assert
      expect(result).toEqual([]);
    });
  });
});