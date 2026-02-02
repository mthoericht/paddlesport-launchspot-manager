import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useViewportStore } from './viewport';
import { useNearbyStations, useNearbyLaunchpoints } from '../composables';
import type { NearbyStation, NearbyLaunchpoint } from '../composables';
import { usePublicTransportStore } from './publicTransport';
import { useLaunchPointsStore } from './launchPoints';

/**
 * Pinia store for map UI state.
 * Manages UI-related state that needs to be shared across map components.
 */
export const useMapUiStore = defineStore('mapUi', () =>
{
  const viewportStore = useViewportStore();
  const publicTransportStore = usePublicTransportStore();
  const launchPointsStore = useLaunchPointsStore();

  // Nearby composables
  const { findNearbyStations } = useNearbyStations(() => publicTransportStore.publicTransportPoints);
  const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => launchPointsStore.launchPoints);

  // Panel visibility
  const showListView = ref(!viewportStore.isMobile);
  const showFilterPanel = ref(false);

  // Highlighted point (for list view synchronization)
  const highlightedPointId = ref<number | null>(null);

  // Selected popup state
  const selectedPointId = ref<number | null>(null);
  const selectedStationId = ref<number | null>(null);

  // Nearby items (computed based on selection)
  const nearbyStations = ref<NearbyStation[]>([]);
  const nearbyLaunchpoints = ref<NearbyLaunchpoint[]>([]);

  // Context menu state
  const showContextMenu = ref(false);
  const contextMenuPosition = ref({ x: 0, y: 0 });
  const contextMenuLatLng = ref({ lat: 0, lng: 0 });

  // Computed
  const hasOpenPopup = computed(() => selectedPointId.value !== null || selectedStationId.value !== null);

  // Actions - Panel visibility
  function toggleListView(): void
  {
    showListView.value = !showListView.value;
  }

  function setShowListView(value: boolean): void
  {
    showListView.value = value;
  }

  function toggleFilterPanel(): void
  {
    showFilterPanel.value = !showFilterPanel.value;
  }

  function closeFilterPanel(): void
  {
    showFilterPanel.value = false;
  }

  // Actions - Highlighting
  function setHighlightedPointId(id: number | null): void
  {
    highlightedPointId.value = id;
  }

  // Actions - Popup state (internal helpers)
  type PopupKind = 'point' | 'station';
  type PopupEntity = { id: number; latitude: number; longitude: number };

  function closeAllPopups(): void
  {
    selectedPointId.value = null;
    selectedStationId.value = null;
    nearbyStations.value = [];
    nearbyLaunchpoints.value = [];
  }

  function openPopup(kind: PopupKind, entity: PopupEntity): void
  {
    closeAllPopups();

    if (kind === 'point')
    {
      selectedPointId.value = entity.id;
      nearbyStations.value = findNearbyStations(entity.latitude, entity.longitude);
      return;
    }

    selectedStationId.value = entity.id;
    nearbyLaunchpoints.value = findNearbyLaunchpoints(entity.latitude, entity.longitude);
  }

  // Public API (unchanged signatures)
  function handlePopupOpen(point: PopupEntity): void
  {
    openPopup('point', point);
  }

  function handlePopupClose(): void
  {
    closeAllPopups();
  }

  function handleStationPopupOpen(station: PopupEntity): void
  {
    openPopup('station', station);
  }

  function handleStationPopupClose(): void
  {
    closeAllPopups();
  }

  // Actions - Context menu
  function openContextMenu(position: { x: number; y: number }, latLng: { lat: number; lng: number }): void
  {
    contextMenuPosition.value = position;
    contextMenuLatLng.value = latLng;
    showContextMenu.value = true;
  }

  function closeContextMenu(): void
  {
    showContextMenu.value = false;
  }

  // Sync showListView when viewport changes
  function syncWithViewport(isMobile: boolean): void
  {
    if (isMobile && showListView.value)
    {
      showListView.value = false;
    }
    else if (!isMobile && !showListView.value)
    {
      showListView.value = true;
    }
  }

  return {
    // State
    showListView,
    showFilterPanel,
    highlightedPointId,
    selectedPointId,
    selectedStationId,
    nearbyStations,
    nearbyLaunchpoints,
    showContextMenu,
    contextMenuPosition,
    contextMenuLatLng,

    // Computed
    hasOpenPopup,

    // Actions
    toggleListView,
    setShowListView,
    toggleFilterPanel,
    closeFilterPanel,
    setHighlightedPointId,
    handlePopupOpen,
    handlePopupClose,
    handleStationPopupOpen,
    handleStationPopupClose,
    openContextMenu,
    closeContextMenu,
    syncWithViewport
  };
});
