import type { LaunchPoint } from '../types';
import { findNearby, haversineDistanceMeters, type WithDistance } from '../utils/geo';

const MAX_DISTANCE_METERS = 2000;
const MAX_LAUNCHPOINTS = 8;

export type NearbyLaunchpoint = WithDistance<LaunchPoint>;

export function useNearbyLaunchpoints(allLaunchpoints: () => LaunchPoint[])
{
  function findNearbyLaunchpoints(
    latitude: number,
    longitude: number,
    maxDistanceMeters: number = MAX_DISTANCE_METERS,
    maxLaunchpoints: number = MAX_LAUNCHPOINTS
  ): NearbyLaunchpoint[]
  {
    return findNearby(
      allLaunchpoints(),
      { latitude, longitude },
      maxDistanceMeters,
      maxLaunchpoints
    );
  }

  return {
    findNearbyLaunchpoints,
    calculateDistanceMeters: haversineDistanceMeters
  };
}
