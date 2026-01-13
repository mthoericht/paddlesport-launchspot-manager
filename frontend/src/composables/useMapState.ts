import { ref } from 'vue';
import type { LeafletEvent, Map as LeafletMap, LatLngBoundsExpression, FitBoundsOptions } from 'leaflet';

/**
 * Latitude/longitude tuple for map coordinates
 */
type LatLngTuple = [number, number];

// Default: Deutschland Mitte
const DEFAULT_CENTER: LatLngTuple = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;

export function useMapState(initialCenter?: LatLngTuple, initialZoom?: number) 
{
  const mapCenter = ref<LatLngTuple>(initialCenter || [...DEFAULT_CENTER]);
  const zoom = ref(initialZoom ?? DEFAULT_ZOOM);
  const currentCenter = ref<LatLngTuple>(initialCenter || [...DEFAULT_CENTER]);
  const currentZoom = ref(initialZoom ?? DEFAULT_ZOOM);

  function handleMapMoveEnd(e: LeafletEvent): void 
  {
    const map = e.target as LeafletMap;
    const center = map.getCenter();
    currentCenter.value = [center.lat, center.lng];
    currentZoom.value = map.getZoom();
  }

  function setMapView(center: LatLngTuple, newZoom?: number): void 
  {
    mapCenter.value = center;
    if (newZoom !== undefined) 
    {
      zoom.value = newZoom;
    }
  }

  function fitBounds(mapRef: { leafletObject?: LeafletMap } | null, bounds: LatLngBoundsExpression, options?: FitBoundsOptions): void 
  {
    if (mapRef?.leafletObject) 
    {
      mapRef.leafletObject.fitBounds(bounds, options || { maxZoom: 17, padding: [20, 20] });
    }
  }

  return {
    mapCenter,
    zoom,
    currentCenter,
    currentZoom,
    handleMapMoveEnd,
    setMapView,
    fitBounds,
    DEFAULT_CENTER,
    DEFAULT_ZOOM
  };
}

