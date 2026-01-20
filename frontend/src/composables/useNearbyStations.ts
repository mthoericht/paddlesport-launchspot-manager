import type { PublicTransportPoint } from '../types';
import type { WithDistance } from '../utils/geo';
import { createUseNearby } from './useNearby';

/**
 * A public transport station with calculated distance from origin.
 */
export type NearbyStation = WithDistance<PublicTransportPoint>;

/**
 * Composable for finding nearby public transport stations.
 * Uses Haversine formula for distance calculation.
 *
 * @param allStations - Function returning all available stations
 * @returns Object with findNearbyStations function
 */
export function useNearbyStations(allStations: () => PublicTransportPoint[])
{
  const { findNearbyItems, haversineDistanceMeters } = createUseNearby(allStations);

  return {
    findNearbyStations: findNearbyItems,
    calculateDistanceMeters: haversineDistanceMeters
  };
}
