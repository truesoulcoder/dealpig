import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeadsTable } from '@/components/table/leads-table';
import * as database from '@/lib/database';
import { trpc } from '@/app/providers/trpc-provider';

// Mock the database module
jest.mock('@/lib/database', () => ({
  getLeads: jest.fn(),
  updateLead: jest.fn(),
  deleteLead: jest.fn(),
}));

// Mock the trpc calls
jest.mock('@/app/providers/trpc-provider', () => ({
  trpc: {
    leads: {
      getLeads: {
        useQuery: jest.fn(),
      },
      updateLead: {
        useMutation: jest.fn(),
      },
      deleteLead: {
        useMutation: jest.fn(),
      },
    },
  },
}));

// Mock data
const mockLeads = [
  {
    id: '1',
    property_address: '123 Test Street',
    property_city: 'Test City',
    property_state: 'TS',
    property_zip: '12345',
    owner_name: 'John Doe',
    owner_email: 'john@example.com',
    offer_price: 200000,
    earnest_money: 5000,
    closing_date: '2025-06-15',
    status: 'new',
    email_status: 'not_sent',
    created_at: '2025-04-01T12:00:00Z',
    updated_at: '2025-04-01T12:00:00Z',
  },
  {
    id: '2',
    property_address: '456 Sample Avenue',
    property_city: 'Sample City',
    property_state: 'SC',
    property_zip: '67890',
    owner_name: 'Jane Smith',
    owner_email: 'jane@example.com',
    offer_price: 350000,
    earnest_money: 7500,
    closing_date: '2025-07-01',
    status: 'contacted',
    email_status: 'sent',
    created_at: '2025-04-10T10:00:00Z',
    updated_at: '2025-04-15T14:30:00Z',
  }
];

describe('LeadsTable State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup the trpc query mock to return the mock data
    (trpc.leads.getLeads.useQuery as jest.Mock).mockReturnValue({
      data: mockLeads,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    // Setup mutation mocks
    const mockMutationResult = {
      mutate: jest.fn(),
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
      reset: jest.fn(),
    };
    
    (trpc.leads.updateLead.useMutation as jest.Mock).mockReturnValue(mockMutationResult);
    (trpc.leads.deleteLead.useMutation as jest.Mock).mockReturnValue(mockMutationResult);
  });
  
  it('should render leads data correctly', () => {
    render(<LeadsTable />);
    
    // Check if leads data is rendered
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('456 Sample Avenue')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
  
  it('should filter leads by status', async () => {
    // Setup the mock to return filtered data when filter is applied
    (trpc.leads.getLeads.useQuery as jest.Mock)
      .mockImplementation((params) => {
        // If status filter is applied, return filtered data
        if (params?.status === 'contacted') {
          return {
            data: [mockLeads[1]],  // Only the "contacted" lead
            isLoading: false,
            error: null,
            refetch: jest.fn(),
          };
        }
        
        // Default return all leads
        return {
          data: mockLeads,
          isLoading: false,
          error: null,
          refetch: jest.fn(),
        };
      });
    
    const { rerender } = render(<LeadsTable />);
    
    // Initially should show all leads
    expect(screen.getByText('123 Test Street')).toBeInTheDocument();
    expect(screen.getByText('456 Sample Avenue')).toBeInTheDocument();
    
    // Find and click the status filter
    const statusFilter = screen.getByLabelText(/filter by status/i);
    fireEvent.change(statusFilter, { target: { value: 'contacted' } });
    
    // Rerender with new state
    rerender(<LeadsTable />);
    
    // Check that only the contacted lead is shown
    await waitFor(() => {
      expect(screen.queryByText('123 Test Street')).not.toBeInTheDocument();
      expect(screen.getByText('456 Sample Avenue')).toBeInTheDocument();
    });
  });
  
  it('should sort leads by property address', async () => {
    // Mock sortable data
    const sortableLeads = [
      { ...mockLeads[0], property_address: 'B Street' },
      { ...mockLeads[1], property_address: 'A Avenue' },
    ];
    
    (trpc.leads.getLeads.useQuery as jest.Mock).mockReturnValue({
      data: sortableLeads,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<LeadsTable />);
    
    // Initial order
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('B Street');
    expect(rows[2]).toHaveTextContent('A Avenue');
    
    // Click the address header to sort
    const addressHeader = screen.getByText(/property address/i);
    fireEvent.click(addressHeader);
    
    // Check for sorted order (this is presuming the sort works locally)
    // You may need to adjust this based on how your sorting actually works
    await waitFor(() => {
      const sortedRows = screen.getAllByRole('row');
      expect(sortedRows[1]).toHaveTextContent('A Avenue');
      expect(sortedRows[2]).toHaveTextContent('B Street');
    });
  });
  
  it('should handle lead status change', async () => {
    // Setup the mutation mock
    const updateMutation = { mutate: jest.fn() };
    (trpc.leads.updateLead.useMutation as jest.Mock).mockReturnValue(updateMutation);
    
    render(<LeadsTable />);
    
    // Find the status cell for the first lead and change it
    const statusSelect = screen.getAllByLabelText(/change lead status/i)[0];
    fireEvent.change(statusSelect, { target: { value: 'negotiating' } });
    
    // Check if mutation was called with correct parameters
    await waitFor(() => {
      expect(updateMutation.mutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '1',
          status: 'negotiating'
        })
      );
    });
  });
  
  it('should handle lead deletion', async () => {
    // Setup the mutation mock
    const deleteMutation = { mutate: jest.fn() };
    (trpc.leads.deleteLead.useMutation as jest.Mock).mockReturnValue(deleteMutation);
    
    render(<LeadsTable />);
    
    // Find and click delete button for first lead
    const deleteButtons = screen.getAllByLabelText(/delete lead/i);
    fireEvent.click(deleteButtons[0]);
    
    // Should show confirmation dialog
    const confirmButton = screen.getByText(/confirm delete/i);
    fireEvent.click(confirmButton);
    
    // Check if delete mutation was called with the correct ID
    await waitFor(() => {
      expect(deleteMutation.mutate).toHaveBeenCalledWith('1');
    });
  });
  
  it('should handle loading state', async () => {
    // Set loading state to true
    (trpc.leads.getLeads.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });
    
    render(<LeadsTable />);
    
    // Check for loading indicator
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByText('123 Test Street')).not.toBeInTheDocument();
  });
  
  it('should handle error state', async () => {
    // Set error state
    (trpc.leads.getLeads.useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch leads'),
      refetch: jest.fn(),
    });
    
    render(<LeadsTable />);
    
    // Check for error message
    expect(screen.getByText(/error/i)).toBeInTheDocument();
    expect(screen.getByText(/failed to fetch leads/i)).toBeInTheDocument();
  });
});