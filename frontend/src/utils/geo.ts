/**
 * Geographic coordinates in WGS84 decimal degrees.
 */
export interface LatLon {
  latitude: number;
  longitude: number;
}

/** Earth radius in meters (WGS84 mean radius) */
const EARTH_RADIUS_M = 6_371_000;

/**
 * Converts degrees to radians.
 * @param deg - Angle in degrees
 * @returns Angle in radians
 */
function toRad(deg: number): number
{
  return deg * (Math.PI / 180);
}

/**
 * Computes the great-circle distance between two coordinates using the Haversine formula.
 *
 * @param a - First coordinate (lat/lon in decimal degrees)
 * @param b - Second coordinate (lat/lon in decimal degrees)
 * @returns Distance in meters (rounded to nearest meter)
 */
export function haversineDistanceMeters(a: LatLon, b: LatLon): number
{
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * (sinDLon * sinDLon);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.round(EARTH_RADIUS_M * c);
}

/**
 * Extends a type T with a distanceMeters property.
 * @typeParam T - Base type to extend
 */
export type WithDistance<T> = T & { distanceMeters: number };

/**
 * Finds items near a given origin, sorted by distance.
 * Adds `distanceMeters` property to each result.
 *
 * @typeParam T - Any type with latitude/longitude properties
 * @param items - Source items (not mutated)
 * @param origin - Origin coordinate to measure distance from
 * @param maxDistanceMeters - Maximum distance filter (inclusive)
 * @param maxResults - Maximum number of items to return
 * @returns New array of items with `distanceMeters`, sorted ascending
 */
export function findNearby<T extends LatLon>(
  items: T[],
  origin: LatLon,
  maxDistanceMeters: number,
  maxResults: number
): WithDistance<T>[]
{
  return items
    .map(item => ({
      ...item,
      distanceMeters: haversineDistanceMeters(origin, item),
    }))
    .filter(item => item.distanceMeters <= maxDistanceMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, maxResults);
}
