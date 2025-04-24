import { generateLoi } from '../../actions/generateLoi.action';
import * as docx from 'docx';
import fs from 'fs';
import path from 'path';

// Mock the docx library
jest.mock('docx', () => ({
  Document: jest.fn().mockImplementation(() => ({
    sections: [],
    addSection: jest.fn(),
  })),
  Packer: {
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('test document')),
  },
  AlignmentType: {
    CENTER: 'center',
    LEFT: 'left',
  },
  HeadingLevel: {
    HEADING_1: 'heading1',
  },
  ImageRun: jest.fn(),
  Paragraph: jest.fn(),
  TextRun: jest.fn(),
}));

// Mock fs
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('test image')),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  dirname: jest.fn().mockReturnValue('/mock/dir'),
}));

describe('generateLoi action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a LOI document and return the file path', async () => {
    // Setup
    const mockParams = {
      propertyAddress: '123 Test St',
      propertyCity: 'Test City',
      propertyState: 'TX',
      propertyZip: '12345',
      recipientName: 'John Doe',
      offerPrice: 100000,
      earnestMoney: 5000,
      closingDate: '2025-05-01',
      companyLogoPath: '/logo.png',
    };

    const expectedPath = '/public/documents/123-Test-St-LOI.docx';
    
    // Mock implementation for this test
    (path.join as jest.Mock).mockImplementation(() => expectedPath);
    
    // Execute
    const result = await generateLoi(mockParams);
    
    // Assert
    expect(result).toMatch(/documents\/123-Test-St-LOI\.docx$/);
    expect(docx.Document).toHaveBeenCalled();
    expect(docx.Packer.toBuffer).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('LOI.docx'),
      expect.anything()
    );
  });

  it('should handle missing company logo', async () => {
    // Setup
    const mockParams = {
      propertyAddress: '123 Test St',
      propertyCity: 'Test City',
      propertyState: 'TX',
      propertyZip: '12345',
      recipientName: 'John Doe',
      offerPrice: 100000,
      earnestMoney: 5000,
      closingDate: '2025-05-01',
    };
    
    // Mock fs.existsSync to return false for logo path
    (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
    
    // Execute
    const result = await generateLoi(mockParams);
    
    // Assert
    expect(result).toBeTruthy();
    // Should still create a document even without the logo
    expect(docx.Document).toHaveBeenCalled();
    expect(docx.Packer.toBuffer).toHaveBeenCalled();
  });
});