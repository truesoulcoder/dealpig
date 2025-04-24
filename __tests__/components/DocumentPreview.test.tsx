import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DocumentPreview from '../../components/home/documentPreview';
import { getTemplates } from '../../lib/database';

// Mock database
jest.mock('../../lib/database', () => ({
  getTemplates: jest.fn(),
}));

// Mock TipTap
jest.mock('@tiptap/react', () => {
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

// Mock TipTap extensions
jest.mock('@tiptap/starter-kit', () => ({}));
jest.mock('@tiptap/extension-underline', () => ({}));
jest.mock('@tiptap/extension-text-align', () => ({
  configure: jest.fn().mockReturnValue({}),
}));
jest.mock('@tiptap/extension-link', () => ({}));
jest.mock('@tiptap/extension-image', () => ({}));
jest.mock('@tiptap/extension-color', () => ({}));
jest.mock('@tiptap/extension-text-style', () => ({}));

// Mock HeroUI components
jest.mock('@heroui/button', () => ({
  Button: ({ children, onClick, isLoading, 'data-testid': dataTestId }) => (
    <button onClick={onClick} data-testid={dataTestId}>
      {isLoading ? 'Generating...' : children}
    </button>
  ),
}));

jest.mock('@heroui/card', () => ({
  Card: ({ children, 'data-testid': dataTestId }) => <div data-testid={dataTestId}>{children}</div>,
  CardHeader: ({ children }) => <div>{children}</div>,
  CardBody: ({ children }) => <div>{children}</div>,
}));

jest.mock('@heroui/select', () => ({
  Select: ({ children, onChange, value, 'aria-label': ariaLabel, 'data-testid': dataTestId }) => (
    <div>
      <label>{ariaLabel}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        aria-label={ariaLabel}
        data-testid={dataTestId}
      >
        {children}
      </select>
    </div>
  ),
  SelectItem: ({ children, value }) => <option value={value}>{children}</option>,
}));

jest.mock('@heroui/tabs', () => ({
  Tabs: ({ children, onValueChange, 'data-testid': dataTestId }) => (
    <div data-testid={dataTestId}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          onClick: () => onValueChange && onValueChange(child.props.value) 
        })
      )}
    </div>
  ),
  Tab: ({ title, value, onClick, 'data-testid': dataTestId }) => (
    <button 
      onClick={() => onClick && onClick(value)} 
      data-testid={dataTestId}
    >
      {title}
    </button>
  ),
}));

jest.mock('@heroui/spinner', () => ({
  Spinner: ({ 'aria-label': ariaLabel }) => (
    <div aria-label={ariaLabel}>Loading...</div>
  ),
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
  
  const mockTemplates = [
    { id: 'template1', name: 'Template 1', content: '<p>Template 1 content</p>', type: 'document' },
    { id: 'template2', name: 'Template 2', content: '<p>Template 2 content</p>', type: 'document' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the templates returned from the database
    (getTemplates as jest.Mock).mockResolvedValue(mockTemplates);
  });

  it('renders the document preview component', async () => {
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={mockOnApprove}
        />
      );
    });
    
    // Wait for templates to load
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalledWith('document');
      expect(screen.getByTestId('document-preview-title')).toBeInTheDocument();
    });
  });

  it('handles template selection', async () => {
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={mockOnApprove}
        />
      );
    });
    
    // Wait for templates to load and spinner to disappear
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalledWith('document');
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Find and select a template
    const templateSelector = screen.getByTestId('template-selector');
    
    await act(async () => {
      fireEvent.change(templateSelector, { target: { value: 'template2' } });
    });
  });

  it('calls onApprove when approve button is clicked', async () => {
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={mockOnApprove}
        />
      );
    });
    
    // Wait for templates to load
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalledWith('document');
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Find and click the approve button
    const approveButton = screen.getByTestId('approve-button');
    
    await act(async () => {
      fireEvent.click(approveButton);
    });
    
    // Check if onApprove was called
    expect(mockOnApprove).toHaveBeenCalledWith('<p>Document content</p>', 'template1');
  });

  it('toggles between edit and preview modes', async () => {
    await act(async () => {
      render(
        <DocumentPreview 
          documentData={mockDocumentData}
          onApprove={mockOnApprove}
        />
      );
    });
    
    // Wait for templates to load and spinner to disappear
    await waitFor(() => {
      expect(getTemplates).toHaveBeenCalledWith('document');
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Find edit and preview tabs
    const previewTab = screen.getByTestId('preview-tab');
    const editTab = screen.getByTestId('edit-tab');
    
    // By default it should be in edit mode
    expect(screen.getByTestId('editor-container')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-container')).not.toBeInTheDocument();
    
    // Click preview tab
    await act(async () => {
      fireEvent.click(previewTab);
    });
    
    // Now the preview container should be visible and editor container hidden
    await waitFor(() => {
      expect(screen.getByTestId('preview-container')).toBeInTheDocument();
      expect(screen.queryByTestId('editor-container')).not.toBeInTheDocument();
    });
    
    // Click edit tab again
    await act(async () => {
      fireEvent.click(editTab);
    });
    
    // Now editor should be visible again
    await waitFor(() => {
      expect(screen.getByTestId('editor-container')).toBeInTheDocument();
      expect(screen.queryByTestId('preview-container')).not.toBeInTheDocument();
    });
  });
});