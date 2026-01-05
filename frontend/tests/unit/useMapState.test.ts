import { describe, it, expect, vi } from 'vitest';
import { useMapState } from '@/composables/useMapState';
import type { LeafletEvent, Map as LeafletMap } from 'leaflet';

describe('useMapState', () =>
{
  it('should initialize with default values', () =>
  {
    const { mapCenter, zoom, currentCenter, currentZoom, DEFAULT_CENTER, DEFAULT_ZOOM } = useMapState();

    expect(mapCenter.value).toEqual(DEFAULT_CENTER);
    expect(zoom.value).toBe(DEFAULT_ZOOM);
    expect(currentCenter.value).toEqual(DEFAULT_CENTER);
    expect(currentZoom.value).toBe(DEFAULT_ZOOM);
  });

  it('should initialize with custom values', () =>
  {
    const customCenter: [number, number] = [52.5200, 13.4050];
    const customZoom = 12;

    const { mapCenter, zoom, currentCenter, currentZoom } = useMapState(customCenter, customZoom);

    expect(mapCenter.value).toEqual(customCenter);
    expect(zoom.value).toBe(customZoom);
    expect(currentCenter.value).toEqual(customCenter);
    expect(currentZoom.value).toBe(customZoom);
  });

  describe('setMapView', () =>
  {
    it('should update map center and zoom', () =>
    {
      const { mapCenter, zoom, setMapView } = useMapState();
      const newCenter: [number, number] = [52.5200, 13.4050];
      const newZoom = 15;

      setMapView(newCenter, newZoom);

      expect(mapCenter.value).toEqual(newCenter);
      expect(zoom.value).toBe(newZoom);
    });

    it('should update only center if zoom is not provided', () =>
    {
      const { mapCenter, zoom, setMapView } = useMapState();
      const initialZoom = zoom.value;
      const newCenter: [number, number] = [52.5200, 13.4050];

      setMapView(newCenter);

      expect(mapCenter.value).toEqual(newCenter);
      expect(zoom.value).toBe(initialZoom);
    });
  });

  describe('handleMapMoveEnd', () =>
  {
    it('should update current center and zoom from map event', () =>
    {
      const { currentCenter, currentZoom, handleMapMoveEnd } = useMapState();

      const mockMap = {
        getCenter: vi.fn(() => ({ lat: 52.5200, lng: 13.4050 })),
        getZoom: vi.fn(() => 14)
      } as unknown as LeafletMap;

      const mockEvent = {
        target: mockMap
      } as LeafletEvent;

      handleMapMoveEnd(mockEvent);

      expect(currentCenter.value).toEqual([52.5200, 13.4050]);
      expect(currentZoom.value).toBe(14);
    });
  });

  describe('fitBounds', () =>
  {
    it('should call fitBounds on map if leafletObject exists', () =>
    {
      const { fitBounds } = useMapState();
      const mockFitBounds = vi.fn();
      
      const mockMap = {
        fitBounds: mockFitBounds
      } as unknown as LeafletMap;

      const mapRef = {
        leafletObject: mockMap
      };

      const bounds: [[number, number], [number, number]] = [
        [52.0, 13.0],
        [53.0, 14.0]
      ];

      fitBounds(mapRef, bounds);

      expect(mockFitBounds).toHaveBeenCalledWith(
        bounds,
        { maxZoom: 17, padding: [20, 20] }
      );
    });

    it('should use custom options if provided', () =>
    {
      const { fitBounds } = useMapState();
      const mockFitBounds = vi.fn();
      
      const mockMap = {
        fitBounds: mockFitBounds
      } as unknown as LeafletMap;

      const mapRef = {
        leafletObject: mockMap
      };

      const bounds: [[number, number], [number, number]] = [
        [52.0, 13.0],
        [53.0, 14.0]
      ];

      const customOptions: { maxZoom: number; padding: [number, number] } = { maxZoom: 15, padding: [10, 10] };

      fitBounds(mapRef, bounds, customOptions);

      expect(mockFitBounds).toHaveBeenCalledWith(bounds, customOptions);
    });

    it('should not call fitBounds if mapRef is null', () =>
    {
      const { fitBounds } = useMapState();
      const bounds: [[number, number], [number, number]] = [
        [52.0, 13.0],
        [53.0, 14.0]
      ];

      // Should not throw
      expect(() => fitBounds(null, bounds)).not.toThrow();
    });

    it('should not call fitBounds if leafletObject is missing', () =>
    {
      const { fitBounds } = useMapState();
      const mapRef = {};

      const bounds: [[number, number], [number, number]] = [
        [52.0, 13.0],
        [53.0, 14.0]
      ];

      // Should not throw
      expect(() => fitBounds(mapRef, bounds)).not.toThrow();
    });
  });
});

