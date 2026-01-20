import { findNearby, haversineDistanceMeters, type LatLon, type WithDistance } from '../utils/geo';

/**
 * Default configuration for nearby item searches.
 */
export interface UseNearbyDefaults {
  maxDistanceMeters: number;
  maxResults: number;
}

const DEFAULT_CONFIG: UseNearbyDefaults = {
  maxDistanceMeters: 2000,
  maxResults: 8
};

/**
 * Factory to create "nearby" finders for any LatLon item type.
 * Provides a consistent interface for finding items within a certain distance.
 *
 * @typeParam T - Any item type that extends LatLon (has latitude/longitude)
 * @param allItems - Function that returns all available items to search
 * @param defaults - Optional configuration for max distance and results
 * @returns Object with findNearbyItems function
 */
export function createUseNearby<T extends LatLon>(
  allItems: () => T[],
  defaults: UseNearbyDefaults = DEFAULT_CONFIG
)
{
  /**
   * Finds items near a given coordinate.
   *
   * @param latitude - Origin latitude in decimal degrees
   * @param longitude - Origin longitude in decimal degrees
   * @param maxDistanceMeters - Maximum distance filter (default: 2000m)
   * @param maxResults - Maximum number of results (default: 8)
   * @returns Array of items with distanceMeters property, sorted by distance
   */
  function findNearbyItems(
    latitude: number,
    longitude: number,
    maxDistanceMeters: number = defaults.maxDistanceMeters,
    maxResults: number = defaults.maxResults
  ): WithDistance<T>[]
  {
    return findNearby(allItems(), { latitude, longitude }, maxDistanceMeters, maxResults);
  }

  return {
    findNearbyItems,
    haversineDistanceMeters
  };
}
