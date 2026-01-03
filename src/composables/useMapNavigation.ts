import { useRouter } from 'vue-router';
import type { LaunchPoint } from '../types';

export function useMapNavigation() {
  const router = useRouter();

  function openDetail(point: LaunchPoint): void {
    router.push(`/launch-point/${point.id}`);
  }

  function addPointAtLocation(lat: number, lng: number, zoom: number): void {
    router.push({
      path: '/launch-point/new',
      query: {
        lat: lat.toFixed(6),
        lng: lng.toFixed(6),
        zoom: zoom.toString()
      }
    });
  }

  function addPointWithCurrentView(centerLat: number, centerLng: number, zoom: number): void {
    router.push({
      path: '/launch-point/new',
      query: {
        centerLat: centerLat.toFixed(6),
        centerLng: centerLng.toFixed(6),
        zoom: zoom.toString()
      }
    });
  }

  return {
    openDetail,
    addPointAtLocation,
    addPointWithCurrentView
  };
}

