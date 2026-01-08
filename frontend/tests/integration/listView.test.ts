import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLaunchPointsStore } from '@/stores/launchPoints';
import { useAuthStore } from '@/stores/auth';
import type { LaunchPoint } from '@/types';

// Mock fetch
globalThis.fetch = vi.fn();

describe('List View Integration', () =>
{
  beforeEach(() =>
  {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    
    // Setup auth store with token
    const authStore = useAuthStore();
    authStore.token = 'mock-token';
  });

  describe('Launch Points Store - List View Support', () =>
  {
    it('should provide launch points for list view', async () =>
    {
      const mockPoints: LaunchPoint[] = [
        {
          id: 1,
          name: 'Test Point 1',
          latitude: 52.5200,
          longitude: 13.4050,
          is_official: false,
          hints: 'Test hints',
          opening_hours: '24h',
          parking_options: 'Parking available',
          nearby_waters: 'River Spree',
          food_supply: 'Restaurant nearby',
          categories: ['Kajak'],
          public_transport_stations: [],
          created_by: 1,
          creator_username: 'testuser',
          created_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 2,
          name: 'Test Point 2',
          latitude: 52.5300,
          longitude: 13.4100,
          is_official: true,
          hints: null,
          opening_hours: '9-18',
          parking_options: null,
          nearby_waters: null,
          food_supply: null,
          categories: ['SUP', 'Schwimmen'],
          public_transport_stations: [
            { id: 1, name: 'Station 1', distance_meters: 100 }
          ],
          created_by: 2,
          creator_username: 'admin',
          created_at: '2024-01-02T00:00:00Z'
        }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPoints
      });

      const store = useLaunchPointsStore();
      await store.fetchLaunchPoints();

      expect(store.launchPoints).toHaveLength(2);
      expect(store.launchPoints[0].name).toBe('Test Point 1');
      expect(store.launchPoints[1].name).toBe('Test Point 2');
    });

    it('should filter points for list view', async () =>
    {
      const mockPoints: LaunchPoint[] = [
        {
          id: 1,
          name: 'My Point',
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

      (fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockPoints
      });

      const store = useLaunchPointsStore();
      store.setFilter({ type: 'mine' });
      await store.fetchLaunchPoints();

      expect(store.launchPoints).toHaveLength(1);
      expect(store.launchPoints[0].name).toBe('My Point');
    });

    it('should provide all required fields for list view display', async () =>
    {
      const mockPoint: LaunchPoint = {
        id: 1,
        name: 'Test Point',
        latitude: 52.5200,
        longitude: 13.4050,
        is_official: true,
        hints: 'Test hints',
        opening_hours: '24h',
        parking_options: 'Parking',
        nearby_waters: 'River',
        food_supply: 'Food',
        categories: ['Kajak', 'SUP'],
        public_transport_stations: [
          { id: 1, name: 'Station', distance_meters: 200 }
        ],
        created_by: 1,
        creator_username: 'testuser',
        created_at: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPoint]
      });

      const store = useLaunchPointsStore();
      await store.fetchLaunchPoints();

      const point = store.launchPoints[0];
      
      // Verify all fields needed for list view
      expect(point).toHaveProperty('id');
      expect(point).toHaveProperty('name');
      expect(point).toHaveProperty('latitude');
      expect(point).toHaveProperty('longitude');
      expect(point).toHaveProperty('categories');
      expect(point).toHaveProperty('creator_username');
      expect(point).toHaveProperty('is_official');
      expect(point).toHaveProperty('opening_hours');
      expect(point).toHaveProperty('hints');
      expect(point).toHaveProperty('public_transport_stations');
      
      // Verify values
      expect(point.name).toBe('Test Point');
      expect(point.categories).toEqual(['Kajak', 'SUP']);
      expect(point.is_official).toBe(true);
      expect(point.creator_username).toBe('testuser');
    });
  });

  describe('List View Data Format', () =>
  {
    it('should handle points with null optional fields', async () =>
    {
      const mockPoint: LaunchPoint = {
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
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPoint]
      });

      const store = useLaunchPointsStore();
      await store.fetchLaunchPoints();

      const point = store.launchPoints[0];
      
      // Should handle null values gracefully
      expect(point.hints).toBeNull();
      expect(point.parking_options).toBeNull();
      expect(point.nearby_waters).toBeNull();
      expect(point.food_supply).toBeNull();
    });

    it('should handle empty categories array', async () =>
    {
      const mockPoint: LaunchPoint = {
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
        categories: [],
        public_transport_stations: [],
        created_by: 1,
        creator_username: 'testuser',
        created_at: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockPoint]
      });

      const store = useLaunchPointsStore();
      await store.fetchLaunchPoints();

      expect(store.launchPoints[0].categories).toEqual([]);
    });
  });
});

