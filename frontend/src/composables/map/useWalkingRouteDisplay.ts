import { ref, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useWalkingRoute } from '../index';
import type { NearbyStation, NearbyLaunchpoint } from '../index';
import type { LaunchPoint } from '../../types';
import { openMarkerPopup, type VueLeafletComponentRef } from '../../utils/leaflet';

interface WalkingRouteTarget
{
  stationName: string;
  pointName: string;
  lat: number;
  lng: number;
}

interface WalkingRouteLayerRef
{
  markerRef?: VueLeafletComponentRef;
}

interface MapRef
{
  leafletObject?: {
    getBounds: () => { contains: (latlng: [number, number]) => boolean };
    fitBounds: (bounds: [[number, number], [number, number]], options: object) => void;
    closePopup: () => void;
  };
}

interface UseWalkingRouteDisplayOptions
{
  mapRef: Ref<MapRef | null>;
  walkingRouteLayerRef: Ref<WalkingRouteLayerRef | null>;
}

/**
 * Composable for managing walking route display on the map.
 * Handles showing routes from stations to launch points and vice versa.
 */
export function useWalkingRouteDisplay(options: UseWalkingRouteDisplayOptions)
{
  const { mapRef, walkingRouteLayerRef } = options;
  const route = useRoute();
  const router = useRouter();
  
  // Walking route composable
  const { 
    route: walkingRoute, 
    distance: walkingDistance, 
    duration: walkingDuration, 
    isLoading: walkingRouteLoading, 
    fetchWalkingRoute, 
    clearRoute: clearWalkingRoute 
  } = useWalkingRoute();
  
  // Store reference to current target for walking route popup
  const walkingRouteTarget = ref<WalkingRouteTarget | null>(null);
  
  /**
   * Fit map to walking route bounds and open popup
   */
  function fitToWalkingRouteAndShowPopup(startLat: number, startLng: number, endLat: number, endLng: number): void
  {
    if (!mapRef.value?.leafletObject) return;
    
    const map = mapRef.value.leafletObject;
    
    // Calculate bounds for the route
    const bounds: [[number, number], [number, number]] = [
      [Math.min(startLat, endLat), Math.min(startLng, endLng)],
      [Math.max(startLat, endLat), Math.max(startLng, endLng)]
    ];
    
    // Check if bounds are already visible in current view
    const mapBounds = map.getBounds();
    const routeBoundsContained = mapBounds.contains([startLat, startLng]) && mapBounds.contains([endLat, endLng]);
    
    if (!routeBoundsContained)
    {
      // Fit map to show the entire route with padding
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
    }
    
    // Open popup after map animation (or immediately if no animation needed)
    const delay = routeBoundsContained ? 100 : 600;
    setTimeout(() =>
    {
      openMarkerPopup(walkingRouteLayerRef.value?.markerRef);
    }, delay);
  }
  
  /**
   * Show walking route from station to launch point (from launch point popup)
   */
  function showWalkingRoute(station: NearbyStation, point: LaunchPoint): void
  {
    walkingRouteTarget.value = { 
      stationName: station.name, 
      pointName: point.name, 
      lat: point.latitude, 
      lng: point.longitude 
    };
    
    fetchWalkingRoute(station.latitude, station.longitude, point.latitude, point.longitude)
      .then(() =>
      {
        fitToWalkingRouteAndShowPopup(station.latitude, station.longitude, point.latitude, point.longitude);
      });
    
    // Close the launchpoint popup
    if (mapRef.value?.leafletObject)
    {
      mapRef.value.leafletObject.closePopup();
    }
  }
  
  /**
   * Show walking route from public transport station to nearby launchpoint (from station popup)
   */
  function showWalkingRouteToLaunchpoint(
    station: { name: string; latitude: number; longitude: number }, 
    launchpoint: NearbyLaunchpoint
  ): void
  {
    walkingRouteTarget.value = { 
      stationName: station.name, 
      pointName: launchpoint.name, 
      lat: launchpoint.latitude, 
      lng: launchpoint.longitude 
    };
    
    fetchWalkingRoute(station.latitude, station.longitude, launchpoint.latitude, launchpoint.longitude)
      .then(() =>
      {
        fitToWalkingRouteAndShowPopup(station.latitude, station.longitude, launchpoint.latitude, launchpoint.longitude);
      });
    
    if (mapRef.value?.leafletObject)
    {
      mapRef.value.leafletObject.closePopup();
    }
  }
  
  /**
   * Show walking route from query parameters (e.g., from detail view)
   */
  function showWalkingRouteFromQuery(): void
  {
    const { walkingRoute: hasWalkingRoute, fromLat, fromLng, toLat, toLng, stationName, pointName } = route.query;
    
    if (hasWalkingRoute !== 'true' || !fromLat || !fromLng || !toLat || !toLng) return;
    
    const startLat = parseFloat(fromLat as string);
    const startLng = parseFloat(fromLng as string);
    const endLat = parseFloat(toLat as string);
    const endLng = parseFloat(toLng as string);
    
    if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) return;
    
    // Set the walking route target for the popup
    walkingRouteTarget.value = {
      stationName: (stationName as string) || 'Station',
      pointName: (pointName as string) || 'Einsetzpunkt',
      lat: endLat,
      lng: endLng
    };
    
    // Fetch and display the walking route
    fetchWalkingRoute(startLat, startLng, endLat, endLng)
      .then(() =>
      {
        fitToWalkingRouteAndShowPopup(startLat, startLng, endLat, endLng);
      });
    
    // Clear the query parameters to avoid re-fetching on navigation
    router.replace({
      path: route.path,
      query: {}
    });
  }
  
  /**
   * Handle walking route close - clear route and target
   */
  function handleCloseWalkingRoute(): void
  {
    clearWalkingRoute();
    walkingRouteTarget.value = null;
  }
  
  return {
    // State
    walkingRoute,
    walkingDistance,
    walkingDuration,
    walkingRouteLoading,
    walkingRouteTarget,
    
    // Actions
    showWalkingRoute,
    showWalkingRouteToLaunchpoint,
    showWalkingRouteFromQuery,
    handleCloseWalkingRoute
  };
}
