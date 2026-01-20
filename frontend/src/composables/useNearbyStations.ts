import type { PublicTransportPoint } from '../types';

/** Default maximum distance in meters for nearby stations search (2km) */
const MAX_DISTANCE_METERS = 2000;

/** Default maximum number of stations to return */
const MAX_STATIONS = 8;

/**
 * Converts degrees to radians
 * @param deg - Angle in degrees
 * @returns Angle in radians
 */
function toRad(deg: number): number
{
  return deg * (Math.PI / 180);
}

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in meters (air distance)
 */
function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number
{
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Calculates the distance between two geographic points using the Haversine formula
 * @param lat1 - Latitude of the first point
 * @param lon1 - Longitude of the first point
 * @param lat2 - Latitude of the second point
 * @param lon2 - Longitude of the second point
 * @returns Distance in meters (air distance)
 */
function calculateDistanceMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number
{
  return calculateDistanceMeters(lat1, lon1, lat2, lon2);
}

/**
 * Extends PublicTransportPoint with calculated distance information
 */
export interface NearbyStation extends PublicTransportPoint {
  /** Distance from the reference point in meters (rounded) */
  distanceMeters: number;
}

/**
 * Composable for finding nearby public transport stations based on geographic coordinates
 * @param allStations - Function returning all available public transport stations
 * @returns Object with findNearbyStations and calculateDistanceMeter functions
 */
export function useNearbyStations(allStations: () => PublicTransportPoint[])
{
  /**
   * Finds public transport stations within a specified distance, sorted by proximity
   * @param latitude - Latitude of the reference point
   * @param longitude - Longitude of the reference point
   * @param maxDistanceMeters - Maximum distance in meters (default: 2000 = 2km)
   * @param maxStations - Maximum stations to return (default: 8)
   * @returns Array of nearby stations with distance info
   */
  function findNearbyStations(
    latitude: number,
    longitude: number,
    maxDistanceMeters: number = MAX_DISTANCE_METERS,
    maxStations: number = MAX_STATIONS
  ): NearbyStation[]
  {
    const stations = allStations();
    
    const stationsWithDistance = stations
      .map(station => ({
        ...station,
        distanceMeters: calculateDistanceMeters(latitude, longitude, station.latitude, station.longitude)
      }))
      .filter(station => station.distanceMeters <= maxDistanceMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, maxStations);

    return stationsWithDistance;
  }

  return {
    findNearbyStations,
    calculateDistanceMeter
  };
}
