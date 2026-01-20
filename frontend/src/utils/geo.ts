export interface LatLon {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_M = 6371000;

function toRad(deg: number): number
{
  return deg * (Math.PI / 180);
}

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

export type WithDistance<T> = T & { distanceMeters: number };

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
