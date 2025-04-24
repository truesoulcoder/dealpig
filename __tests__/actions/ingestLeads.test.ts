import { ingestLeadsFromCsv, uploadCsv } from '../../actions/ingestLeads.action';
import * as database from '../../lib/database';

// Mock the database operations
jest.mock('../../lib/database', () => ({
  createLead: jest.fn().mockResolvedValue({ id: 'mock-lead-id' }),
  createContact: jest.fn().mockResolvedValue({ id: 'mock-contact-id' }),
  createLeadSource: jest.fn().mockResolvedValue({ id: 'mock-source-id' }),
}));

describe('ingestLeads actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ingestLeadsFromCsv', () => {
    it('should parse CSV and insert leads with contacts', async () => {
      // Setup
      const csvContent = `property_address,property_city,property_state,property_zip,wholesale_value,market_value,days_on_market,mls_status,contact_name,contact_email
123 Main St,Test City,TX,12345,250000,300000,30,Active,John Doe,john@example.com
456 Elm St,Another City,TX,67890,350000,400000,45,Pending,Jane Smith,jane@example.com`;
      
      const fileName = 'test.csv';

      // Execute
      const result = await ingestLeadsFromCsv(csvContent, fileName);

      // Assert
      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.insertedLeads).toBe(2);
      expect(result.insertedContacts).toBe(2);
      expect(database.createLeadSource).toHaveBeenCalledWith(
        expect.objectContaining({
          file_name: 'test.csv',
          record_count: 2,
        })
      );
      expect(database.createLead).toHaveBeenCalledTimes(2);
      expect(database.createContact).toHaveBeenCalledTimes(2);
    });

    it('should handle empty CSV content', async () => {
      // Setup
      const csvContent = 'property_address,property_city,property_state,property_zip';
      const fileName = 'empty.csv';

      // Execute
      const result = await ingestLeadsFromCsv(csvContent, fileName);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('No data found');
    });

    it('should handle incomplete CSV rows', async () => {
      // Setup
      const csvContent = `property_address,property_city,property_state,property_zip
123 Main St,Test City,TX,12345
456 Elm St,,,`;
      
      const fileName = 'incomplete.csv';

      // Execute
      const result = await ingestLeadsFromCsv(csvContent, fileName);

      // Assert
      expect(result.success).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.insertedLeads).toBe(1); // Only one valid lead
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required property information');
    });

    it('should handle database errors', async () => {
      // Setup
      const csvContent = `property_address,property_city,property_state,property_zip
123 Main St,Test City,TX,12345`;
      
      const fileName = 'error.csv';

      // Mock a database error
      (database.createLead as jest.Mock).mockRejectedValueOnce(new Error('Database error'));

      // Execute
      const result = await ingestLeadsFromCsv(csvContent, fileName);

      // Assert
      expect(result.success).toBe(false);
      expect(result.insertedLeads).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('uploadCsv', () => {
    it('should process uploaded CSV file', async () => {
      // Setup mock FormData
      const mockFile = new File(['test'], 'test.csv', { type: 'text/csv' });
      const mockFormData = new FormData();
      mockFormData.append('file', mockFile);
      
      // Mock file.text() to return CSV content
      const mockText = jest.fn().mockResolvedValue('property_address,property_city,property_state,property_zip\n123 Main St,Test City,TX,12345');
      Object.defineProperty(File.prototype, 'text', {
        value: mockText,
        configurable: true,
      });

      // Execute
      const result = await uploadCsv(mockFormData);

      // Assert
      expect(result.success).toBe(true);
      expect(mockText).toHaveBeenCalled();
    });

    it('should handle missing file in form data', async () => {
      // Setup
      const mockFormData = new FormData();

      // Execute
      const result = await uploadCsv(mockFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('No file uploaded');
    });

    it('should validate file type', async () => {
      // Setup
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockFormData = new FormData();
      mockFormData.append('file', mockFile);

      // Execute
      const result = await uploadCsv(mockFormData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid file type');
    });
  });
});