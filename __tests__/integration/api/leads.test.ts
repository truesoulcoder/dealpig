import { createMocks } from 'node-mocks-http';
import { GET, POST, PUT, DELETE } from '@/app/api/leads/route';
import * as database from '@/lib/database';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getLeads: jest.fn(),
  insertLead: jest.fn(),
  updateLead: jest.fn(),
  deleteLead: jest.fn(),
}));

describe('Leads API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/leads', () => {
    it('should return all leads', async () => {
      // Mock data
      const mockLeads = [
        { id: '1', property_address: '123 Test St', owner_name: 'John Doe' },
        { id: '2', property_address: '456 Example Ave', owner_name: 'Jane Smith' },
      ];
      
      // Mock the database response
      (database.getLeads as jest.Mock).mockResolvedValue(mockLeads);
      
      // Create mocked request and response
      const { req, res } = createMocks({
        method: 'GET',
      });
      
      // Call the API endpoint handler
      await GET(req);
      
      // Assert the response
      expect(database.getLeads).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(mockLeads);
    });
    
    it('should handle errors', async () => {
      // Mock a database error
      (database.getLeads as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Create mocked request and response
      const { req, res } = createMocks({
        method: 'GET',
      });
      
      // Call the API endpoint handler
      await GET(req);
      
      // Assert the response
      expect(database.getLeads).toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toEqual({ error: 'Failed to fetch leads' });
    });
  });

  describe('POST /api/leads', () => {
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
      
      // Create mocked request and response
      const { req, res } = createMocks({
        method: 'POST',
        body: newLead,
      });
      
      // Call the API endpoint handler
      await POST(req);
      
      // Assert the response
      expect(database.insertLead).toHaveBeenCalledWith(newLead);
      expect(res._getStatusCode()).toBe(201);
      expect(JSON.parse(res._getData())).toEqual(createdLead);
    });
    
    it('should handle validation errors', async () => {
      // Create an invalid lead (missing required fields)
      const invalidLead = {
        property_address: '789 New St',
        // Missing other required fields
      };
      
      // Create mocked request and response
      const { req, res } = createMocks({
        method: 'POST',
        body: invalidLead,
      });
      
      // Call the API endpoint handler
      await POST(req);
      
      // Assert the response
      expect(database.insertLead).not.toHaveBeenCalled();
      expect(res._getStatusCode()).toBe(400);
      // Validation error message will depend on your validation logic
      expect(JSON.parse(res._getData())).toHaveProperty('error');
    });
  });

  describe('PUT /api/leads/:id', () => {
    it('should update an existing lead', async () => {
      // Mock data
      const leadId = '123';
      const updatedData = {
        property_address: '123 Updated St',
        status: 'contacted',
      };
      
      const updatedLead = { id: leadId, ...updatedData };
      
      // Mock the database response
      (database.updateLead as jest.Mock).mockResolvedValue(updatedLead);
      
      // Create mocked request and response
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: leadId },
        body: updatedData,
      });
      
      // Call the API endpoint handler
      await PUT(req);
      
      // Assert the response
      expect(database.updateLead).toHaveBeenCalledWith(leadId, updatedData);
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual(updatedLead);
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('should delete a lead', async () => {
      // Mock data
      const leadId = '123';
      
      // Mock the database response
      (database.deleteLead as jest.Mock).mockResolvedValue({ success: true });
      
      // Create mocked request and response
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: leadId },
      });
      
      // Call the API endpoint handler
      await DELETE(req);
      
      // Assert the response
      expect(database.deleteLead).toHaveBeenCalledWith(leadId);
      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({ success: true, id: leadId });
    });
  });
});