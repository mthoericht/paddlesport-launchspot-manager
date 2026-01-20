import { ref } from 'vue';
import { useNearbyStations, useNearbyLaunchpoints } from '../index';
import type { NearbyStation, NearbyLaunchpoint } from '../index';
import { usePublicTransportStore } from '../../stores/publicTransport';
import { useLaunchPointsStore } from '../../stores/launchPoints';

/**
 * Composable for managing nearby popup state for launch points and public transport stations.
 * Handles the state of which popup is open and calculates nearby items.
 */
export function useNearbyPopupState()
{
  const publicTransportStore = usePublicTransportStore();
  const launchPointsStore = useLaunchPointsStore();
  
  // Nearby stations composable
  const { findNearbyStations } = useNearbyStations(() => publicTransportStore.publicTransportPoints);
  
  // Nearby launchpoints composable
  const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => launchPointsStore.launchPoints);
  
  // Nearby stations state (for launch point popups)
  const selectedPointId = ref<number | null>(null);
  const nearbyStations = ref<NearbyStation[]>([]);
  
  // Nearby launchpoints state (for public transport popups)
  const selectedStationId = ref<number | null>(null);
  const nearbyLaunchpoints = ref<NearbyLaunchpoint[]>([]);
  
  /**
   * Handle launch point popup open - calculate nearby stations
   */
  function handlePopupOpen(point: { id: number; latitude: number; longitude: number }): void
  {
    selectedPointId.value = point.id;
    nearbyStations.value = findNearbyStations(point.latitude, point.longitude);
  }
  
  /**
   * Handle launch point popup close - clear state
   */
  function handlePopupClose(): void
  {
    selectedPointId.value = null;
    nearbyStations.value = [];
  }
  
  /**
   * Handle public transport station popup open - calculate nearby launch points
   */
  function handleStationPopupOpen(station: { id: number; latitude: number; longitude: number }): void
  {
    selectedStationId.value = station.id;
    nearbyLaunchpoints.value = findNearbyLaunchpoints(station.latitude, station.longitude);
  }
  
  /**
   * Handle public transport station popup close - clear state
   */
  function handleStationPopupClose(): void
  {
    selectedStationId.value = null;
    nearbyLaunchpoints.value = [];
  }
  
  return {
    // State
    selectedPointId,
    nearbyStations,
    selectedStationId,
    nearbyLaunchpoints,
    
    // Handlers
    handlePopupOpen,
    handlePopupClose,
    handleStationPopupOpen,
    handleStationPopupClose
  };
}
