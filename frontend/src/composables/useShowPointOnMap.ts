import type { Ref } from 'vue';
import type { LaunchPoint } from '../types';
import type { Map as LeafletMap, Layer as LeafletLayer, Marker as LeafletMarker } from 'leaflet';

/**
 * Geographic point with coordinates
 */
export interface MapPoint {
  id: number;
  latitude: number;
  longitude: number;
}

/**
 * Marker ref type - an object with leafletObject property
 */
type MarkerRef = { leafletObject?: LeafletMarker } | null;

/**
 * Component ref that exposes markerRefs (from PublicTransportLayer)
 */
type PublicTransportLayerRef = { markerRefs?: Record<number, MarkerRef> } | null;

/**
 * Component ref that exposes markerRef (from GpsMarkerLayer)
 */
type GpsMarkerLayerRef = { markerRef?: MarkerRef } | null;

/**
 * Options for useShowPointOnMap composable
 */
interface UseShowPointOnMapOptions {
  mapRef: Ref<{ leafletObject?: LeafletMap } | null>;
  highlightedPointId: Ref<number | null>;
  showListView: Ref<boolean>;
  isMobile: Ref<boolean>;
  publicTransportLayerRef?: Ref<PublicTransportLayerRef>;
  gpsMarkerRef?: Ref<GpsMarkerLayerRef>;
}

export function useShowPointOnMap(options: UseShowPointOnMapOptions) 
{
  const { mapRef, highlightedPointId, showListView, isMobile, publicTransportLayerRef, gpsMarkerRef } = options;

  /**
   * Generic function to center map and open marker popup
   * @param lat - Latitude
   * @param lng - Longitude
   * @param zoom - Zoom level
   * @param markerRef - Optional marker ref to open popup directly
   * @param findMarkerByCoordinates - Optional function to find marker by coordinates if no ref provided
   */
  function centerAndShowMarker(
    lat: number,
    lng: number,
    zoom: number,
    markerRef?: { leafletObject?: LeafletMarker } | null,
    findMarkerByCoordinates?: (lat: number, lng: number) => LeafletMarker | null
  ): void
  {
    if (!mapRef.value?.leafletObject) return;
    
    const map = mapRef.value.leafletObject;
    
    // Force map to invalidate size in case layout changed
    map.invalidateSize();
    
    // Wait for size recalculation to complete before centering
    requestAnimationFrame(() =>
    {
      // Center map on position after size is recalculated
      map.setView([lat, lng], zoom, {
        animate: true,
        duration: 0.5
      });
      
      // Open popup after animation completes
      const openPopup = (): void =>
      {
        if (markerRef?.leafletObject)
        {
          // Direct marker ref available
          (markerRef.leafletObject as LeafletMarker).openPopup();
        }
        else if (findMarkerByCoordinates)
        {
          // Find marker by coordinates
          const marker = findMarkerByCoordinates(lat, lng);
          if (marker)
          {
            marker.openPopup();
          }
        }
      };
      
      // Wait for animation to complete (500ms duration + small buffer)
      setTimeout(openPopup, 550);
    });
  }

  function showPointOnMap(point: LaunchPoint) 
  {
    // Set highlight for list view (but not for marker size to avoid re-rendering)
    highlightedPointId.value = point.id;
    
    // Auf Mobile: Liste ausblenden, wenn "Auf Karte anzeigen" geklickt wird
    if (isMobile.value) 
    {
      showListView.value = false;
      // Wait a bit for the layout to update before centering map
      setTimeout(() => 
      {
        centerAndShowPoint(point);
      }, 100);
    }
    else 
    {
      centerAndShowPoint(point);
    }
    
    // Clear highlight after 5 seconds
    setTimeout(() => 
    {
      if (highlightedPointId.value === point.id) 
      {
        highlightedPointId.value = null;
      }
    }, 5000);
  }

  function centerAndShowPoint(point: LaunchPoint) 
  {
    // Function to find marker by coordinates (for Launch Points without direct refs)
    const findMarkerByCoordinates = (lat: number, lng: number): LeafletMarker | null =>
    {
      if (!mapRef.value?.leafletObject) return null;
      
      const map = mapRef.value.leafletObject;
      let foundMarker: LeafletMarker | null = null;
      
      map.eachLayer((layer: LeafletLayer) =>
      {
        if (foundMarker) return; // Already found
        if (layer && typeof (layer as LeafletMarker).getLatLng === 'function')
        {
          const marker = layer as LeafletMarker;
          const latlng = marker.getLatLng();
          // Use a slightly larger tolerance for coordinate matching
          if (Math.abs(latlng.lat - lat) < 0.0005 && Math.abs(latlng.lng - lng) < 0.0005)
          {
            const markerElement = marker.getElement?.();
            if (markerElement && markerElement.offsetParent !== null)
            {
              foundMarker = marker;
            }
          }
        }
      });
      
      return foundMarker;
    };
    
    centerAndShowMarker(point.latitude, point.longitude, 16, undefined, findMarkerByCoordinates);
  }

  function showStationOnMap(station: MapPoint): void
  {
    if (isMobile.value) 
    {
      showListView.value = false;
    }
    
    const markerRef = publicTransportLayerRef?.value?.markerRefs?.[station.id];
    centerAndShowMarker(station.latitude, station.longitude, 16, markerRef);
  }

  /**
   * Centers map on GPS position and opens GPS marker popup
   * @param lat - Latitude of GPS position
   * @param lng - Longitude of GPS position
   * @param zoom - Zoom level (default: 15)
   */
  function showGpsPosition(lat: number, lng: number, zoom: number = 15): void
  {
    const markerRef = gpsMarkerRef?.value?.markerRef;
    centerAndShowMarker(lat, lng, zoom, markerRef);
  }

  return {
    showPointOnMap,
    centerAndShowPoint,
    showStationOnMap,
    showGpsPosition
  };
}

