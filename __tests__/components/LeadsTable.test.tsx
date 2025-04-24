import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LeadsTable from '../../components/table/leadsTable';
import { getLeads, getEmailsByLeadId } from '../../lib/database';

// Mock database functions
jest.mock('../../lib/database', () => ({
  getLeads: jest.fn(),
  getEmailsByLeadId: jest.fn()
}));

// Mock HeroUI components and icons
jest.mock('@heroui/react', () => ({
  Button: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
  Table: ({ children }) => <table>{children}</table>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableColumn: ({ children }) => <th>{children}</th>,
  TableRow: ({ children }) => <tr>{children}</tr>,
  TableCell: ({ children }) => <td>{children}</td>,
  Tooltip: ({ children, content }) => <div title={content}>{children}</div>,
  Pagination: () => <div>Pagination</div>,
  Input: ({ placeholder, onChange }) => <input placeholder={placeholder} onChange={onChange} />,
  Dropdown: ({ children }) => <div>{children}</div>,
  DropdownTrigger: ({ children }) => <div>{children}</div>,
  DropdownMenu: ({ children }) => <div>{children}</div>,
  DropdownItem: ({ children, key, onClick }) => <div key={key} onClick={onClick}>{children}</div>,
  Card: ({ children }) => <div>{children}</div>,
  CardBody: ({ children }) => <div>{children}</div>,
  useDisclosure: () => ({ isOpen: false, onOpen: jest.fn(), onClose: jest.fn() }),
  Modal: ({ children }) => <div>{children}</div>,
  ModalContent: ({ children }) => <div>{children}</div>,
  ModalHeader: ({ children }) => <div>{children}</div>,
  ModalBody: ({ children }) => <div>{children}</div>,
  ModalFooter: ({ children }) => <div>{children}</div>,
  Progress: () => <div>Progress Bar</div>,
}));

// Mock @heroui/react/outline icons
jest.mock('@heroui/react/outline', () => ({
  SearchIcon: () => <svg data-testid="search-icon" />,
  FilterIcon: () => <svg data-testid="filter-icon" />,
  DotsVerticalIcon: () => <svg data-testid="dots-icon" />,
  TrashIcon: () => <svg data-testid="trash-icon" />,
  PencilIcon: () => <svg data-testid="pencil-icon" />,
  MailIcon: () => <svg data-testid="mail-icon" />,
  DocumentIcon: () => <svg data-testid="document-icon" />,
  PhoneIcon: () => <svg data-testid="phone-icon" />,
  ChevronLeftIcon: () => <svg data-testid="chevron-left-icon" />,
  ChevronRightIcon: () => <svg data-testid="chevron-right-icon" />,
}));

// Mock window.location
const mockLocationAssign = jest.fn();
Object.defineProperty(window, 'location', {
  value: { href: jest.fn() },
  writable: true
});

describe('LeadsTable component', () => {
  // Sample lead data
  const mockLeads = [
    {
      id: 'lead1',
      property_address: '123 Main St',
      property_city: 'Austin',
      property_state: 'TX',
      property_zip: '78701',
      status: 'new',
      created_at: '2025-04-01T12:00:00Z',
      contacts: [
        { id: 'contact1', name: 'John Doe', email: 'john@example.com', is_primary: true }
      ]
    },
    {
      id: 'lead2',
      property_address: '456 Elm St',
      property_city: 'Dallas',
      property_state: 'TX',
      property_zip: '75001',
      status: 'contacted',
      created_at: '2025-04-02T12:00:00Z',
      contacts: [
        { id: 'contact2', name: 'Jane Smith', email: 'jane@example.com', is_primary: true }
      ]
    }
  ];

  // Sample email data
  const mockEmails = [
    {
      id: 'email1',
      subject: 'Property Offer',
      status: 'sent',
      sent_at: '2025-04-03T12:00:00Z',
      created_at: '2025-04-03T12:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock database responses
    (getLeads as jest.Mock).mockResolvedValue(mockLeads);
    (getEmailsByLeadId as jest.Mock).mockResolvedValue(mockEmails);

    // Reset location mock
    window.location.href = '';
  });

  it('renders the leads table with data', async () => {
    render(<LeadsTable />);

    // Check for loading state
    expect(screen.getByText('Loading leads...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(getLeads).toHaveBeenCalled();
    });

    // Check if lead data is displayed
    await waitFor(() => {
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Elm St')).toBeInTheDocument();
      expect(screen.getByText('Austin')).toBeInTheDocument();
      expect(screen.getByText('Dallas')).toBeInTheDocument();
    });

    // Check if status chips are displayed
    const statusChips = screen.getAllByText(/new|contacted/i);
    expect(statusChips.length).toBe(2);
  });

  it('handles search filtering', async () => {
    render(<LeadsTable />);

    // Wait for data to load
    await waitFor(() => {
      expect(getLeads).toHaveBeenCalled();
    });

    // Find the search input and enter a filter
    const searchInput = screen.getByPlaceholderText('Search by address, city, or contact...');
    fireEvent.change(searchInput, { target: { value: 'Austin' } });

    // Austin lead should be visible, Dallas lead should not
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.queryByText('456 Elm St')).not.toBeInTheDocument();

    // Clear the search
    fireEvent.change(searchInput, { target: { value: '' } });

    // Both leads should be visible again
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('456 Elm St')).toBeInTheDocument();
  });

  it('navigates to lead details when row is clicked', async () => {
    const mockOnRowClick = jest.fn();
    
    render(<LeadsTable onRowClick={mockOnRowClick} />);

    // Wait for data to load
    await waitFor(() => {
      expect(getLeads).toHaveBeenCalled();
    });

    // Find and click on a lead row
    const leadRow = screen.getByText('123 Main St').closest('tr');
    fireEvent.click(leadRow!);

    // Check if onRowClick was called with the correct lead ID
    expect(mockOnRowClick).toHaveBeenCalledWith('lead1');
  });

  it('handles action buttons correctly', async () => {
    render(<LeadsTable />);

    // Wait for data to load
    await waitFor(() => {
      expect(getLeads).toHaveBeenCalled();
    });

    // Find and click the "Generate LOI" button
    const generateLoiButton = screen.getAllByText('Generate LOI')[0];
    fireEvent.click(generateLoiButton);

    // Check if navigation occurred
    expect(window.location.href).toBe('/leads/lead1/generate-loi');

    // Find and click the "Send Email" button
    const sendEmailButton = screen.getAllByText('Send Email')[0];
    fireEvent.click(sendEmailButton);

    // Check if navigation occurred
    expect(window.location.href).toBe('/leads/lead1/send-email');
  });
});