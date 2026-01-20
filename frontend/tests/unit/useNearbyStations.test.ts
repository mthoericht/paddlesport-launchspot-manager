import { describe, it, expect } from 'vitest';
import { useNearbyStations } from '@/composables/useNearbyStations';
import type { PublicTransportPoint } from '@/types';

describe('useNearbyStations', () =>
{
  const mockStations: PublicTransportPoint[] = [
    {
      id: 1,
      name: 'Station A',
      latitude: 52.5200,
      longitude: 13.4050,
      lines: 'S1,S2',
      types: ['sbahn']
    },
    {
      id: 2,
      name: 'Station B',
      latitude: 52.5210,
      longitude: 13.4060,
      lines: 'U1',
      types: ['ubahn']
    },
    {
      id: 3,
      name: 'Station C - Far Away',
      latitude: 52.6000,
      longitude: 13.5000,
      lines: 'S3',
      types: ['sbahn']
    },
    {
      id: 4,
      name: 'Station D',
      latitude: 52.5205,
      longitude: 13.4055,
      lines: 'Tram M1',
      types: ['tram']
    },
    {
      id: 5,
      name: 'Station E',
      latitude: 52.5215,
      longitude: 13.4065,
      lines: 'RE1',
      types: ['train']
    }
  ];

  describe('findNearbyStations', () =>
  {
    it('should return stations within default 2km radius', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      const result = findNearbyStations(52.5200, 13.4050);
      
      // Station C is far away (~10km) and should not be included
      expect(result.length).toBeLessThan(mockStations.length);
      expect(result.some(s => s.name === 'Station C - Far Away')).toBe(false);
    });

    it('should return stations sorted by distance', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      const result = findNearbyStations(52.5200, 13.4050);
      
      // Verify sorted by distance (ascending)
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
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      const result = findNearbyStations(52.5200, 13.4050);
      
      expect(result.length).toBeGreaterThan(0);
      result.forEach(station =>
      {
        expect(station).toHaveProperty('distanceMeters');
        expect(typeof station.distanceMeters).toBe('number');
      });
    });

    it('should limit results to maxStations (default 8)', () =>
    {
      // Create many stations
      const manyStations: PublicTransportPoint[] = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        name: `Station ${i + 1}`,
        latitude: 52.5200 + (i * 0.001),
        longitude: 13.4050 + (i * 0.001),
        lines: `S${i + 1}`,
        types: ['sbahn'] as const
      }));

      const { findNearbyStations } = useNearbyStations(() => manyStations);
      
      const result = findNearbyStations(52.5200, 13.4050);
      
      expect(result.length).toBeLessThanOrEqual(8);
    });

    it('should respect custom maxDistanceMeters parameter', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      // Very small radius (100m) - should only include the closest station
      const result = findNearbyStations(52.5200, 13.4050, 100);
      
      expect(result.length).toBeLessThan(4);
    });

    it('should respect custom maxStations parameter', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      const result = findNearbyStations(52.5200, 13.4050, 2000, 2);
      
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('should return empty array when no stations nearby', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      // Location far away from all stations
      const result = findNearbyStations(48.0000, 10.0000);
      
      expect(result).toEqual([]);
    });

    it('should return empty array when stations list is empty', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => []);
      
      const result = findNearbyStations(52.5200, 13.4050);
      
      expect(result).toEqual([]);
    });

    it('should preserve original station properties', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      const result = findNearbyStations(52.5200, 13.4050);
      
      const stationA = result.find(s => s.name === 'Station A');
      expect(stationA).toBeDefined();
      expect(stationA?.lines).toBe('S1,S2');
      expect(stationA?.types).toContain('sbahn');
    });

    it('should calculate distance correctly (approximately)', () =>
    {
      const { findNearbyStations } = useNearbyStations(() => mockStations);
      
      // Station at same location should have ~0 distance
      const result = findNearbyStations(52.5200, 13.4050);
      const stationA = result.find(s => s.name === 'Station A');
      
      expect(stationA?.distanceMeters).toBeLessThan(10);
    });
  });

  describe('calculateDistanceMeter', () =>
  {
    it('should return 0 for same coordinates', () =>
    {
      const { calculateDistanceMeter } = useNearbyStations(() => []);
      
      const distance = calculateDistanceMeter(52.5200, 13.4050, 52.5200, 13.4050);
      
      expect(distance).toBe(0);
    });

    it('should calculate correct distance (Berlin to Munich ~504km)', () =>
    {
      const { calculateDistanceMeter } = useNearbyStations(() => []);
      
      // Berlin: 52.52, 13.405
      // Munich: 48.137, 11.575
      const distance = calculateDistanceMeter(52.52, 13.405, 48.137, 11.575);
      
      // Should be approximately 504km = 504000m (with some tolerance)
      expect(distance).toBeGreaterThan(480000);
      expect(distance).toBeLessThan(520000);
    });

    it('should handle negative coordinates', () =>
    {
      const { calculateDistanceMeter } = useNearbyStations(() => []);
      
      // New York to London
      const distance = calculateDistanceMeter(40.7128, -74.0060, 51.5074, -0.1278);
      
      // Should be approximately 5570km = 5570000m
      expect(distance).toBeGreaterThan(5500000);
      expect(distance).toBeLessThan(5700000);
    });
  });
});
