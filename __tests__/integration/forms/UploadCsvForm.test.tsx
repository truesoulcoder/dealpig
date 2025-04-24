import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UploadCsvForm from '@/components/home/uploadCsvForm';
import { ingestLeads } from '@/actions/ingestLeads.action';

// Mock the server action
jest.mock('@/actions/ingestLeads.action', () => ({
  ingestLeads: jest.fn(),
}));

// Mock the toast notification library
jest.mock('@/components/ui/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

describe('UploadCsvForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should render the form correctly', () => {
    render(<UploadCsvForm />);
    
    // Check for key form elements
    expect(screen.getByText(/Upload CSV/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CSV File/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Upload/i })).toBeInTheDocument();
  });
  
  it('should handle file selection', () => {
    render(<UploadCsvForm />);
    
    // Create a mock file
    const file = new File(['property_address,owner_name'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText(/CSV File/i);
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Check if file is selected
    expect(fileInput.files[0]).toBe(file);
    expect(fileInput.files.length).toBe(1);
  });
  
  it('should show validation error for invalid file type', async () => {
    render(<UploadCsvForm />);
    
    // Create a mock non-CSV file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText(/CSV File/i);
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Upload/i }));
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/Only CSV files are allowed/i)).toBeInTheDocument();
    });
    
    // Verify the action wasn't called
    expect(ingestLeads).not.toHaveBeenCalled();
  });
  
  it('should submit the form with valid CSV file', async () => {
    // Mock successful response from server action
    (ingestLeads as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Successfully processed 10 leads',
      data: { count: 10 }
    });
    
    render(<UploadCsvForm />);
    
    // Create a mock CSV file
    const file = new File(['property_address,owner_name'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText(/CSV File/i);
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Upload/i }));
    
    // Wait for the action to be called
    await waitFor(() => {
      expect(ingestLeads).toHaveBeenCalled();
    });
    
    // Check loading state
    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
    
    // Check success message after form submission
    await waitFor(() => {
      expect(screen.getByText(/Successfully processed 10 leads/i)).toBeInTheDocument();
    });
  });
  
  it('should handle server errors during submission', async () => {
    // Mock error response from server action
    (ingestLeads as jest.Mock).mockRejectedValue(new Error('Failed to process CSV'));
    
    render(<UploadCsvForm />);
    
    // Create a mock CSV file
    const file = new File(['property_address,owner_name'], 'test.csv', { type: 'text/csv' });
    const fileInput = screen.getByLabelText(/CSV File/i);
    
    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Upload/i }));
    
    // Wait for the action to be called
    await waitFor(() => {
      expect(ingestLeads).toHaveBeenCalled();
    });
    
    // Check error message after failed submission
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to process CSV/i)).toBeInTheDocument();
    });
  });
});