import { loginUser, fetchLeads, saveToken } from '../../actions/auth.action';
import { supabase } from '../../lib/supabaseClient';

// Create chainable mock functions
const createChainableMock = () => {
  const mock = jest.fn().mockReturnThis();
  mock.select = jest.fn().mockReturnThis();
  mock.insert = jest.fn().mockReturnThis();
  mock.then = jest.fn().mockResolvedValue({ data: [], error: null });
  return mock;
};

// Mock Supabase
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(() => createChainableMock())
  },
}));

// Mock next/headers
jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('auth actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginUser', () => {
    it('should successfully login with valid credentials', async () => {
      // Setup
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });
      
      // Execute
      const result = await loginUser(mockCredentials);
      
      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Login successful');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
    
    it('should fail login with invalid credentials', async () => {
      // Setup
      const mockCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' },
      });
      
      // Execute
      const result = await loginUser(mockCredentials);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid credentials');
    });
    
    it('should handle unexpected errors during login', async () => {
      // Setup
      const mockCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      // Execute
      const result = await loginUser(mockCredentials);
      
      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unexpected server error');
    });
  });
  
  describe('fetchLeads', () => {
    it('should return leads when successful', async () => {
      // Setup
      const mockLeads = [
        { id: 'lead-1', property_address: '123 Main St' },
        { id: 'lead-2', property_address: '456 Elm St' },
      ];
      
      const mock = createChainableMock();
      mock.then.mockResolvedValue({ data: mockLeads, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mock);
      
      // Execute
      const result = await fetchLeads();
      
      // Assert
      expect(result).toEqual(mockLeads);
      expect(supabase.from).toHaveBeenCalledWith('leads');
    });
    
    it('should throw error when fetch fails', async () => {
      // Setup
      const mock = createChainableMock();
      mock.then.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      (supabase.from as jest.Mock).mockReturnValue(mock);
      
      // Execute & Assert
      await expect(fetchLeads()).rejects.toThrow('Failed to fetch leads');
    });
  });
  
  describe('saveToken', () => {
    it('should save tokens successfully', async () => {
      // Setup
      const mockEmail = 'user@example.com';
      const mockOAuthToken = 'oauth-token-xyz';
      const mockRefreshToken = 'refresh-token-xyz';
      
      const mock = createChainableMock();
      mock.then.mockResolvedValue({ data: { id: 'token-123' }, error: null });
      (supabase.from as jest.Mock).mockReturnValue(mock);
      
      // Execute
      await saveToken(mockEmail, mockOAuthToken, mockRefreshToken);
      
      // Assert
      expect(supabase.from).toHaveBeenCalledWith('tokens');
    });
    
    it('should throw error when token saving fails', async () => {
      // Setup
      const mock = createChainableMock();
      mock.then.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      (supabase.from as jest.Mock).mockReturnValue(mock);
      
      // Execute & Assert
      await expect(
        saveToken('email@test.com', 'oauth-token', 'refresh-token')
      ).rejects.toThrow('Failed to save token');
    });
  });
});