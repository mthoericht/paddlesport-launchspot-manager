import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLaunchPointsStore } from '@/stores/launchPoints';
import { useAuthStore } from '@/stores/auth';

const mockFetchLaunchPoints = vi.fn();
const mockFetchLaunchPoint = vi.fn();
const mockCreateLaunchPoint = vi.fn();
const mockUpdateLaunchPoint = vi.fn();
const mockDeleteLaunchPoint = vi.fn();

vi.mock('@/api/launchPoints', () => ({
  fetchLaunchPoints: (...args: unknown[]) => mockFetchLaunchPoints(...args),
  fetchLaunchPoint: (...args: unknown[]) => mockFetchLaunchPoint(...args),
  createLaunchPoint: (...args: unknown[]) => mockCreateLaunchPoint(...args),
  updateLaunchPoint: (...args: unknown[]) => mockUpdateLaunchPoint(...args),
  deleteLaunchPoint: (...args: unknown[]) => mockDeleteLaunchPoint(...args)
}));

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
          category_ids: [1],
          public_transport_stations: [],
          created_by: 1,
          creator_username: 'testuser',
          created_at: '2024-01-01T00:00:00Z'
        }
      ];

      mockFetchLaunchPoints.mockResolvedValueOnce(mockPoints);

      const store = useLaunchPointsStore();
      await store.fetchLaunchPoints();

      expect(store.launchPoints).toEqual(mockPoints);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(mockFetchLaunchPoints).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'all', categories: [] }),
        'mock-token'
      );
    });

    it('should handle fetch errors', async () =>
    {
      mockFetchLaunchPoints.mockRejectedValueOnce(new Error('Fehler beim Laden der Einsetzpunkte'));

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
      mockFetchLaunchPoints.mockResolvedValue([]);

      const store = useLaunchPointsStore();
      store.setFilter({ type: 'mine' });

      expect(store.filter.type).toBe('mine');
      expect(mockFetchLaunchPoints).toHaveBeenCalled();
    });
  });

  describe('toggleCategory', () =>
  {
    it('should toggle category in filter', async () =>
    {
      mockFetchLaunchPoints.mockResolvedValue([]);

      const store = useLaunchPointsStore();
      const categoryId = 1;
      store.toggleCategory(categoryId);

      expect(store.filter.categories).toContain(categoryId);
      expect(mockFetchLaunchPoints).toHaveBeenCalled();
    });
  });
});
