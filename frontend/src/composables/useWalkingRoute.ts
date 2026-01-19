import { ref } from 'vue';

/**
 * OSRM routing API response structure
 * @see https://project-osrm.org/docs/v5.24.0/api/#responses
 */
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
 * Composable for fetching pedestrian routes from the OSRM routing API.
 * Uses OpenStreetMap Germany routing service. Coordinates are converted
 * from OSRM's [lng, lat] to Leaflet's [lat, lng] format.
 */
export function useWalkingRoute()
{
  const route = ref<[number, number][]>([]);
  const distance = ref<number>(0);
  const duration = ref<number>(0);
  const isLoading = ref<boolean>(false);
  const error = ref<string | null>(null);

  /**
   * Fetches a walking route between two points.
   * On success: populates route, distance, duration.
   * On failure: sets error and resets route data.
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

  /** Clears the current route and resets all state to initial values */
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
