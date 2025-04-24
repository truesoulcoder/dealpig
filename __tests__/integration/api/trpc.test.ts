import { inferProcedureInput } from '@trpc/server';
import { createInnerTRPCContext } from '@/server/trpc/context';
import { appRouter, AppRouter } from '@/server/trpc/root-router';
import * as database from '@/lib/database';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getLeads: jest.fn(),
  insertLead: jest.fn(),
  updateLead: jest.fn(),
  deleteLead: jest.fn(),
  getTemplates: jest.fn(),
  saveTemplate: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  getSupabase: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => ({
        data: {
          session: {
            user: { id: 'test-user-id', email: 'test@example.com' }
          }
        }
      }))
    }
  }))
}));

describe('tRPC API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('leads.getLeads', () => {
    it('should return all leads', async () => {
      // Mock data
      const mockLeads = [
        { id: '1', property_address: '123 Test St', owner_name: 'John Doe' },
        { id: '2', property_address: '456 Example Ave', owner_name: 'Jane Smith' },
      ];
      
      // Mock the database response
      (database.getLeads as jest.Mock).mockResolvedValue(mockLeads);
      
      // Create a tRPC caller
      const ctx = await createInnerTRPCContext({ req: {} as any, res: {} as any });
      const caller = appRouter.createCaller(ctx);
      
      // Call the tRPC procedure
      const result = await caller.leads.getLeads();
      
      // Assert the response
      expect(database.getLeads).toHaveBeenCalled();
      expect(result).toEqual(mockLeads);
    });
    
    it('should filter leads by status when provided', async () => {
      // Mock data with status filtering
      const mockLeads = [
        { id: '1', property_address: '123 Test St', status: 'contacted' },
      ];
      
      // Mock the database response
      (database.getLeads as jest.Mock).mockResolvedValue(mockLeads);
      
      // Create a tRPC caller
      const ctx = await createInnerTRPCContext({ req: {} as any, res: {} as any });
      const caller = appRouter.createCaller(ctx);
      
      // Input type for the procedure
      type Input = inferProcedureInput<AppRouter['leads']['getLeads']>;
      const input: Input = { status: 'contacted' };
      
      // Call the tRPC procedure with input
      const result = await caller.leads.getLeads(input);
      
      // Assert the response
      expect(database.getLeads).toHaveBeenCalledWith('contacted', undefined, 100, 0);
      expect(result).toEqual(mockLeads);
    });
  });

  describe('leads.createLead', () => {
    it('should create a new lead', async () => {
      // Mock data
      const newLead = {
        property_address: '789 New St',
        property_city: 'New City',
        property_state: 'NS',
        property_zip: '12345',
        owner_name: 'New Owner',
        owner_email: 'owner@example.com',
        offer_price: 250000,
        earnest_money: 5000,
        closing_date: '2025-06-01',
      };
      
      const createdLead = { ...newLead, id: '3' };
      
      // Mock the database response
      (database.insertLead as jest.Mock).mockResolvedValue(createdLead);
      
      // Create a tRPC caller
      const ctx = await createInnerTRPCContext({ req: {} as any, res: {} as any });
      const caller = appRouter.createCaller(ctx);
      
      // Call the tRPC procedure
      const result = await caller.leads.createLead(newLead);
      
      // Assert the response
      expect(database.insertLead).toHaveBeenCalledWith(newLead);
      expect(result).toEqual(createdLead);
    });
  });

  describe('documents.getTemplates', () => {
    it('should return all document templates', async () => {
      // Mock data
      const mockTemplates = [
        { 
          id: '1', 
          name: 'Letter of Intent', 
          type: 'document', 
          content: '<p>Template content</p>' 
        },
        { 
          id: '2', 
          name: 'Email Template', 
          type: 'email', 
          content: '<p>Email content</p>' 
        },
      ];
      
      // Mock the database response
      (database.getTemplates as jest.Mock).mockResolvedValue(mockTemplates);
      
      // Create a tRPC caller
      const ctx = await createInnerTRPCContext({ req: {} as any, res: {} as any });
      const caller = appRouter.createCaller(ctx);
      
      // Call the tRPC procedure
      const result = await caller.documents.getTemplates('document');
      
      // Assert the response
      expect(database.getTemplates).toHaveBeenCalledWith('document');
      expect(result).toEqual(mockTemplates);
    });
  });
});