import type { LaunchPoint } from '../types';
import type { WithDistance } from '../utils/geo';
import { createUseNearby } from './useNearby';

/**
 * A launch point with calculated distance from origin.
 */
export type NearbyLaunchpoint = WithDistance<LaunchPoint>;

/**
 * Composable for finding nearby launch points.
 * Uses Haversine formula for distance calculation.
 *
 * @param allLaunchpoints - Function returning all available launch points
 * @returns Object with findNearbyLaunchpoints function
 */
export function useNearbyLaunchpoints(allLaunchpoints: () => LaunchPoint[])
{
  const { findNearbyItems, haversineDistanceMeters } = createUseNearby(allLaunchpoints);

  return {
    findNearbyLaunchpoints: findNearbyItems,
    calculateDistanceMeters: haversineDistanceMeters
  };
}
