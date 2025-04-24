import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom'; // Import jest-dom for the matchers
import { Login } from '@/components/auth/login';
import * as authAction from '@/actions/auth.action';
import { useRouter } from 'next/navigation';
import { LoginFormType } from '@/helpers/types';

// Mock the auth actions
jest.mock('@/actions/auth.action', () => ({
  loginUser: jest.fn(),
  createAuthCookie: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Define types for the mock components
interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: string;
  color?: string;
  [key: string]: any;
}

interface InputProps {
  label?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  errorMessage?: string;
  isInvalid?: boolean;
  variant?: string;
  [key: string]: any;
}

// Mock HeroUI components
jest.mock('@heroui/react', () => ({
  Button: ({ children, onPress, ...props }: ButtonProps) => (
    <button onClick={onPress} data-testid="login-button" {...props}>{children}</button>
  ),
  Input: ({ label, type, value, onChange, errorMessage, isInvalid, ...props }: InputProps) => (
    <div>
      <label htmlFor={`input-${type}`}>{label}</label>
      <input 
        id={`input-${type}`}
        data-testid={`${type}-input`}
        type={type} 
        value={value} 
        onChange={(e) => onChange && onChange(e.target.value)}
        aria-invalid={isInvalid}
        {...props}
      />
      {isInvalid && <div data-testid={`error-${type}`} className="error-message">{errorMessage}</div>}
    </div>
  ),
}));

// Define types for Formik mock
interface FormikProps<T> {
  initialValues: T;
  validationSchema?: any;
  onSubmit: (values: T) => void;
  children: (formikProps: {
    values: T;
    errors: Record<string, string>;
    touched: Record<string, boolean>;
    handleChange: (field: string) => (value: any) => void;
    handleSubmit: () => void;
    status: { error: null };
  }) => React.ReactNode;
}

// Mock formik
jest.mock('formik', () => ({
  Formik: <T extends Record<string, any>>({ 
    initialValues, 
    validationSchema, 
    onSubmit, 
    children 
  }: FormikProps<T>) => {
    const [values, setValues] = React.useState<T>(initialValues);
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [touched, setTouched] = React.useState<Record<string, boolean>>({});
    
    const handleChange = (field: string) => (value: any) => {
      setValues({ ...values, [field]: value });
      setTouched({ ...touched, [field]: true });
      
      // Basic validation for tests
      if (field === 'email') {
        if (!value) {
          setErrors({ ...errors, email: 'Required' });
        } else if (!value.includes('@')) {
          setErrors({ ...errors, email: 'Invalid email address' });
        } else {
          const newErrors = { ...errors };
          delete newErrors.email;
          setErrors(newErrors);
        }
      }
      
      if (field === 'password') {
        if (!value) {
          setErrors({ ...errors, password: 'Required' });
        } else if (value.length < 6) {
          setErrors({ ...errors, password: 'Password must be at least 6 characters' });
        } else {
          const newErrors = { ...errors };
          delete newErrors.password;
          setErrors(newErrors);
        }
      }
    };
    
    const handleSubmit = () => {
      onSubmit(values);
    };
    
    return children({
      values, 
      errors, 
      touched, 
      handleChange, 
      handleSubmit,
      status: { error: null },
    });
  },
}));

describe('Login Component', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });
  
  it('renders the login form correctly', () => {
    render(<Login />);
    
    // Check for form elements
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/Register here/i)).toBeInTheDocument();
  });
  
  it('handles input changes correctly', () => {
    render(<Login />);
    
    // Get input elements
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    // Simulate user input
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Check if inputs have the values
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });
  
  it('displays validation errors for invalid inputs', async () => {
    render(<Login />);
    
    // Get input elements
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    // Enter invalid email and short password
    fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
    fireEvent.change(passwordInput, { target: { value: '123' } });
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByTestId('error-email')).toBeInTheDocument();
      expect(screen.getByTestId('error-password')).toBeInTheDocument();
    });
  });
  
  it('submits the form with valid credentials and redirects on success', async () => {
    // Setup mocks for successful login
    (authAction.loginUser as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Login successful'
    });
    (authAction.createAuthCookie as jest.Mock).mockResolvedValue(undefined);
    
    render(<Login />);
    
    // Fill in valid credentials
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(loginButton);
    
    // Verify login action was called with correct values
    await waitFor(() => {
      expect(authAction.loginUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      } as LoginFormType);
    });
    
    // Verify cookie creation and redirect
    await waitFor(() => {
      expect(authAction.createAuthCookie).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/');
    });
  });
  
  it('shows an error message on failed login', async () => {
    // Setup mock for failed login
    (authAction.loginUser as jest.Mock).mockResolvedValue({
      success: false,
      message: 'Invalid credentials'
    });
    
    render(<Login />);
    
    // Fill in credentials
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    
    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    // Submit form
    fireEvent.click(loginButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');
    });
    
    // Verify we do not redirect
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
  
  it('handles server errors correctly', async () => {
    // Setup mock for a server error
    (authAction.loginUser as jest.Mock).mockRejectedValue(new Error('Server error'));
    
    render(<Login />);
    
    // Fill in credentials
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Submit form
    fireEvent.click(loginButton);
    
    // Verify error message is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Unexpected server error');
    });
    
    // Verify we do not redirect
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});