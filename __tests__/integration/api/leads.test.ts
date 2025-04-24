import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/leads/route';
import * as database from '@/lib/database';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getLeads: jest.fn(),
  insertLead: jest.fn(),
  updateLead: jest.fn(),
  deleteLead: jest.fn(),
}));

// Mock Next.js Response
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      json: jest.fn().mockImplementation((body, init) => ({
        body,
        status: init?.status || 200,
        headers: init?.headers || {},
      })),
    },
  };
});

// Helper function to create mock NextRequest
const createMockRequest = (method: string, body?: any, query?: Record<string, string>) => {
  const url = new URL('https://example.com/api/leads');
  
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  
  return {
    method,
    url: url.toString(),
    json: jest.fn().mockResolvedValue(body),
    nextUrl: url,
  } as unknown as NextRequest;
};

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
      
      // Create mocked request
      const req = createMockRequest('GET');
      
      // Call the API endpoint handler
      const response = await GET(req);
      
      // Assert the response
      expect(database.getLeads).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockLeads);
    });
    
    it('should handle errors', async () => {
      // Mock a database error
      (database.getLeads as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Create mocked request
      const req = createMockRequest('GET');
      
      // Call the API endpoint handler
      const response = await GET(req);
      
      // Assert the response
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