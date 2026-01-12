import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMapNavigation } from '@/composables/useMapNavigation';
import type { LaunchPoint } from '@/types';

// Mock vue-router
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

describe('useMapNavigation', () =>
{
  beforeEach(() =>
  {
    vi.clearAllMocks();
    mockPush.mockClear();
    // Reset window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true
    });
    // Reset window.open
    window.open = vi.fn();
  });

  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  describe('openNavigation', () =>
  {
    it('should use geo: URL scheme on mobile devices', () =>
    {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      const { openNavigation } = useMapNavigation();
      openNavigation(52.5200, 13.4050, 'Test Location');

      expect(window.location.href).toBe('geo:52.52,13.405?q=Test%20Location');
    });

    it('should use Google Maps web on desktop', () =>
    {
      // Mock desktop user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true
      });

      const { openNavigation } = useMapNavigation();
      openNavigation(52.5200, 13.4050);

      expect(window.open).toHaveBeenCalledWith(
        'https://www.google.com/maps/dir/?api=1&destination=52.52,13.405',
        '_blank'
      );
    });

    it('should use default name if not provided', () =>
    {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        writable: true
      });

      const { openNavigation } = useMapNavigation();
      openNavigation(52.5200, 13.4050);

      expect(window.location.href).toContain('52.52,13.405');
      expect(window.location.href).toContain('q=52.52%2C13.405');
    });

    it('should handle Android devices', () =>
    {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11)',
        writable: true
      });

      const { openNavigation } = useMapNavigation();
      openNavigation(52.5200, 13.4050, 'Berlin');

      expect(window.location.href).toBe('geo:52.52,13.405?q=Berlin');
    });
  });

  describe('openDetail', () =>
  {
    it('should navigate to detail page', () =>
    {
      const point: LaunchPoint = {
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

      const { openDetail } = useMapNavigation();
      openDetail(point);

      expect(mockPush).toHaveBeenCalledWith('/launch-point/1');
    });
  });

  describe('addPointAtLocation', () =>
  {
    it('should navigate with correct query parameters', () =>
    {
      const { addPointAtLocation } = useMapNavigation();
      addPointAtLocation(52.5200, 13.4050, 14);

      expect(mockPush).toHaveBeenCalledWith({
        path: '/launch-point/new',
        query: {
          lat: '52.520000',
          lng: '13.405000',
          zoom: '14'
        }
      });
    });
  });

  describe('addPointWithCurrentView', () =>
  {
    it('should navigate with center coordinates', () =>
    {
      const { addPointWithCurrentView } = useMapNavigation();
      addPointWithCurrentView(52.5200, 13.4050, 12);

      expect(mockPush).toHaveBeenCalledWith({
        path: '/launch-point/new',
        query: {
          centerLat: '52.520000',
          centerLng: '13.405000',
          zoom: '12'
        }
      });
    });
  });

  describe('navigateToPoint', () =>
  {
    it('should navigate to map with highlight parameters', () =>
    {
      const point = {
        id: 42,
        latitude: 52.5200,
        longitude: 13.4050
      };

      const { navigateToPoint } = useMapNavigation();
      navigateToPoint(point);

      expect(mockPush).toHaveBeenCalledWith({
        path: '/map',
        query: {
          highlight: '42',
          lat: '52.52',
          lng: '13.405'
        }
      });
    });

    it('should handle point with optional name', () =>
    {
      const point = {
        id: 1,
        latitude: 48.137,
        longitude: 11.575,
        name: 'Munich Point'
      };

      const { navigateToPoint } = useMapNavigation();
      navigateToPoint(point);

      expect(mockPush).toHaveBeenCalledWith({
        path: '/map',
        query: {
          highlight: '1',
          lat: '48.137',
          lng: '11.575'
        }
      });
    });
  });

  describe('navigateToStation', () =>
  {
    it('should navigate to map with station parameters', () =>
    {
      const station = {
        id: 123,
        latitude: 52.5200,
        longitude: 13.4050,
        name: 'Alexanderplatz'
      };

      const { navigateToStation } = useMapNavigation();
      navigateToStation(station);

      expect(mockPush).toHaveBeenCalledWith({
        path: '/map',
        query: {
          stationId: '123',
          stationLat: '52.52',
          stationLng: '13.405',
          stationName: 'Alexanderplatz'
        }
      });
    });

    it('should handle station without name', () =>
    {
      const station = {
        id: 456,
        latitude: 48.137,
        longitude: 11.575
      };

      const { navigateToStation } = useMapNavigation();
      navigateToStation(station);

      expect(mockPush).toHaveBeenCalledWith({
        path: '/map',
        query: {
          stationId: '456',
          stationLat: '48.137',
          stationLng: '11.575',
          stationName: undefined
        }
      });
    });
  });
});

