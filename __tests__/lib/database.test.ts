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
  createTemplate,
  updateTemplate
} from '../../lib/database';
import { supabase } from '../../lib/supabaseClient';

// Mock the Supabase client
jest.mock('../../lib/supabaseClient', () => {
  const mockSupabase = {
    from: jest.fn(() => mockSupabase),
    select: jest.fn(() => mockSupabase),
    eq: jest.fn(() => mockSupabase),
    order: jest.fn(() => mockSupabase),
    insert: jest.fn(() => mockSupabase),
    update: jest.fn(() => mockSupabase),
    match: jest.fn(() => mockSupabase),
    single: jest.fn(() => mockSupabase),
    maybeSingle: jest.fn(() => mockSupabase),
    range: jest.fn(() => mockSupabase),
    limit: jest.fn(() => mockSupabase),
    delete: jest.fn(() => mockSupabase)
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
    
    // Configure the mock to return our mockResponse
    (supabase as any).from.mockImplementation(() => {
      return {
        ...supabase,
        select: jest.fn().mockImplementation(() => supabase),
        eq: jest.fn().mockImplementation(() => supabase),
        order: jest.fn().mockImplementation(() => supabase),
        insert: jest.fn().mockImplementation(() => supabase),
        update: jest.fn().mockImplementation(() => supabase),
        match: jest.fn().mockImplementation(() => supabase),
        single: jest.fn().mockImplementation(() => mockResponse),
        range: jest.fn().mockImplementation(() => supabase),
        limit: jest.fn().mockImplementation(() => supabase),
        delete: jest.fn().mockImplementation(() => mockResponse),
      };
    });
    
    // Make non-terminal methods return the mock itself for chaining
    (supabase as any).select.mockReturnThis();
    (supabase as any).eq.mockReturnThis();
    (supabase as any).order.mockReturnThis();
    (supabase as any).insert.mockReturnThis();
    (supabase as any).update.mockReturnThis();
    (supabase as any).match.mockReturnThis();
    (supabase as any).range.mockReturnThis();
    (supabase as any).limit.mockReturnThis();
    
    // Make terminal methods return the mockResponse
    (supabase as any).single.mockImplementation(() => mockResponse);
    (supabase as any).maybeSingle.mockImplementation(() => mockResponse);
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