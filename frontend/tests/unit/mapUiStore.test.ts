import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

const mockFindNearbyStations = vi.fn();
const mockFindNearbyLaunchpoints = vi.fn();

vi.mock('@/stores/viewport', () => ({
  useViewportStore: vi.fn(() => ({
    isMobile: false
  }))
}));

vi.mock('@/stores/publicTransport', () => ({
  usePublicTransportStore: vi.fn(() => ({
    publicTransportPoints: []
  }))
}));

vi.mock('@/stores/launchPoints', () => ({
  useLaunchPointsStore: vi.fn(() => ({
    launchPoints: []
  }))
}));

vi.mock('@/composables', () => ({
  useNearbyStations: vi.fn(() => ({
    findNearbyStations: mockFindNearbyStations
  })),
  useNearbyLaunchpoints: vi.fn(() => ({
    findNearbyLaunchpoints: mockFindNearbyLaunchpoints
  }))
}));

describe('useMapUiStore', () =>
{
  beforeEach(() =>
  {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockFindNearbyStations.mockReturnValue([]);
    mockFindNearbyLaunchpoints.mockReturnValue([]);
  });

  describe('hasOpenPopup', () =>
  {
    it('should be false when nothing is selected', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      expect(store.hasOpenPopup).toBe(false);
    });

    it('should be true when a launch point popup is open', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });

      expect(store.hasOpenPopup).toBe(true);
    });

    it('should be true when a station popup is open', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handleStationPopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });

      expect(store.hasOpenPopup).toBe(true);
    });

    it('should only allow one popup at a time - station replaces point', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });
      store.handleStationPopupOpen({ id: 2, latitude: 48.1, longitude: 11.1 });

      expect(store.hasOpenPopup).toBe(true);
      expect(store.selectedPointId).toBeNull();
      expect(store.selectedStationId).toBe(2);
      expect(store.nearbyStations).toEqual([]);
    });

    it('should only allow one popup at a time - point replaces station', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handleStationPopupOpen({ id: 2, latitude: 48.1, longitude: 11.1 });
      store.handlePopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });

      expect(store.hasOpenPopup).toBe(true);
      expect(store.selectedPointId).toBe(1);
      expect(store.selectedStationId).toBeNull();
      expect(store.nearbyLaunchpoints).toEqual([]);
    });

    it('should be false after all popups are closed', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });
      store.handleStationPopupOpen({ id: 2, latitude: 48.1, longitude: 11.1 });
      store.handlePopupClose();
      store.handleStationPopupClose();

      expect(store.hasOpenPopup).toBe(false);
    });
  });

  describe('handlePopupOpen', () =>
  {
    it('should set selectedPointId', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 42, latitude: 48.0, longitude: 11.0 });

      expect(store.selectedPointId).toBe(42);
    });

    it('should call findNearbyStations with correct coordinates', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 1, latitude: 48.123, longitude: 11.456 });

      expect(mockFindNearbyStations).toHaveBeenCalledWith(48.123, 11.456);
    });

    it('should populate nearbyStations with result', async () =>
    {
      const mockStations = [
        { id: 1, name: 'Station A', distance: 500 },
        { id: 2, name: 'Station B', distance: 800 }
      ];
      mockFindNearbyStations.mockReturnValue(mockStations);

      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });

      expect(store.nearbyStations).toEqual(mockStations);
    });
  });

  describe('handlePopupClose', () =>
  {
    it('should reset selectedPointId to null', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 42, latitude: 48.0, longitude: 11.0 });
      store.handlePopupClose();

      expect(store.selectedPointId).toBeNull();
    });

    it('should clear nearbyStations', async () =>
    {
      const mockStations = [{ id: 1, name: 'Station A', distance: 500 }];
      mockFindNearbyStations.mockReturnValue(mockStations);

      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handlePopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });
      expect(store.nearbyStations).toHaveLength(1);

      store.handlePopupClose();
      expect(store.nearbyStations).toEqual([]);
    });
  });

  describe('handleStationPopupOpen', () =>
  {
    it('should set selectedStationId', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handleStationPopupOpen({ id: 99, latitude: 48.0, longitude: 11.0 });

      expect(store.selectedStationId).toBe(99);
    });

    it('should call findNearbyLaunchpoints with correct coordinates', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handleStationPopupOpen({ id: 1, latitude: 47.999, longitude: 10.888 });

      expect(mockFindNearbyLaunchpoints).toHaveBeenCalledWith(47.999, 10.888);
    });

    it('should populate nearbyLaunchpoints with result', async () =>
    {
      const mockLaunchpoints = [
        { id: 1, name: 'Point A', distance: 300 },
        { id: 2, name: 'Point B', distance: 600 }
      ];
      mockFindNearbyLaunchpoints.mockReturnValue(mockLaunchpoints);

      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handleStationPopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });

      expect(store.nearbyLaunchpoints).toEqual(mockLaunchpoints);
    });
  });

  describe('handleStationPopupClose', () =>
  {
    it('should reset selectedStationId to null', async () =>
    {
      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handleStationPopupOpen({ id: 99, latitude: 48.0, longitude: 11.0 });
      store.handleStationPopupClose();

      expect(store.selectedStationId).toBeNull();
    });

    it('should clear nearbyLaunchpoints', async () =>
    {
      const mockLaunchpoints = [{ id: 1, name: 'Point A', distance: 300 }];
      mockFindNearbyLaunchpoints.mockReturnValue(mockLaunchpoints);

      const { useMapUiStore } = await import('@/stores/mapUi');
      const store = useMapUiStore();

      store.handleStationPopupOpen({ id: 1, latitude: 48.0, longitude: 11.0 });
      expect(store.nearbyLaunchpoints).toHaveLength(1);

      store.handleStationPopupClose();
      expect(store.nearbyLaunchpoints).toEqual([]);
    });
  });
});
