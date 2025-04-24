import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DocumentPreview from '@/components/home/documentPreview';
import * as database from '@/lib/database';
import { trpc } from '@/app/providers/trpc-provider';

// Mock necessary dependencies
jest.mock('@/lib/database', () => ({
  getTemplates: jest.fn(),
  saveTemplate: jest.fn(),
}));

// Mock TipTap
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn().mockReturnValue({
    commands: {
      setContent: jest.fn(),
    },
    getHTML: jest.fn().mockReturnValue('<p>Document content</p>'),
    chain: jest.fn().mockReturnValue({
      focus: jest.fn().mockReturnValue({
        toggleHeading: jest.fn().mockReturnValue({
          run: jest.fn(),
        }),
        toggleBold: jest.fn().mockReturnValue({
          run: jest.fn(),
        }),
        setTextAlign: jest.fn().mockReturnValue({
          run: jest.fn(),
        }),
      }),
    }),
  }),
  EditorContent: ({ editor }) => <div data-testid="editor-content">Editor Content</div>,
}));

// Mock the trpc client
jest.mock('@/app/providers/trpc-provider', () => ({
  trpc: {
    documents: {
      getTemplates: {
        useQuery: jest.fn(),
      },
      saveTemplate: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Sample document data
const mockDocumentData = {
  propertyAddress: '123 Test Street',
  propertyCity: 'Test City',
  propertyState: 'TS',
  propertyZip: '12345',
  recipientName: 'John Doe',
  offerPrice: 200000,
  earnestMoney: 5000,
  closingDate: '2025-06-15',
  companyName: 'Test Company',
  senderName: 'Jane Smith',
  senderTitle: 'Acquisitions Manager',
  senderContact: 'jane@example.com'
};

// Sample templates
const mockTemplates = [
  {
    id: 'template1',
    name: 'Basic LOI',
    description: 'A simple letter of intent',
    type: 'document',
    content: '<p>Basic template content with {{property_address}}</p>',
  },
  {
    id: 'template2',
    name: 'Detailed LOI',
    description: 'A more detailed letter of intent',
    type: 'document',
    content: '<p>Detailed template with more variables {{offer_price}}</p>',
  },
];

describe('DocumentPreview State Management', () => {
  const onApproveMock = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup database mock
    (database.getTemplates as jest.Mock).mockResolvedValue(mockTemplates);
    
    // Setup trpc query mock
    (trpc.documents.getTemplates.useQuery as jest.Mock).mockReturnValue({
      data: mockTemplates,
      isLoading: false,
      error: null,
    });
    
    // Setup trpc mutation mock
    (trpc.documents.saveTemplate.useMutation as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
    });
  });
  
  it('should render the document preview correctly', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={onApproveMock}
      />
    );
    
    // Check for component's heading
    expect(screen.getByText('Document Preview')).toBeInTheDocument();
    
    // Check that template selector is rendered
    expect(screen.getByText('Template')).toBeInTheDocument();
    
    // Check for view mode toggle
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
    
    // Check that editor is rendered in edit mode
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    
    // Check for approve button
    expect(screen.getByRole('button', { name: /Approve & Generate Document/i })).toBeInTheDocument();
  });
  
  it('should load templates and set initial content', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={onApproveMock}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Basic LOI')).toBeInTheDocument();
      expect(screen.getByText('Detailed LOI')).toBeInTheDocument();
    });
  });
  
  it('should switch between edit and preview modes', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={onApproveMock}
      />
    );
    
    // Initially should be in edit mode with editor visible
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    
    // Switch to preview mode
    const previewTab = screen.getByText('Preview');
    fireEvent.click(previewTab);
    
    // Should now show the preview with the HTML content
    expect(screen.queryByTestId('editor-content')).not.toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument(); // Assumes the preview has role="article"
    
    // Switch back to edit mode
    const editTab = screen.getByText('Edit');
    fireEvent.click(editTab);
    
    // Should show the editor again
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
  });
  
  it('should change template when user selects a different one', async () => {
    // Setup the mock implementation to track template changes
    const setContentMock = jest.fn();
    jest.mock('@tiptap/react', () => ({
      useEditor: jest.fn().mockReturnValue({
        commands: {
          setContent: setContentMock,
        },
        getHTML: jest.fn().mockReturnValue('<p>Document content</p>'),
      }),
      EditorContent: ({ editor }) => <div data-testid="editor-content">Editor Content</div>,
    }));
    
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={onApproveMock}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Basic LOI')).toBeInTheDocument();
    });
    
    // Select a different template
    const templateSelect = screen.getByLabelText(/Template/i);
    fireEvent.change(templateSelect, { target: { value: 'template2' } });
    
    // Verify the template content was updated
    await waitFor(() => {
      // This might need adjustment based on how your component actually works
      expect(setContentMock).toHaveBeenCalled();
    });
  });
  
  it('should generate document on approve', async () => {
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={onApproveMock}
      />
    );
    
    // Click the approve button
    const approveButton = screen.getByRole('button', { name: /Approve & Generate Document/i });
    fireEvent.click(approveButton);
    
    // Verify the onApprove callback was called with the document HTML and template
    await waitFor(() => {
      expect(onApproveMock).toHaveBeenCalledWith(
        '<p>Document content</p>', // This is what our mock getHTML returns
        expect.any(String) // The template ID
      );
    });
  });
  
  it('should handle loading state while templates are being fetched', async () => {
    // Set loading state
    (trpc.documents.getTemplates.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });
    
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={onApproveMock}
      />
    );
    
    // Should show loading indicator
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    
    // Should not show template content yet
    expect(screen.queryByTestId('editor-content')).not.toBeInTheDocument();
  });
  
  it('should handle errors when templates fail to load', async () => {
    // Set error state
    (trpc.documents.getTemplates.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch templates'),
    });
    
    render(
      <DocumentPreview 
        documentData={mockDocumentData}
        onApprove={onApproveMock}
      />
    );
    
    // Should show error message or fallback to default template
    // This depends on how your component handles errors
    await waitFor(() => {
      expect(screen.getByText(/Letter of Intent/i)).toBeInTheDocument();
    });
  });
});