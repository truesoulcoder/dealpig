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

// Create chainable mock functions
const createChainableMock = () => {
  const mock = jest.fn().mockReturnThis();
  mock.select = jest.fn().mockReturnThis();
  mock.eq = jest.fn().mockReturnThis();
  mock.order = jest.fn().mockReturnThis();
  mock.insert = jest.fn().mockReturnThis();
  mock.update = jest.fn().mockReturnThis();
  mock.delete = jest.fn().mockReturnThis();
  mock.range = jest.fn().mockReturnThis();
  mock.single = jest.fn().mockReturnThis();
  mock.then = jest.fn().mockResolvedValue({ data: [], error: null });
  return mock;
};

// Mock the Supabase client
jest.mock('../../lib/supabaseClient', () => {
  const chainableMock = createChainableMock();
  
  return {
    supabase: {
      from: jest.fn(() => chainableMock)
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

    // Reset chainable mock for each test
    const chainableMock = supabase.from();
    chainableMock.then.mockResolvedValue({ data: [], error: null });
    
    // Setup specific mocks based on table name
    supabase.from.mockImplementation((tableName) => {
      if (tableName === 'leads') {
        const mock = createChainableMock();
        mock.then.mockResolvedValue({ data: mockLeadData, error: null });
        return mock;
      } else if (tableName === 'contacts') {
        const mock = createChainableMock();
        mock.then.mockResolvedValue({ data: mockContactData, error: null });
        return mock;
      } else if (tableName === 'emails') {
        const mock = createChainableMock();
        mock.then.mockResolvedValue({ data: mockEmailData, error: null });
        return mock;
      } else if (tableName === 'templates') {
        const mock = createChainableMock();
        mock.then.mockResolvedValue({ data: mockTemplateData, error: null });
        return mock;
      }
      return createChainableMock();
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
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when creating a lead', async () => {
      // Setup 
      const errorMock = createChainableMock();
      errorMock.then.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      supabase.from.mockImplementation(() => errorMock);

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
      const errorMock = createChainableMock();
      errorMock.then.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      supabase.from.mockImplementation(() => errorMock);

      // Execute
      const result = await getLeads();

      // Assert
      expect(result).toEqual([]);
    });
  });
});