import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, type Ref } from 'vue';
import { useShowPointOnMap } from '@/composables/useShowPointOnMap';
import type { LaunchPoint } from '@/types';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

describe('useShowPointOnMap', () =>
{
  let mockMap: Partial<LeafletMap>;
  let mapRef: Ref<{ leafletObject?: LeafletMap } | null>;
  let highlightedPointId: Ref<number | null>;
  let showListView: Ref<boolean>;
  let isMobile: Ref<boolean>;
  let stationMarkerRefs: Ref<Record<number, { leafletObject?: LeafletMarker } | null>>;

  beforeEach(() =>
  {
    vi.useFakeTimers();
    
    // Mock requestAnimationFrame to execute callback synchronously
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) =>
    {
      cb(0);
      return 0;
    });
    
    // Mock Leaflet Map
    mockMap = {
      setView: vi.fn(),
      invalidateSize: vi.fn(),
      eachLayer: vi.fn((callback: (layer: any) => void) =>
      {
        // Mock marker layer
        const mockMarker = {
          getLatLng: vi.fn(() => ({ lat: 52.5200, lng: 13.4050 })),
          getElement: vi.fn(() => ({
            offsetParent: {} // Marker is visible
          })),
          isPopupOpen: vi.fn(() => false),
          openPopup: vi.fn()
        };
        callback(mockMarker);
        return mockMap as LeafletMap;
      }),
      once: vi.fn((event: string, callback: () => void) =>
      {
        // Immediately call callback for testing
        if (event === 'moveend' || event === 'zoomend')
        {
          setTimeout(callback, 0);
        }
        return mockMap as LeafletMap;
      })
    } as unknown as Partial<LeafletMap>;

    mapRef = ref({
      leafletObject: mockMap as LeafletMap
    }) as Ref<{ leafletObject?: LeafletMap } | null>;
    highlightedPointId = ref<number | null>(null);
    showListView = ref<boolean>(false);
    isMobile = ref<boolean>(false);
    stationMarkerRefs = ref<Record<number, { leafletObject?: LeafletMarker } | null>>({});
  });

  afterEach(() =>
  {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

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
    category_ids: [1],
    public_transport_stations: [],
    created_by: 1,
    creator_username: 'testuser',
    created_at: '2024-01-01T00:00:00Z'
  };

  describe('showPointOnMap', () =>
  {
    it('should set highlighted point ID', () =>
    {
      const { showPointOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      showPointOnMap(mockPoint);

      expect(highlightedPointId.value).toBe(mockPoint.id);
    });

    it('should hide list view on mobile when showing point', () =>
    {
      isMobile.value = true;
      showListView.value = true;

      const { showPointOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      showPointOnMap(mockPoint);

      expect(showListView.value).toBe(false);
    });

    it('should not hide list view on desktop when showing point', () =>
    {
      isMobile.value = false;
      showListView.value = true;

      const { showPointOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      showPointOnMap(mockPoint);

      expect(showListView.value).toBe(true);
    });

    it('should clear highlight after 5 seconds', () =>
    {
      const { showPointOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      showPointOnMap(mockPoint);
      expect(highlightedPointId.value).toBe(mockPoint.id);

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      expect(highlightedPointId.value).toBeNull();
    });

    it('should not clear highlight if point ID changed', () =>
    {
      const { showPointOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      showPointOnMap(mockPoint);
      expect(highlightedPointId.value).toBe(mockPoint.id);

      // Change highlighted point
      highlightedPointId.value = 2;

      // Fast-forward 5 seconds
      vi.advanceTimersByTime(5000);

      // Should still be 2, not null
      expect(highlightedPointId.value).toBe(2);
    });
  });

  describe('centerAndShowPoint', () =>
  {
    it('should center map on point with correct coordinates and zoom', () =>
    {
      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      expect(mockMap.setView).toHaveBeenCalledWith(
        [mockPoint.latitude, mockPoint.longitude],
        16,
        {
          animate: true,
          duration: 0.5
        }
      );
    });

    it('should invalidate map size', () =>
    {
      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      // Fast-forward past the setTimeout
      vi.advanceTimersByTime(100);

      expect(mockMap.invalidateSize).toHaveBeenCalled();
    });

    it('should not throw if mapRef is null', () =>
    {
      mapRef.value = null;

      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      expect(() => centerAndShowPoint(mockPoint)).not.toThrow();
    });

    it('should not throw if leafletObject is missing', () =>
    {
      mapRef.value = {};

      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      expect(() => centerAndShowPoint(mockPoint)).not.toThrow();
    });

    it('should call setView with animation options', () =>
    {
      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      expect(mockMap.setView).toHaveBeenCalledWith(
        [mockPoint.latitude, mockPoint.longitude],
        16,
        { animate: true, duration: 0.5 }
      );
    });

    it('should call invalidateSize on map', () =>
    {
      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      expect(mockMap.invalidateSize).toHaveBeenCalled();
    });
  });

  describe('marker finding and popup opening', () =>
  {
    it('should find marker with matching coordinates', () =>
    {
      const mockMarker = {
        getLatLng: vi.fn(() => ({ lat: 52.5200, lng: 13.4050 })),
        getElement: vi.fn(() => ({
          offsetParent: {} // Marker is visible
        })),
        isPopupOpen: vi.fn(() => false),
        openPopup: vi.fn()
      };

      (mockMap.eachLayer as any) = vi.fn((callback: (layer: any) => void) =>
      {
        callback(mockMarker);
        return mockMap as LeafletMap;
      });

      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      // Fast-forward to trigger popup opening
      vi.advanceTimersByTime(600);

      expect(mockMap.eachLayer).toHaveBeenCalled();
      expect(mockMarker.getLatLng).toHaveBeenCalled();
    });

    it('should open popup for matching marker', () =>
    {
      const mockMarker = {
        getLatLng: vi.fn(() => ({ lat: 52.5200, lng: 13.4050 })),
        getElement: vi.fn(() => ({
          offsetParent: {} // Marker is visible
        })),
        isPopupOpen: vi.fn(() => false),
        openPopup: vi.fn()
      };

      (mockMap.eachLayer as any) = vi.fn((callback: (layer: any) => void) =>
      {
        callback(mockMarker);
        return mockMap as LeafletMap;
      });

      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      // Fast-forward to trigger popup opening
      vi.advanceTimersByTime(600);

      expect(mockMarker.openPopup).toHaveBeenCalled();
    });

    it('should call openPopup even if already open (Leaflet handles this gracefully)', () =>
    {
      const mockMarker = {
        getLatLng: vi.fn(() => ({ lat: 52.5200, lng: 13.4050 })),
        getElement: vi.fn(() => ({
          offsetParent: {} // Marker is visible
        })),
        isPopupOpen: vi.fn(() => true), // Popup already open
        openPopup: vi.fn()
      };

      (mockMap.eachLayer as any) = vi.fn((callback: (layer: any) => void) =>
      {
        callback(mockMarker);
        return mockMap as LeafletMap;
      });

      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      // Fast-forward to trigger popup opening
      vi.advanceTimersByTime(600);

      // Composable unconditionally calls openPopup; Leaflet handles already-open state
      expect(mockMarker.openPopup).toHaveBeenCalled();
    });

    it('should handle markers with different coordinates', () =>
    {
      const mockMarker = {
        getLatLng: vi.fn(() => ({ lat: 53.0, lng: 14.0 })), // Different coordinates
        getElement: vi.fn(() => ({
          offsetParent: {}
        })),
        isPopupOpen: vi.fn(() => false),
        openPopup: vi.fn()
      };

      (mockMap.eachLayer as any) = vi.fn((callback: (layer: any) => void) =>
      {
        callback(mockMarker);
        return mockMap as LeafletMap;
      });

      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      // Fast-forward to trigger popup opening
      vi.advanceTimersByTime(600);

      expect(mockMarker.openPopup).not.toHaveBeenCalled();
    });

    it('should handle non-marker layers', () =>
    {
      const mockTileLayer = {
        // No getLatLng method - not a marker
      };

      (mockMap.eachLayer as any) = vi.fn((callback: (layer: any) => void) =>
      {
        callback(mockTileLayer);
        return mockMap as LeafletMap;
      });

      const { centerAndShowPoint } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
      });

      centerAndShowPoint(mockPoint);

      // Fast-forward to trigger popup opening
      vi.advanceTimersByTime(600);

      // Should not throw
      expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
    });
  });

  describe('showStationOnMap', () =>
  {
    const mockStation = {
      id: 42,
      latitude: 52.5218,
      longitude: 13.4114
    };

    it('should center map on station with correct coordinates and zoom', () =>
    {
      const { showStationOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile,
        stationMarkerRefs
      });

      showStationOnMap(mockStation);

      expect(mockMap.setView).toHaveBeenCalledWith(
        [mockStation.latitude, mockStation.longitude],
        16,
        {
          animate: true,
          duration: 0.5
        }
      );
    });

    it('should hide list view on mobile when showing station', () =>
    {
      isMobile.value = true;
      showListView.value = true;

      const { showStationOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile,
        stationMarkerRefs
      });

      showStationOnMap(mockStation);

      expect(showListView.value).toBe(false);
    });

    it('should not hide list view on desktop when showing station', () =>
    {
      isMobile.value = false;
      showListView.value = true;

      const { showStationOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile,
        stationMarkerRefs
      });

      showStationOnMap(mockStation);

      expect(showListView.value).toBe(true);
    });

    it('should open popup when station marker ref is available', () =>
    {
      const mockOpenPopup = vi.fn();
      stationMarkerRefs.value = {
        42: {
          leafletObject: {
            openPopup: mockOpenPopup
          } as unknown as LeafletMarker
        }
      };

      const { showStationOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile,
        stationMarkerRefs
      });

      showStationOnMap(mockStation);

      // Fast-forward past the setTimeout (550ms in composable)
      vi.advanceTimersByTime(600);

      expect(mockOpenPopup).toHaveBeenCalled();
    });

    it('should not throw when station marker ref is not available', () =>
    {
      stationMarkerRefs.value = {};

      const { showStationOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile,
        stationMarkerRefs
      });

      expect(() =>
      {
        showStationOnMap(mockStation);
        vi.advanceTimersByTime(400);
      }).not.toThrow();
    });

    it('should not throw when stationMarkerRefs is undefined', () =>
    {
      const { showStationOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile
        // stationMarkerRefs not provided
      });

      expect(() =>
      {
        showStationOnMap(mockStation);
        vi.advanceTimersByTime(400);
      }).not.toThrow();
    });

    it('should not throw if mapRef is null', () =>
    {
      mapRef.value = null;

      const { showStationOnMap } = useShowPointOnMap({
        mapRef,
        highlightedPointId,
        showListView,
        isMobile,
        stationMarkerRefs
      });

      expect(() => showStationOnMap(mockStation)).not.toThrow();
    });
  });
});

