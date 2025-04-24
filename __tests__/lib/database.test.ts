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
  // Create a proper mock with chainable methods
  const mockSelect = jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    order: jest.fn().mockReturnValue({
      range: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    eq: jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    or: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  });
  
  return {
    supabase: {
      from: jest.fn(() => ({
        select: mockSelect,
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      })),
    }
  };
});

describe('Database Functions', () => {
  let mockLeadData;
  let mockContactData;
  let mockEmailData;
  let mockTemplateData;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLeadData = [{ id: 'test-lead-id', property_address: '123 Test St' }];
    mockContactData = [{ id: 'test-contact-id', name: 'Test Contact' }];
    mockEmailData = [{ id: 'test-email-id', subject: 'Test Email' }];
    mockTemplateData = [{ id: 'test-template-id', name: 'Test Template' }];

    // Setup supabase mocks to return our test data
    const mockFrom = supabase.from as jest.Mock;

    // Mock for leads
    mockFrom.mockImplementation((tableName) => {
      if (tableName === 'leads') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockLeadData[0], error: null }),
            }),
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: mockLeadData, error: null }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: mockLeadData, error: null }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: mockLeadData, error: null }),
            }),
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        };
      } else if (tableName === 'contacts') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockContactData, error: null }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: mockContactData, error: null }),
          }),
        };
      } else if (tableName === 'emails') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockEmailData, error: null }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: mockEmailData, error: null }),
          }),
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({ data: mockEmailData, error: null }),
            }),
          }),
        };
      } else if (tableName === 'templates') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: mockTemplateData, error: null }),
            }),
            order: jest.fn().mockResolvedValue({ data: mockTemplateData, error: null }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };
    });
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
      mockLeadData = [mockReturnData]; // Supabase returns array for insert

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
      mockLeadData = mockLeads;

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
      mockLeadData = [mockLead];

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
      mockContactData = [mockReturnData]; // Supabase returns array for insert

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
      mockContactData = mockContacts;

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
      mockEmailData = [mockReturnData]; // Supabase returns array for insert

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
      
      mockEmailData = [mockEmail]; // Supabase returns array for update

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
      mockEmailData = mockEmails;

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
      mockTemplateData = mockTemplates;

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
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockImplementation((tableName) => {
        return {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
          }),
        };
      });

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
      const mockFrom = supabase.from as jest.Mock;
      mockFrom.mockImplementation((tableName) => {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
            }),
          }),
        };
      });

      // Execute
      const result = await getLeads();

      // Assert
      expect(result).toEqual([]);
    });
  });
});