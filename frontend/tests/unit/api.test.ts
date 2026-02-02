import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signup, login, fetchCurrentUser } from '@/api/auth';
import {
  fetchLaunchPoints,
  fetchLaunchPoint,
  createLaunchPoint,
  updateLaunchPoint,
  deleteLaunchPoint,
  fetchCategories
} from '@/api/launchPoints';
import { fetchPublicTransportPoints } from '@/api/publicTransport';

const mockFetch = vi.fn();

vi.mock('@/config/api', () => ({
  API_BASE_URL: 'http://localhost:3001'
}));

describe('API Layer', () =>
{
  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
  });

  describe('auth API', () =>
  {
    it('signup should POST to /auth/signup with body', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 't', user: { id: 1, email: 'x@x.com', username: 'x', is_admin: false } })
      });

      await signup('a@b.com', 'user', 'pass123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'a@b.com', username: 'user', password: 'pass123' })
        })
      );
    });

    it('login should POST to /auth/login with body', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 't', user: { id: 1, email: 'x@x.com', username: 'x', is_admin: false } })
      });

      await login('a@b.com', 'pass123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'a@b.com', password: 'pass123' })
        })
      );
    });

    it('fetchCurrentUser should GET /auth/me with Authorization header', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: { id: 1, email: 'x@x.com', username: 'x', is_admin: false } })
      });

      await fetchCurrentUser('my-token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer my-token' }
        })
      );
    });

    it('should throw on error response', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid credentials' })
      });

      await expect(login('x@x.com', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('launchPoints API', () =>
  {
    it('fetchLaunchPoints should GET with filter query params', async () =>
    {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      await fetchLaunchPoints({ type: 'mine', categories: [] }, 'token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/launch-points?filter=mine',
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer token' }
        })
      );
    });

    it('fetchLaunchPoints should include categories in query', async () =>
    {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      await fetchLaunchPoints({ type: 'all', categories: [1, 2] }, 'token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/launch-points?categories=1%2C2',
        expect.any(Object)
      );
    });

    it('fetchLaunchPoint should GET by id', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, name: 'Test' })
      });

      await fetchLaunchPoint(42, 'token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/launch-points/42',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('createLaunchPoint should POST with body', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'ok', id: 1 })
      });

      const data = {
        name: 'Test',
        latitude: 52.52,
        longitude: 13.4,
        hints: '',
        opening_hours: '24h',
        parking_options: '',
        nearby_waters: '',
        food_supply: '',
        categories: [1],
        public_transport_stations: []
      };

      await createLaunchPoint(data, 'token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/launch-points',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data)
        })
      );
    });

    it('updateLaunchPoint should PUT by id', async () =>
    {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'ok' }) });

      const data = {
        name: 'Updated',
        latitude: 52.52,
        longitude: 13.4,
        hints: '',
        opening_hours: '24h',
        parking_options: '',
        nearby_waters: '',
        food_supply: '',
        categories: [1],
        public_transport_stations: []
      };

      await updateLaunchPoint(5, data, 'token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/launch-points/5',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteLaunchPoint should DELETE by id', async () =>
    {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ message: 'ok' }) });

      await deleteLaunchPoint(7, 'token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/launch-points/7',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('fetchCategories should GET /launch-points/categories', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, name_en: 'kajak', name_de: 'Kajak' }]
      });

      await fetchCategories('token');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/launch-points/categories',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('publicTransport API', () =>
  {
    it('fetchPublicTransportPoints should GET /public-transport', async () =>
    {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      });

      await fetchPublicTransportPoints();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/public-transport',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should not require token', async () =>
    {
      mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

      await fetchPublicTransportPoints();

      const call = mockFetch.mock.calls[0]?.[1];
      expect(call).toBeDefined();
      expect(call!.headers).not.toHaveProperty('Authorization');
    });
  });
});
