import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLaunchPointsStore } from '@/stores/launchPoints';
import { useAuthStore } from '@/stores/auth';

// Mock fetch
global.fetch = vi.fn();

describe('LaunchPointsStore Integration', () =>
{
  beforeEach(() =>
  {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Setup auth store with token
    const authStore = useAuthStore();
    authStore.token = 'mock-token';
  });

  describe('fetchLaunchPoints', () =>
  {
    it('should fetch all launch points', async () =>
    {
      const mockPoints = [
        {
          id: 1,
          name: 'Test Point',
          latitude: 52.5200,
          longitude: 13.4050,
          is_official: false,
          hints: null,
          opening_hours: '24h',
          parking_options: null,
          nearby_waters: null,
          food_supply: null,
          categories: ['Kajak'],
          public_transport_stations: [],
          created_by: 1,
          creator_username: 'testuser',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPoints
      });

      const store = useLaunchPointsStore();
      await store.fetchLaunchPoints();

      expect(store.launchPoints).toEqual(mockPoints);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch errors', async () =>
    {
      (fetch as any).mockResolvedValueOnce({
        ok: false
      });

      const store = useLaunchPointsStore();
      await store.fetchLaunchPoints();

      expect(store.error).toBe('Fehler beim Laden der Einsetzpunkte');
      expect(store.loading).toBe(false);
    });
  });

  describe('setFilter', () =>
  {
    it('should update filter and refetch points', async () =>
    {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => []
      });

      const store = useLaunchPointsStore();
      store.setFilter({ type: 'mine' });

      expect(store.filter.type).toBe('mine');
      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('toggleCategory', () =>
  {
    it('should toggle category in filter', async () =>
    {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => []
      });

      const store = useLaunchPointsStore();
      store.toggleCategory('Kajak');

      expect(store.filter.categories).toContain('Kajak');
      expect(fetch).toHaveBeenCalled();
    });
  });
});

