import { describe, it, expect } from 'vitest';
import { haversineDistanceMeters, findNearby, type LatLon } from '@/utils/geo';

describe('haversineDistanceMeters', () =>
{
  it('should return 0 for same coordinates', () =>
  {
    const point: LatLon = { latitude: 52.5200, longitude: 13.4050 };
    
    const distance = haversineDistanceMeters(point, point);
    
    expect(distance).toBe(0);
  });

  it('should calculate correct distance (Berlin to Munich ~504km)', () =>
  {
    const berlin: LatLon = { latitude: 52.52, longitude: 13.405 };
    const munich: LatLon = { latitude: 48.137, longitude: 11.575 };
    
    const distance = haversineDistanceMeters(berlin, munich);
    
    expect(distance).toBeGreaterThan(480000);
    expect(distance).toBeLessThan(520000);
  });

  it('should handle negative coordinates (New York to London)', () =>
  {
    const newYork: LatLon = { latitude: 40.7128, longitude: -74.0060 };
    const london: LatLon = { latitude: 51.5074, longitude: -0.1278 };
    
    const distance = haversineDistanceMeters(newYork, london);
    
    expect(distance).toBeGreaterThan(5500000);
    expect(distance).toBeLessThan(5700000);
  });

  it('should be symmetric (a to b equals b to a)', () =>
  {
    const berlin: LatLon = { latitude: 52.52, longitude: 13.405 };
    const munich: LatLon = { latitude: 48.137, longitude: 11.575 };
    
    const distanceAB = haversineDistanceMeters(berlin, munich);
    const distanceBA = haversineDistanceMeters(munich, berlin);
    
    expect(distanceAB).toBe(distanceBA);
  });
});

describe('findNearby', () =>
{
  interface TestItem extends LatLon {
    id: number;
    name: string;
  }

  const testItems: TestItem[] = [
    { id: 1, name: 'Close', latitude: 52.5200, longitude: 13.4050 },
    { id: 2, name: 'Medium', latitude: 52.5210, longitude: 13.4060 },
    { id: 3, name: 'Far', latitude: 52.6000, longitude: 13.5000 },
  ];

  it('should filter items by max distance', () =>
  {
    const origin: LatLon = { latitude: 52.5200, longitude: 13.4050 };
    
    const result = findNearby(testItems, origin, 2000, 10);
    
    expect(result.some(i => i.name === 'Close')).toBe(true);
    expect(result.some(i => i.name === 'Medium')).toBe(true);
    expect(result.some(i => i.name === 'Far')).toBe(false);
  });

  it('should sort items by distance ascending', () =>
  {
    const origin: LatLon = { latitude: 52.5200, longitude: 13.4050 };
    
    const result = findNearby(testItems, origin, 20000, 10);
    
    for (let i = 1; i < result.length; i++)
    {
      expect(result[i]!.distanceMeters).toBeGreaterThanOrEqual(result[i - 1]!.distanceMeters);
    }
  });

  it('should limit results to maxResults', () =>
  {
    const origin: LatLon = { latitude: 52.5200, longitude: 13.4050 };
    
    const result = findNearby(testItems, origin, 20000, 2);
    
    expect(result.length).toBe(2);
  });

  it('should add distanceMeters property', () =>
  {
    const origin: LatLon = { latitude: 52.5200, longitude: 13.4050 };
    
    const result = findNearby(testItems, origin, 20000, 10);
    
    result.forEach(item =>
    {
      expect(item).toHaveProperty('distanceMeters');
      expect(typeof item.distanceMeters).toBe('number');
    });
  });

  it('should preserve original properties', () =>
  {
    const origin: LatLon = { latitude: 52.5200, longitude: 13.4050 };
    
    const result = findNearby(testItems, origin, 20000, 10);
    
    const close = result.find(i => i.name === 'Close');
    expect(close?.id).toBe(1);
    expect(close?.name).toBe('Close');
  });

  it('should return empty array when no items within range', () =>
  {
    const origin: LatLon = { latitude: 0, longitude: 0 };
    
    const result = findNearby(testItems, origin, 1000, 10);
    
    expect(result).toEqual([]);
  });
});
