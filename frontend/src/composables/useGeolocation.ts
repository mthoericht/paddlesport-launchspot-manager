import { ref, onUnmounted } from 'vue';

/**
 * Geolocation position with accuracy and heading
 */
interface GeolocationPosition {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;  // Direction in degrees (0 = North, 90 = East, etc.), null if unavailable
  speed: number | null;    // Speed in m/s, null if unavailable
}

/**
 * Format a coordinate value to DMS (degrees, minutes, seconds) format
 * @param value - The coordinate value (latitude or longitude)
 * @param isLat - Whether this is a latitude (true) or longitude (false)
 * @returns Formatted string like "48° 8' 30.12" N"
 */
export function formatCoordinate(value: number, isLat: boolean): string
{
  const direction = isLat 
    ? (value >= 0 ? 'N' : 'S') 
    : (value >= 0 ? 'E' : 'W');
  const absValue = Math.abs(value);
  const degrees = Math.floor(absValue);
  const minutes = Math.floor((absValue - degrees) * 60);
  const seconds = ((absValue - degrees) * 60 - minutes) * 60;
  return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${direction}`;
}

/**
 * Convert heading degrees to compass direction
 * @param heading - Heading in degrees (0 = North, 90 = East, etc.)
 * @returns Compass direction like "N", "NO", "O", etc.
 */
export function getCompassDirection(heading: number): string
{
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'] as const;
  const index = Math.round(heading / 45) % 8;
  return directions[index] ?? 'N';
}

export function useGeolocation() 
{
  const currentPosition = ref<GeolocationPosition | null>(null);
  const positionError = ref<string | null>(null);
  const isLocating = ref(false);
  let watchId: number | null = null;

  /**
   * Gets the current geolocation position once
   * @returns Promise that resolves with the current position
   */
  function getCurrentPosition(): Promise<GeolocationPosition> 
  {
    return new Promise((resolve, reject) => 
    {
      if (!navigator.geolocation) 
      {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      isLocating.value = true;
      positionError.value = null;

      navigator.geolocation.getCurrentPosition(
        (position) => 
        {
          const pos: GeolocationPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            heading: position.coords.heading,
            speed: position.coords.speed
          };
          currentPosition.value = pos;
          isLocating.value = false;
          resolve(pos);
        },
        (error) => 
        {
          isLocating.value = false;
          let errorMessage = 'Unable to retrieve your location';
          
          switch (error.code) 
          {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          
          positionError.value = errorMessage;
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  /**
   * Starts watching the geolocation position and updates it automatically
   * Does nothing if already watching
   */
  function watchPosition(): void 
  {
    if (!navigator.geolocation) 
    {
      positionError.value = 'Geolocation is not supported by this browser';
      return;
    }

    if (watchId !== null) 
    {
      // Already watching
      return;
    }

    isLocating.value = true;
    positionError.value = null;

    watchId = navigator.geolocation.watchPosition(
      (position) => 
      {
        currentPosition.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          heading: position.coords.heading,
          speed: position.coords.speed
        };
        isLocating.value = false;
      },
      (error) => 
      {
        isLocating.value = false;
        let errorMessage = 'Unable to retrieve your location';
        
        switch (error.code) 
        {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        positionError.value = errorMessage;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Accept cached position up to 1 minute old
      }
    );
  }

  /**
   * Stops watching the geolocation position
   */
  function stopWatching(): void 
  {
    if (watchId !== null) 
    {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  onUnmounted(() => 
  {
    stopWatching();
  });

  return {
    currentPosition,
    positionError,
    isLocating,
    getCurrentPosition,
    watchPosition,
    stopWatching
  };
}
