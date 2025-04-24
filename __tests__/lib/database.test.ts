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
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockReturnThis(),
    data: null,
    error: null,
  },
}));

describe('Database Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.from as jest.Mock).mockReturnThis();
    (supabase.select as jest.Mock).mockReturnThis();
    (supabase.eq as jest.Mock).mockReturnThis();
    (supabase.order as jest.Mock).mockReturnThis();
    (supabase.insert as jest.Mock).mockReturnThis();
    (supabase.update as jest.Mock).mockReturnThis();
    (supabase.match as jest.Mock).mockReturnThis();
    (supabase.single as jest.Mock).mockReturnThis();
    (supabase.maybeSingle as jest.Mock).mockReturnThis();
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
      supabase.data = mockReturnData;
      supabase.error = null;

      // Execute
      const result = await createLead(mockLead);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('leads');
      expect(supabase.insert).toHaveBeenCalledWith(mockLead);
      expect(result).toEqual(mockReturnData);
    });

    it('should get all leads', async () => {
      // Setup
      const mockLeads = [
        { id: 'lead1', property_address: '123 Test St' },
        { id: 'lead2', property_address: '456 Other St' },
      ];
      supabase.data = mockLeads;
      supabase.error = null;

      // Execute
      const result = await getLeads();

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('leads');
      expect(supabase.select).toHaveBeenCalledWith('*, contacts(*)');
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockLeads);
    });

    it('should get a lead by ID', async () => {
      // Setup
      const mockLead = { id: 'lead1', property_address: '123 Test St' };
      supabase.data = mockLead;
      supabase.error = null;

      // Execute
      const result = await getLeadById('lead1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('leads');
      expect(supabase.select).toHaveBeenCalledWith('*, contacts(*)');
      expect(supabase.eq).toHaveBeenCalledWith('id', 'lead1');
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
      supabase.data = mockReturnData;
      supabase.error = null;

      // Execute
      const result = await createContact(mockContact);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.insert).toHaveBeenCalledWith(mockContact);
      expect(result).toEqual(mockReturnData);
    });

    it('should get contacts by lead ID', async () => {
      // Setup
      const mockContacts = [
        { id: 'contact1', name: 'Test Contact 1', email: 'test1@example.com' },
        { id: 'contact2', name: 'Test Contact 2', email: 'test2@example.com' },
      ];
      supabase.data = mockContacts;
      supabase.error = null;

      // Execute
      const result = await getContactsByLeadId('lead1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('contacts');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('lead_id', 'lead1');
      expect(result).toEqual(mockContacts);
    });
  });

  describe('Emails Functions', () => {
    it('should create an email', async () => {
      // Setup
      const mockEmail = {
        lead_id: 'lead1',
        subject: 'Test Email',
        body: '<p>Test content</p>',
        status: 'sent',
        sent_at: new Date().toISOString(),
      };
      
      const mockReturnData = { ...mockEmail, id: 'test-email-id' };
      supabase.data = mockReturnData;
      supabase.error = null;

      // Execute
      const result = await createEmail(mockEmail);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('emails');
      expect(supabase.insert).toHaveBeenCalledWith(mockEmail);
      expect(result).toEqual(mockReturnData);
    });

    it('should update email status', async () => {
      // Setup
      const mockEmail = {
        id: 'email1',
        status: 'opened',
        opened_at: new Date().toISOString(),
      };
      
      supabase.data = mockEmail;
      supabase.error = null;

      // Execute
      const result = await updateEmailStatus('email1', 'opened');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('emails');
      expect(supabase.update).toHaveBeenCalledWith(expect.objectContaining({
        status: 'opened',
        opened_at: expect.any(String),
      }));
      expect(supabase.match).toHaveBeenCalledWith({ id: 'email1' });
      expect(result).toEqual(mockEmail);
    });

    it('should get emails by lead ID', async () => {
      // Setup
      const mockEmails = [
        { id: 'email1', subject: 'Email 1', status: 'sent' },
        { id: 'email2', subject: 'Email 2', status: 'opened' },
      ];
      supabase.data = mockEmails;
      supabase.error = null;

      // Execute
      const result = await getEmailsByLeadId('lead1');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('emails');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('lead_id', 'lead1');
      expect(supabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
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
      supabase.data = mockTemplates;
      supabase.error = null;

      // Execute
      const result = await getTemplates('document');

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('templates');
      expect(supabase.select).toHaveBeenCalledWith('*');
      expect(supabase.eq).toHaveBeenCalledWith('type', 'document');
      expect(result).toEqual(mockTemplates);
    });

    it('should create a template', async () => {
      // Setup
      const mockTemplate = {
        name: 'New Template',
        content: '<p>Template content</p>',
        type: 'email',
      };
      
      const mockReturnData = { ...mockTemplate, id: 'test-template-id' };
      supabase.data = mockReturnData;
      supabase.error = null;

      // Execute
      const result = await createTemplate(mockTemplate);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('templates');
      expect(supabase.insert).toHaveBeenCalledWith(mockTemplate);
      expect(result).toEqual(mockReturnData);
    });

    it('should update a template', async () => {
      // Setup
      const mockTemplate = {
        name: 'Updated Template',
        content: '<p>Updated content</p>',
      };
      
      const mockReturnData = { ...mockTemplate, id: 'template1' };
      supabase.data = mockReturnData;
      supabase.error = null;

      // Execute
      const result = await updateTemplate('template1', mockTemplate);

      // Assert
      expect(supabase.from).toHaveBeenCalledWith('templates');
      expect(supabase.update).toHaveBeenCalledWith(mockTemplate);
      expect(supabase.match).toHaveBeenCalledWith({ id: 'template1' });
      expect(result).toEqual(mockReturnData);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors when creating a lead', async () => {
      // Setup
      supabase.error = { message: 'Database error' };
      supabase.data = null;

      // Execute and Assert
      await expect(createLead({ property_address: 'Test' })).rejects.toThrow('Database error');
    });

    it('should handle errors when retrieving leads', async () => {
      // Setup
      supabase.error = { message: 'Database error' };
      supabase.data = null;

      // Execute and Assert
      await expect(getLeads()).rejects.toThrow('Database error');
    });
  });
});