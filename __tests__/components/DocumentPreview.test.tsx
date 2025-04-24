import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DocumentPreview from '../../components/home/documentPreview';
import { getTemplates } from '../../lib/database';

// Mock database
jest.mock('../../lib/database', () => ({
  getTemplates: jest.fn(),
}));

// Mock draft-js and related libraries
jest.mock('draft-js', () => ({
  EditorState: {
    createEmpty: jest.fn(() => ({})),
    createWithContent: jest.fn(() => ({})),
  },
  ContentState: {
    createFromBlockArray: jest.fn(() => ({})),
  },
  convertToRaw: jest.fn(() => ({})),
}));

jest.mock('draftjs-to-html', () => jest.fn(() => '<p>Mocked HTML content</p>'));
jest.mock('html-to-draftjs', () => jest.fn(() => ({ contentBlocks: [] })));
jest.mock('react-draft-wysiwyg', () => ({
  Editor: () => <div data-testid="mock-editor">Mock Editor</div>,
}));

describe('DocumentPreview component', () => {
  // Set up mock data
  const mockDocumentData = {
    propertyAddress: '123 Test St',
    propertyCity: 'Test City',
    propertyState: 'TX',
    propertyZip: '12345',
    recipientName: 'John Doe',
    offerPrice: 250000,
    earnestMoney: 5000,
    closingDate: '2025-05-01',
    companyName: 'Test Company',
    senderName: 'Jane Smith',
    senderTitle: 'Acquisitions Manager',
    senderContact: 'jane@example.com',
  };

  const mockOnApprove = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the templates returned from the database
    (getTemplates as jest.Mock).mockResolvedValue([
      { id: 'template1', name: 'Template 1', content: '<p>Template 1 content</p>' },
      { id: 'template2', name: 'Template 2', content: '<p>Template 2 content</p>' },
    ]);
  });

  it('renders the document preview component', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={mockOnApprove}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalledWith('document');
    });
    
    // Check if component renders properly
    expect(screen.getByText('Document Preview')).toBeInTheDocument();
    expect(screen.getByText('Mock Editor')).toBeInTheDocument();
  });

  it('handles template selection', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={mockOnApprove}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalled();
    });
    
    // Find and select a template (implementation will depend on your UI)
    const templateSelect = screen.getByLabelText('Template');
    fireEvent.change(templateSelect, { target: { value: 'template2' } });
    
    // Check if template selection works
    expect(templateSelect).toHaveValue('template2');
  });

  it('calls onApprove when approve button is clicked', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={mockOnApprove}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalled();
    });
    
    // Click the approve button
    const approveButton = screen.getByText('Approve & Generate Document');
    fireEvent.click(approveButton);
    
    // Check if onApprove was called with correct parameters
    expect(mockOnApprove).toHaveBeenCalledWith(
      '<p>Mocked HTML content</p>',
      expect.any(String)
    );
  });

  it('toggles between edit and preview modes', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={mockOnApprove}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalled();
    });
    
    // Initially in edit mode, the editor should be visible
    expect(screen.getByTestId('mock-editor')).toBeInTheDocument();
    
    // Click on preview tab
    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);
    
    // Check if preview mode is active
    await waitFor(() => {
      const previewDiv = screen.getByText('Mocked HTML content');
      expect(previewDiv).toBeInTheDocument();
    });
  });
});