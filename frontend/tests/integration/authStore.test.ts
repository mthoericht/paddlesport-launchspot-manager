import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

const mockSignup = vi.fn();
const mockLogin = vi.fn();
const mockFetchCurrentUser = vi.fn();

vi.mock('@/api/auth', () => ({
  signup: (...args: unknown[]) => mockSignup(...args),
  login: (...args: unknown[]) => mockLogin(...args),
  fetchCurrentUser: (...args: unknown[]) => mockFetchCurrentUser(...args)
}));

describe('AuthStore Integration', () =>
{
  beforeEach(() =>
  {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('signup', () =>
  {
    it('should successfully sign up a new user', async () =>
    {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_admin: false
      };

      const mockResponse = {
        token: 'mock-jwt-token',
        user: mockUser
      };

      mockSignup.mockResolvedValueOnce(mockResponse);

      const store = useAuthStore();
      const result = await store.signup('test@example.com', 'testuser', 'password123');

      expect(result).toBe(true);
      expect(store.token).toBe('mock-jwt-token');
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
      expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'testuser', 'password123');
    });

    it('should handle signup errors', async () =>
    {
      mockSignup.mockRejectedValueOnce(new Error('Email already exists'));

      const store = useAuthStore();
      const result = await store.signup('test@example.com', 'testuser', 'password123');

      expect(result).toBe(false);
      expect(store.error).toBe('Email already exists');
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('login', () =>
  {
    it('should successfully log in a user', async () =>
    {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_admin: false
      };

      const mockResponse = {
        token: 'mock-jwt-token',
        user: mockUser
      };

      mockLogin.mockResolvedValueOnce(mockResponse);

      const store = useAuthStore();
      const result = await store.login('test@example.com', 'password123');

      expect(result).toBe(true);
      expect(store.token).toBe('mock-jwt-token');
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should handle login errors', async () =>
    {
      mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

      const store = useAuthStore();
      const result = await store.login('test@example.com', 'wrongpassword');

      expect(result).toBe(false);
      expect(store.error).toBe('Invalid credentials');
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('fetchCurrentUser', () =>
  {
    it('should fetch and set user when token exists', async () =>
    {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_admin: false
      };

      mockFetchCurrentUser.mockResolvedValueOnce({ user: mockUser });

      const store = useAuthStore();
      store.token = 'mock-token';
      const result = await store.fetchCurrentUser();

      expect(result).toBe(true);
      expect(store.user).toEqual(mockUser);
      expect(mockFetchCurrentUser).toHaveBeenCalledWith('mock-token');
    });

    it('should return false and logout when token is invalid', async () =>
    {
      mockFetchCurrentUser.mockRejectedValueOnce(new Error('Unauthorized'));

      const store = useAuthStore();
      store.token = 'invalid-token';
      store.user = { id: 1, email: 'x@x.com', username: 'x', is_admin: false };
      const result = await store.fetchCurrentUser();

      expect(result).toBe(false);
      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
    });

    it('should return false when no token', async () =>
    {
      const store = useAuthStore();
      const result = await store.fetchCurrentUser();

      expect(result).toBe(false);
      expect(mockFetchCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('logout', () =>
  {
    it('should clear user data and token', () =>
    {
      const store = useAuthStore();
      store.token = 'mock-token';
      store.user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_admin: false
      };
      localStorage.setItem('token', 'mock-token');

      store.logout();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('isAuthenticated', () =>
  {
    it('should return false when no token', () =>
    {
      const store = useAuthStore();
      expect(store.isAuthenticated).toBe(false);
    });

    it('should return true when token and user exist', () =>
    {
      const store = useAuthStore();
      store.token = 'mock-token';
      store.user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_admin: false
      };

      expect(store.isAuthenticated).toBe(true);
    });
  });

  describe('isAdmin', () =>
  {
    it('should return false for non-admin user', () =>
    {
      const store = useAuthStore();
      store.user = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        is_admin: false
      };

      expect(store.isAdmin).toBe(false);
    });

    it('should return true for admin user', () =>
    {
      const store = useAuthStore();
      store.user = {
        id: 1,
        email: 'admin@example.com',
        username: 'admin',
        is_admin: true
      };

      expect(store.isAdmin).toBe(true);
    });
  });
});
