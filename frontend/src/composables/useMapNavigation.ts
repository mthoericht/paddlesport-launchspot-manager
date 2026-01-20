import { useRouter } from 'vue-router';
import type { LaunchPoint } from '../types';

/**
 * Point for map navigation (launch point or station)
 */
export interface MapNavigationPoint {
  id: number;
  latitude: number;
  longitude: number;
  name?: string;
}

export function useMapNavigation()
{
  const router = useRouter();

  /**
   * Opens the detail page for a launch point.
   * @param point - Launch point to display details for
   */
  function openDetail(point: LaunchPoint): void
  {
    router.push(`/launch-point/${point.id}`);
  }

  /**
   * Navigates to the add form with specific coordinates pre-filled.
   * @param lat - Latitude for the new point
   * @param lng - Longitude for the new point
   * @param zoom - Current map zoom level to preserve
   */
  function addPointAtLocation(lat: number, lng: number, zoom: number): void
  {
    router.push({
      path: '/launch-point/new',
      query: {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        zoom: zoom.toString()
      }
    });
  }

  /**
   * Navigates to the add form preserving current map view center.
   * @param centerLat - Current map center latitude
   * @param centerLng - Current map center longitude
   * @param zoom - Current map zoom level
   */
  function addPointWithCurrentView(centerLat: number, centerLng: number, zoom: number): void
  {
    router.push({
      path: '/launch-point/new',
      query: {
        centerLat: centerLat.toFixed(6),
        centerLng: centerLng.toFixed(6),
        zoom: zoom.toString()
      }
    });
  }

  /**
   * Navigates to the map view and highlights a launch point.
   * @param point - Point to highlight on the map
   */
  function navigateToPoint(point: MapNavigationPoint): void
  {
    router.push({
      path: '/map',
      query: {
        highlight: point.id.toString(),
        lat: point.latitude.toString(),
        lng: point.longitude.toString()
      }
    });
  }

  /**
   * Navigates to the map view and highlights a public transport station.
   * @param station - Station to highlight on the map
   */
  function navigateToStation(station: MapNavigationPoint): void
  {
    router.push({
      path: '/map',
      query: {
        stationId: station.id.toString(),
        stationLat: station.latitude.toString(),
        stationLng: station.longitude.toString(),
        stationName: station.name
      }
    });
  }

  /**
   * Opens external navigation to the specified coordinates.
   * Mobile: Uses geo: URL scheme (RFC 5870) for native app selection.
   * Desktop: Opens Google Maps in a new tab.
   *
   * @param lat - Destination latitude
   * @param lng - Destination longitude
   * @param name - Optional display name for the destination
   */
  function openNavigation(lat: number, lng: number, name?: string): void
  {
    const destination = `${lat},${lng}`;
    const displayName = name || `${lat},${lng}`;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;

    if (isMobile)
    {
      // Mobile: Use geo: URL scheme (opens default navigation app)
      // This will show a dialog to choose from installed navigation apps
      // or open the default one (HERE, Waze, Google Maps, Apple Maps, etc.)
      window.location.href = `geo:${lat},${lng}?q=${encodeURIComponent(displayName)}`;
    }
    else
    {
      // Desktop: Use Google Maps web
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
    }
  }

  return {
    openDetail,
    addPointAtLocation,
    addPointWithCurrentView,
    navigateToPoint,
    navigateToStation,
    openNavigation
  };
}
