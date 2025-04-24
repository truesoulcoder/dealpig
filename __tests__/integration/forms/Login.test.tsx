import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '@/components/auth/login';
import * as authAction from '@/actions/auth.action';
import { useRouter } from 'next/navigation';

// Mock the auth action
jest.mock('@/actions/auth.action', () => ({
  loginUser: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup router mock
    const mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });
  
  it('should render the login form correctly', () => {
    render(<Login />);
    
    // Check for form elements
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });
  
  it('should validate form inputs', async () => {
    render(<Login />);
    
    // Submit the form without filling out any fields
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check for validation messages
    await waitFor(() => {
      expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
    });
    
    // Verify login action wasn't called
    expect(authAction.loginUser).not.toHaveBeenCalled();
  });
  
  it('should validate email format', async () => {
    render(<Login />);
    
    // Enter invalid email format
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { 
      target: { value: 'invalid-email' } 
    });
    
    // Enter password
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { 
      target: { value: 'Password123!' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check for validation message
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email/i)).toBeInTheDocument();
    });
    
    // Verify login action wasn't called
    expect(authAction.loginUser).not.toHaveBeenCalled();
  });
  
  it('should submit form with valid inputs', async () => {
    // Mock successful login response
    (authAction.loginUser as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Login successful'
    });
    
    render(<Login />);
    
    // Enter valid email
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    // Enter password
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { 
      target: { value: 'Password123!' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check if loginUser was called with right args
    await waitFor(() => {
      expect(authAction.loginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!'
      });
    });
    
    // Check if router.push was called to redirect user
    const router = useRouter();
    expect(router.push).toHaveBeenCalledWith('/');
  });
  
  it('should handle login errors', async () => {
    // Mock failed login
    (authAction.loginUser as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Invalid credentials'
    });
    
    render(<Login />);
    
    // Enter email
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    // Enter password
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { 
      target: { value: 'WrongPassword' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
    });
    
    // Verify router wasn't called
    const router = useRouter();
    expect(router.push).not.toHaveBeenCalled();
  });
  
  it('should handle unexpected errors', async () => {
    // Mock exception during login
    (authAction.loginUser as jest.Mock).mockRejectedValue(
      new Error('Unexpected server error')
    );
    
    render(<Login />);
    
    // Enter email
    fireEvent.change(screen.getByPlaceholderText(/Email/i), { 
      target: { value: 'test@example.com' } 
    });
    
    // Enter password
    fireEvent.change(screen.getByPlaceholderText(/Password/i), { 
      target: { value: 'Password123!' } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Unexpected server error/i)).toBeInTheDocument();
    });
  });
});