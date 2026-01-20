import { watch, nextTick, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLaunchPointsStore } from '../../stores/launchPoints';
import { usePublicTransportStore } from '../../stores/publicTransport';
import type { LaunchPoint } from '../../types';

interface MapRef
{
  leafletObject?: {
    setView: (latlng: [number, number], zoom: number) => void;
  };
}

interface PublicTransportLayerRef
{
  markerRefs?: Record<number, unknown>;
}

interface UseMapQueryParamsOptions
{
  mapRef: Ref<MapRef | null>;
  publicTransportLayerRef: Ref<PublicTransportLayerRef | null>;
  isMobile: Ref<boolean>;
  showListView: Ref<boolean>;
  showPointOnMap: (point: LaunchPoint) => void;
  showStationOnMap: (station: { id: number; latitude: number; longitude: number }) => void;
}

/**
 * Composable for handling URL query parameters for map highlighting.
 * Handles highlighting launch points and stations from URL params (e.g., from detail view).
 */
export function useMapQueryParams(options: UseMapQueryParamsOptions)
{
  const { 
    mapRef, 
    publicTransportLayerRef, 
    isMobile, 
    showListView, 
    showPointOnMap, 
    showStationOnMap 
  } = options;
  
  const route = useRoute();
  const router = useRouter();
  const launchPointsStore = useLaunchPointsStore();
  const publicTransportStore = usePublicTransportStore();
  
  /**
   * Clear highlight query parameters from URL
   */
  function clearHighlightQueryParams(): void
  {
    router.replace({ path: route.path, query: {} });
  }
  
  /**
   * Handle highlight from query parameters (launch point or station)
   */
  function handleHighlightFromQuery(): void
  {
    const highlightId = route.query.highlight;
    const lat = route.query.lat;
    const lng = route.query.lng;
    
    // Handle station highlight from DetailView
    const stationLat = route.query.stationLat;
    const stationLng = route.query.stationLng;
    const stationId = route.query.stationId;
    
    // Handle station highlight
    if (stationLat && stationLng && stationId)
    {
      const station = {
        id: Number(stationId),
        latitude: parseFloat(stationLat as string),
        longitude: parseFloat(stationLng as string)
      };
      
      if (publicTransportLayerRef.value?.markerRefs?.[station.id])
      {
        showStationOnMap(station);
        clearHighlightQueryParams();
      }
      else
      {
        // Wait for stations to load and markers to render
        const unwatch = watch(
          () => publicTransportStore.publicTransportPoints,
          () =>
          {
            nextTick(() =>
            {
              if (publicTransportLayerRef.value?.markerRefs?.[station.id])
              {
                showStationOnMap(station);
                clearHighlightQueryParams();
                unwatch();
              }
            });
          },
          { immediate: true }
        );
      }
      return;
    }
    
    // Handle launch point highlight
    if (highlightId && lat && lng)
    {
      // On mobile: hide list when navigating from detail view
      if (isMobile.value)
      {
        showListView.value = false;
      }
      
      const pointId = Number(highlightId);
      const point = launchPointsStore.launchPoints.find(p => p.id === pointId);
      
      if (point)
      {
        showPointOnMap(point);
        clearHighlightQueryParams();
      }
      else if (mapRef.value?.leafletObject)
      {
        // Point not loaded yet, center map and wait for points to load
        mapRef.value.leafletObject.setView(
          [parseFloat(lat as string), parseFloat(lng as string)], 
          15
        );
        
        // Watch for points to load
        const unwatch = watch(
          () => launchPointsStore.launchPoints, 
          (points) =>
          {
            const foundPoint = points.find(p => p.id === pointId);
            if (foundPoint)
            {
              showPointOnMap(foundPoint);
              clearHighlightQueryParams();
              unwatch();
            }
          }, 
          { immediate: true }
        );
      }
    }
  }
  
  /**
   * Check if query has walking route parameters
   */
  function hasWalkingRouteQuery(): boolean
  {
    return route.query.walkingRoute === 'true';
  }
  
  /**
   * Check if query has highlight parameters
   */
  function hasHighlightQuery(): boolean
  {
    return !!(route.query.highlight || route.query.stationId);
  }
  
  return {
    clearHighlightQueryParams,
    handleHighlightFromQuery,
    hasWalkingRouteQuery,
    hasHighlightQuery
  };
}
