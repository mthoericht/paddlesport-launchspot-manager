import { describe, it, expect } from 'vitest';
import { useNearbyLaunchpoints } from '@/composables/useNearbyLaunchpoints';
import type { LaunchPoint } from '@/types';

describe('useNearbyLaunchpoints', () =>
{
  const mockLaunchpoints: LaunchPoint[] = [
    {
      id: 1,
      name: 'Launchpoint A',
      latitude: 52.5200,
      longitude: 13.4050,
      hints: 'Close spot',
      opening_hours: '',
      parking_options: null,
      nearby_waters: null,
      food_supply: null,
      categories: ['Kajak'],
      category_ids: [1],
      creator_username: 'user1',
      created_by: 1,
      is_official: false,
      created_at: '2024-01-01',
      public_transport_stations: []
    },
    {
      id: 2,
      name: 'Launchpoint B',
      latitude: 52.5210,
      longitude: 13.4060,
      hints: 'Medium spot',
      opening_hours: '',
      parking_options: null,
      nearby_waters: null,
      food_supply: null,
      categories: ['SUP'],
      category_ids: [2],
      creator_username: 'user2',
      created_by: 2,
      is_official: true,
      created_at: '2024-01-02',
      public_transport_stations: []
    },
    {
      id: 3,
      name: 'Launchpoint C - Far Away',
      latitude: 52.6000,
      longitude: 13.5000,
      hints: 'Far spot',
      opening_hours: '',
      parking_options: null,
      nearby_waters: null,
      food_supply: null,
      categories: ['Kanu'],
      category_ids: [3],
      creator_username: 'user3',
      created_by: 3,
      is_official: false,
      created_at: '2024-01-03',
      public_transport_stations: []
    }
  ];

  describe('findNearbyLaunchpoints', () =>
  {
    it('should return launchpoints within default 2km radius', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => mockLaunchpoints);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050);
      
      expect(result.length).toBeLessThan(mockLaunchpoints.length);
      expect(result.some(lp => lp.name === 'Launchpoint C - Far Away')).toBe(false);
    });

    it('should return launchpoints sorted by distance', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => mockLaunchpoints);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050);
      
      for (let i = 1; i < result.length; i++)
      {
        const current = result[i];
        const previous = result[i - 1];
        if (current && previous)
        {
          expect(current.distanceMeters).toBeGreaterThanOrEqual(previous.distanceMeters);
        }
      }
    });

    it('should include distanceMeters in result', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => mockLaunchpoints);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050);
      
      expect(result.length).toBeGreaterThan(0);
      result.forEach(lp =>
      {
        expect(lp).toHaveProperty('distanceMeters');
        expect(typeof lp.distanceMeters).toBe('number');
      });
    });

    it('should limit results to maxLaunchpoints (default 8)', () =>
    {
      const manyLaunchpoints: LaunchPoint[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Launchpoint ${i + 1}`,
        latitude: 52.5200 + (i * 0.001),
        longitude: 13.4050 + (i * 0.001),
        hints: `Spot ${i + 1}`,
        opening_hours: '',
        parking_options: null,
        nearby_waters: null,
        food_supply: null,
        categories: ['Kajak'],
        category_ids: [1],
        creator_username: 'user',
        created_by: 1,
        is_official: false,
        created_at: '2024-01-01',
        public_transport_stations: []
      }));

      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => manyLaunchpoints);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050);
      
      expect(result.length).toBeLessThanOrEqual(8);
    });

    it('should respect custom maxDistanceMeters parameter', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => mockLaunchpoints);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050, 100);
      
      expect(result.length).toBeLessThan(3);
    });

    it('should respect custom maxLaunchpoints parameter', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => mockLaunchpoints);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050, 2000, 1);
      
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should return empty array when no launchpoints nearby', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => mockLaunchpoints);
      
      const result = findNearbyLaunchpoints(48.0000, 10.0000);
      
      expect(result).toEqual([]);
    });

    it('should return empty array when launchpoints list is empty', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => []);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050);
      
      expect(result).toEqual([]);
    });

    it('should preserve original launchpoint properties', () =>
    {
      const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => mockLaunchpoints);
      
      const result = findNearbyLaunchpoints(52.5200, 13.4050);
      
      const lpA = result.find(lp => lp.name === 'Launchpoint A');
      expect(lpA).toBeDefined();
      expect(lpA?.hints).toBe('Close spot');
      expect(lpA?.categories).toContain('Kajak');
      expect(lpA?.creator_username).toBe('user1');
    });
  });
});
