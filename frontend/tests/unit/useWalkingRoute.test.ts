import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWalkingRoute } from '@/composables/useWalkingRoute';

describe('useWalkingRoute', () =>
{
  const mockOSRMResponse = {
    code: 'Ok',
    routes: [
      {
        geometry: {
          type: 'LineString',
          coordinates: [
            [13.4050, 52.5200],
            [13.4060, 52.5210],
            [13.4070, 52.5220]
          ]
        },
        distance: 350,
        duration: 240
      }
    ]
  };

  beforeEach(() =>
  {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() =>
  {
    vi.unstubAllGlobals();
  });

  describe('initial state', () =>
  {
    it('should have empty route initially', () =>
    {
      const { route } = useWalkingRoute();
      expect(route.value).toEqual([]);
    });

    it('should have zero distance initially', () =>
    {
      const { distance } = useWalkingRoute();
      expect(distance.value).toBe(0);
    });

    it('should have zero duration initially', () =>
    {
      const { duration } = useWalkingRoute();
      expect(duration.value).toBe(0);
    });

    it('should not be loading initially', () =>
    {
      const { isLoading } = useWalkingRoute();
      expect(isLoading.value).toBe(false);
    });

    it('should have no error initially', () =>
    {
      const { error } = useWalkingRoute();
      expect(error.value).toBeNull();
    });
  });

  describe('fetchWalkingRoute', () =>
  {
    it('should set isLoading to true while fetching', async () =>
    {
      let resolvePromise: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) =>
      {
        resolvePromise = resolve;
      });
      (fetch as ReturnType<typeof vi.fn>).mockReturnValue(fetchPromise);

      const { fetchWalkingRoute, isLoading } = useWalkingRoute();
      const promise = fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(isLoading.value).toBe(true);

      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      } as Response);

      await promise;
      expect(isLoading.value).toBe(false);
    });

    it('should call OSRM API with correct URL', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const { fetchWalkingRoute } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(fetch).toHaveBeenCalledWith(
        'https://routing.openstreetmap.de/routed-foot/route/v1/foot/13.405,52.52;13.407,52.522?overview=full&geometries=geojson'
      );
    });

    it('should populate route with coordinates swapped from lng,lat to lat,lng', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const { fetchWalkingRoute, route } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(route.value).toEqual([
        [52.5200, 13.4050],
        [52.5210, 13.4060],
        [52.5220, 13.4070]
      ]);
    });

    it('should set distance from response', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const { fetchWalkingRoute, distance } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(distance.value).toBe(350);
    });

    it('should set duration from response', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const { fetchWalkingRoute, duration } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(duration.value).toBe(240);
    });

    it('should clear previous error on new fetch', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOSRMResponse)
        });

      const { fetchWalkingRoute, error } = useWalkingRoute();

      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);
      expect(error.value).toBe('Network error');

      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);
      expect(error.value).toBeNull();
    });
  });

  describe('error handling', () =>
  {
    it('should set error on HTTP error', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500
      });

      const { fetchWalkingRoute, error } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(error.value).toBe('HTTP error: 500');
    });

    it('should set error when OSRM returns non-Ok code', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 'NoRoute', routes: [] })
      });

      const { fetchWalkingRoute, error } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(error.value).toBe('No route found');
    });

    it('should set error when no routes in response', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 'Ok', routes: [] })
      });

      const { fetchWalkingRoute, error } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(error.value).toBe('No route found');
    });

    it('should set error on network failure', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Failed to fetch'));

      const { fetchWalkingRoute, error } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(error.value).toBe('Failed to fetch');
    });

    it('should reset route, distance, duration on error', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockOSRMResponse)
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const { fetchWalkingRoute, route, distance, duration } = useWalkingRoute();

      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);
      expect(route.value.length).toBeGreaterThan(0);

      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);
      expect(route.value).toEqual([]);
      expect(distance.value).toBe(0);
      expect(duration.value).toBe(0);
    });

    it('should handle unknown error types', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValue('string error');

      const { fetchWalkingRoute, error } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(error.value).toBe('Unknown error');
    });
  });

  describe('clearRoute', () =>
  {
    it('should clear route', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const { fetchWalkingRoute, clearRoute, route } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(route.value.length).toBeGreaterThan(0);

      clearRoute();
      expect(route.value).toEqual([]);
    });

    it('should reset distance', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const { fetchWalkingRoute, clearRoute, distance } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      clearRoute();
      expect(distance.value).toBe(0);
    });

    it('should reset duration', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const { fetchWalkingRoute, clearRoute, duration } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      clearRoute();
      expect(duration.value).toBe(0);
    });

    it('should clear error', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Test error'));

      const { fetchWalkingRoute, clearRoute, error } = useWalkingRoute();
      await fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(error.value).toBe('Test error');

      clearRoute();
      expect(error.value).toBeNull();
    });
  });

  describe('multiple instances', () =>
  {
    it('should maintain separate state for different instances', async () =>
    {
      (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockOSRMResponse)
      });

      const instance1 = useWalkingRoute();
      const instance2 = useWalkingRoute();

      await instance1.fetchWalkingRoute(52.5200, 13.4050, 52.5220, 13.4070);

      expect(instance1.route.value.length).toBeGreaterThan(0);
      expect(instance2.route.value).toEqual([]);
    });
  });
});
