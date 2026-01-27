import type { Marker as LeafletMarker } from 'leaflet';

/**
 * Vue-Leaflet component ref structure.
 * Vue-Leaflet components expose their Leaflet objects via `leafletObject`.
 */
export interface VueLeafletComponentRef
{
  leafletObject?: LeafletMarker;
}

/**
 * Extracts the Leaflet marker from a Vue-Leaflet component ref.
 * 
 * Vue-Leaflet components (LMarker, etc.) expose their underlying Leaflet
 * objects via the `leafletObject` property. This helper safely extracts
 * the marker for direct Leaflet API calls (e.g., openPopup).
 * 
 * @param componentRef - Vue component ref from LMarker or similar
 * @returns The Leaflet marker, or undefined if not available
 * 
 * @example
 * const markerRefs = ref<Record<number, VueLeafletComponentRef>>({});
 * const marker = getLeafletMarker(markerRefs.value[stationId]);
 * marker?.openPopup();
 */
export function getLeafletMarker(componentRef: VueLeafletComponentRef | null | undefined): LeafletMarker | undefined
{
  return componentRef?.leafletObject;
}

/**
 * Wraps a Leaflet marker in the format expected by centerAndShowMarker.
 * 
 * @param componentRef - Vue component ref from LMarker or similar
 * @returns Object with leafletObject property, or undefined
 */
export function toMarkerRef(componentRef: VueLeafletComponentRef | null | undefined): { leafletObject: LeafletMarker } | undefined
{
  const marker = getLeafletMarker(componentRef);
  return marker ? { leafletObject: marker } : undefined;
}

/**
 * Safely opens a popup on a Vue-Leaflet marker component ref.
 * 
 * @param componentRef - Vue component ref from LMarker or similar
 * @returns true if popup was opened, false otherwise
 */
export function openMarkerPopup(componentRef: VueLeafletComponentRef | null | undefined): boolean
{
  const marker = getLeafletMarker(componentRef);
  if (marker)
  {
    marker.openPopup();
    return true;
  }
  return false;
}
