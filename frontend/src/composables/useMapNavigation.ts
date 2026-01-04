import { useRouter } from 'vue-router';
import type { LaunchPoint } from '../types';

export function useMapNavigation() 
{
  const router = useRouter();

  function openDetail(point: LaunchPoint): void 
  {
    router.push(`/launch-point/${point.id}`);
  }

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
   * Opens navigation using the best available method:
   * - Mobile: geo: URL scheme (RFC 5870) - opens default navigation app
   *   Supports: HERE, Waze, Google Maps, Apple Maps, etc.
   * - Desktop: Google Maps web
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
    openNavigation
  };
}

