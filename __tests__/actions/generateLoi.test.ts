import { generateLoi } from '../../actions/generateLoi.action';
import * as docx from 'docx';
import fs from 'fs';
import path from 'path';

// Mock the docx library
jest.mock('docx', () => {
  return {
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
      RIGHT: 'right',
    },
    HeadingLevel: {
      HEADING_1: 'heading1',
    },
    Header: jest.fn().mockImplementation(() => ({
      children: [],
    })),
    ImageRun: jest.fn().mockImplementation(() => ({})),
    Paragraph: jest.fn().mockImplementation(() => ({})),
    TextRun: jest.fn().mockImplementation(() => ({})),
  };
});

// Mock fs
jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('test image')),
  writeFileSync: jest.fn().mockImplementation(() => undefined),
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

    const mockTimestamp = 1234567890;
    jest.spyOn(Date, 'now').mockImplementation(() => mockTimestamp);
    const expectedPath = `/generated-loi-${mockTimestamp}.docx`;
    
    // Execute
    const result = await generateLoi(mockParams);
    
    // Assert
    expect(result).toBe(expectedPath);
    expect(docx.Document).toHaveBeenCalled();
    expect(docx.Packer.toBuffer).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('generated-loi'),
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
    
    // Mock readFileSync to throw error for logo path
    (fs.readFileSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('File not found');
    });
    
    // Execute
    const result = await generateLoi(mockParams);
    
    // Assert
    expect(result).toBeTruthy();
    // Should still create a document even without the logo
    expect(docx.Document).toHaveBeenCalled();
    expect(docx.Packer.toBuffer).toHaveBeenCalled();
  });
});