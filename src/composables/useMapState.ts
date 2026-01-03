import { ref } from 'vue';

type LatLngTuple = [number, number];

// Default: Deutschland Mitte
const DEFAULT_CENTER: LatLngTuple = [51.1657, 10.4515];
const DEFAULT_ZOOM = 6;

export function useMapState(initialCenter?: LatLngTuple, initialZoom?: number) {
  const mapCenter = ref<LatLngTuple>(initialCenter || [...DEFAULT_CENTER]);
  const zoom = ref(initialZoom ?? DEFAULT_ZOOM);
  const currentCenter = ref<LatLngTuple>(initialCenter || [...DEFAULT_CENTER]);
  const currentZoom = ref(initialZoom ?? DEFAULT_ZOOM);

  function handleMapMoveEnd(e: any): void {
    const map = e.target;
    const center = map.getCenter();
    currentCenter.value = [center.lat, center.lng];
    currentZoom.value = map.getZoom();
  }

  function setMapView(center: LatLngTuple, newZoom?: number): void {
    mapCenter.value = center;
    if (newZoom !== undefined) {
      zoom.value = newZoom;
    }
  }

  function fitBounds(mapRef: any, bounds: [[number, number], [number, number]], options?: { maxZoom?: number; padding?: [number, number] }): void {
    if (mapRef?.leafletObject) {
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

