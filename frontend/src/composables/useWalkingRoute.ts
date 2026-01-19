import { ref, type Ref } from 'vue';

export interface WalkingRouteState
{
  route: Ref<[number, number][]>;
  distance: Ref<number>;
  duration: Ref<number>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
}

interface OSRMResponse
{
  code: string;
  routes: {
    geometry: {
      type: string;
      coordinates: [number, number][];
    };
    distance: number;
    duration: number;
  }[];
}

/**
 * Composable for fetching walking routes from OSRM routing API
 * @returns Reactive state and functions for managing walking routes
 */
export function useWalkingRoute()
{
  const route = ref<[number, number][]>([]);
  const distance = ref<number>(0);
  const duration = ref<number>(0);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * Fetches a walking route between two points using the OSRM API
   * @param fromLat - Latitude of the starting point
   * @param fromLng - Longitude of the starting point
   * @param toLat - Latitude of the destination point
   * @param toLng - Longitude of the destination point
   */
  async function fetchWalkingRoute(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): Promise<void>
  {
    isLoading.value = true;
    error.value = null;

    try
    {
      const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
      const response = await fetch(url);

      if (!response.ok)
      {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const data: OSRMResponse = await response.json();

      const routeData = data.routes?.[0];
      if (data.code !== 'Ok' || !routeData)
      {
        throw new Error('No route found');
      }
      
      route.value = routeData.geometry.coordinates.map(
        ([lng, lat]) => [lat, lng] as [number, number]
      );
      distance.value = routeData.distance;
      duration.value = routeData.duration;
    }
    catch (err)
    {
      error.value = err instanceof Error ? err.message : 'Unknown error';
      route.value = [];
      distance.value = 0;
      duration.value = 0;
    }
    finally
    {
      isLoading.value = false;
    }
  }

  /**
   * Clears the current route and resets all state
   */
  function clearRoute(): void
  {
    route.value = [];
    distance.value = 0;
    duration.value = 0;
    error.value = null;
  }

  return {
    route,
    distance,
    duration,
    isLoading,
    error,
    fetchWalkingRoute,
    clearRoute
  };
}
