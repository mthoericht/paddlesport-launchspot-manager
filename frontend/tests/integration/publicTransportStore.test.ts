import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePublicTransportStore } from '@/stores/publicTransport';
import type { PublicTransportPoint } from '@/types';

const mockFetchPublicTransportPoints = vi.fn();

vi.mock('@/api/publicTransport', () => ({
  fetchPublicTransportPoints: (...args: unknown[]) => mockFetchPublicTransportPoints(...args)
}));

describe('PublicTransportStore Integration', () =>
{
  beforeEach(() =>
  {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('fetchPublicTransportPoints', () =>
  {
    it('should fetch and store public transport points', async () =>
    {
      const mockPoints: PublicTransportPoint[] = [
        {
          id: 1,
          name: 'Station A',
          latitude: 52.52,
          longitude: 13.405,
          lines: 'S1, S2',
          types: ['sbahn']
        }
      ];

      mockFetchPublicTransportPoints.mockResolvedValueOnce(mockPoints);

      const store = usePublicTransportStore();
      await store.fetchPublicTransportPoints();

      expect(store.publicTransportPoints).toEqual(mockPoints);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(mockFetchPublicTransportPoints).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors', async () =>
    {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchPublicTransportPoints.mockRejectedValueOnce(new Error('Network error'));

      const store = usePublicTransportStore();
      await store.fetchPublicTransportPoints();

      expect(store.error).toBe('Network error');
      expect(store.loading).toBe(false);
      expect(store.publicTransportPoints).toEqual([]);

      consoleSpy.mockRestore();
    });
  });
});
