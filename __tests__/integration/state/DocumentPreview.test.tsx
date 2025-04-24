import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DocumentPreview from '@/components/home/documentPreview';
import * as database from '@/lib/database';
import { trpc } from '@/app/providers/trpc-provider';

// Mock necessary dependencies
jest.mock('@/lib/database', () => ({
  getTemplates: jest.fn(),
  saveTemplate: jest.fn(),
}));

// Clean the mock between tests to prevent interference
afterEach(() => {
  jest.resetModules();
});

// Mock TipTap
jest.mock('@tiptap/react', () => {
  // Create a consistent editor mock that persists throughout tests
  const editorMock = {
    commands: {
      setContent: jest.fn(),
    },
    getHTML: jest.fn().mockReturnValue('<p>Document content</p>'),
    isActive: jest.fn().mockReturnValue(false),
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
  };
  
  return {
    useEditor: jest.fn().mockReturnValue(editorMock),
    EditorContent: ({ editor }) => <div data-testid="editor-content">Editor Content</div>,
  };
});

// Mock heroui components
jest.mock('@heroui/card', () => ({
  Card: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div {...props}>{children}</div>,
  CardBody: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

jest.mock('@heroui/button', () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

jest.mock('@heroui/select', () => ({
  Select: ({ children, onChange, label, ...props }) => (
    <div>
      <label htmlFor="select">{label}</label>
      <select 
        id="select" 
        onChange={(e) => onChange(e.target.value)} 
        aria-label={label || props['aria-label']}
        {...props}
      >
        {children}
      </select>
    </div>
  ),
  SelectItem: ({ children, value, ...props }) => (
    <option value={value} {...props}>{children}</option>
  ),
}));

jest.mock('@heroui/tabs', () => ({
  Tabs: ({ children, onValueChange, ...props }) => (
    <div {...props}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          onClick: () => onValueChange && onValueChange(child.props.value)
        })
      )}
    </div>
  ),
  Tab: ({ title, value, onClick, ...props }) => (
    <button onClick={() => onClick && onClick(value)} {...props}>{title}</button>
  ),
}));

jest.mock('@heroui/spinner', () => ({
  Spinner: ({ 'aria-label': ariaLabel, ...props }) => (
    <div aria-label={ariaLabel} {...props}>Loading...</div>
  ),
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
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={onApproveMock}
        />
      );
    });
    
    // Check for the card container with data-testid
    await waitFor(() => {
      expect(screen.getByTestId('document-preview-card')).toBeInTheDocument();
    });
    
    // Check for the title
    expect(screen.getByTestId('document-preview-title')).toHaveTextContent('Document Preview');
    
    // Check for template label
    expect(screen.getByLabelText(/Template selector/i)).toBeInTheDocument();
    
    // Check that editor is rendered in edit mode
    expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    
    // Check for approve button
    expect(screen.getByTestId('approve-button')).toBeInTheDocument();
  });
  
  it('should load templates and set initial content', async () => {
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={onApproveMock}
        />
      );
    });
    
    // Wait for templates to load and check options
    await waitFor(() => {
      expect(screen.getByText('Default Template')).toBeInTheDocument();
    });
    
    // Check for template options
    const select = screen.getByLabelText(/Template selector/i);
    expect(select).toBeInTheDocument();
  });
  
  it('should switch between edit and preview modes', async () => {
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={onApproveMock}
        />
      );
    });
    
    // Check that editor is initially visible
    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
    
    // Get the mode tabs by testId instead of text
    const previewTab = screen.getByTestId('preview-tab');
    const editTab = screen.getByTestId('edit-tab');
    
    // Switch to preview mode
    await act(async () => {
      fireEvent.click(previewTab);
    });
    
    // Check editor content is not visible and preview is displayed
    await waitFor(() => {
      expect(screen.queryByTestId('editor-content')).not.toBeInTheDocument();
    });
    
    // Switch back to edit mode
    await act(async () => {
      fireEvent.click(editTab);
    });
    
    // Check editor content is visible again
    await waitFor(() => {
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });
  });
  
  it('should generate document on approve', async () => {
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={onApproveMock}
        />
      );
    });
    
    // Wait for the component to fully render
    await waitFor(() => {
      expect(screen.getByTestId('approve-button')).toBeInTheDocument();
    });
    
    // Click the approve button
    await act(async () => {
      fireEvent.click(screen.getByTestId('approve-button'));
    });
    
    // Verify the onApprove callback was called
    expect(onApproveMock).toHaveBeenCalled();
    expect(onApproveMock).toHaveBeenCalledWith(
      expect.any(String),  // HTML content
      expect.any(String)   // Template ID
    );
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
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
  
  it('should handle errors when templates fail to load', async () => {
    // Set error state
    (trpc.documents.getTemplates.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch templates'),
    });
    
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={onApproveMock}
        />
      );
    });
    
    // Test passes if the component handles the error without crashing
    // It should fallback to the default template
    await waitFor(() => {
      expect(screen.getByTestId('document-preview-card')).toBeInTheDocument();
    });
  });
});