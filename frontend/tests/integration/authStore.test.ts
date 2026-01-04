import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth';

// Mock fetch
global.fetch = vi.fn();

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

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const store = useAuthStore();
      const result = await store.signup('test@example.com', 'testuser', 'password123');

      expect(result).toBe(true);
      expect(store.token).toBe('mock-jwt-token');
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe('mock-jwt-token');
    });

    it('should handle signup errors', async () =>
    {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Email already exists' })
      });

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

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const store = useAuthStore();
      const result = await store.login('test@example.com', 'password123');

      expect(result).toBe(true);
      expect(store.token).toBe('mock-jwt-token');
      expect(store.user).toEqual(mockUser);
      expect(store.isAuthenticated).toBe(true);
    });

    it('should handle login errors', async () =>
    {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      const store = useAuthStore();
      const result = await store.login('test@example.com', 'wrongpassword');

      expect(result).toBe(false);
      expect(store.error).toBe('Invalid credentials');
      expect(store.isAuthenticated).toBe(false);
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

