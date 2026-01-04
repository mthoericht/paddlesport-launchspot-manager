import { ref, type Ref } from 'vue';
import type { LeafletMouseEvent, LeafletEvent } from 'leaflet';
import { useContextMenu } from './useContextMenu';
import { useMapState } from './useMapState';
import { useMapNavigation } from './useMapNavigation';
import { useAddressSearch } from './useAddressSearch';

interface UseMapViewInteractionsOptions {
  mapRef: Ref<InstanceType<typeof import('@vue-leaflet/vue-leaflet').LMap> | null>;
}

export function useMapViewInteractions(options: UseMapViewInteractionsOptions)
{
  const { mapRef } = options;

  // Compose other composables
  const {
    showContextMenu,
    contextMenuPosition,
    contextMenuLatLng,
    handleMapClick: contextMenuHandleClick,
    closeContextMenu,
    setupGlobalClickHandler,
    cleanupGlobalClickHandler
  } = useContextMenu();

  const {
    mapCenter,
    zoom,
    currentCenter,
    currentZoom,
    handleMapMoveEnd: mapStateHandleMoveEnd,
    fitBounds
  } = useMapState();

  const { openDetail, addPointAtLocation, addPointWithCurrentView, openNavigation } = useMapNavigation();
  const { searchQuery, isSearching, searchError, searchAddress } = useAddressSearch();

  // Local state
  const showFilterPanel = ref(false);

  // Event Handlers
  function onMapClick(e: LeafletMouseEvent): void
  {
    contextMenuHandleClick(e);
  }

  function handleMapMoveEnd(e: LeafletEvent): void
  {
    mapStateHandleMoveEnd(e);
    closeContextMenu();
  }

  function addPointAtContextMenu(): void
  {
    addPointAtLocation(
      contextMenuLatLng.value.lat,
      contextMenuLatLng.value.lng,
      currentZoom.value
    );
    closeContextMenu();
  }

  function addNewPoint(): void
  {
    addPointWithCurrentView(
      currentCenter.value[0],
      currentCenter.value[1],
      currentZoom.value
    );
  }

  function handleSearch(): void
  {
    searchAddress((result) =>
    {
      if (result.boundingbox)
      {
        const bounds: [[number, number], [number, number]] = [
          [parseFloat(result.boundingbox[0]), parseFloat(result.boundingbox[2])],
          [parseFloat(result.boundingbox[1]), parseFloat(result.boundingbox[3])]
        ];
        fitBounds(mapRef.value as { leafletObject?: import('leaflet').Map } | null, bounds);
      }
      else if (mapRef.value?.leafletObject)
      {
        mapRef.value.leafletObject.setView([result.lat, result.lon], 16);
      }
    });
  }

  function toggleFilterPanel(): void
  {
    showFilterPanel.value = !showFilterPanel.value;
  }

  function closeFilterPanel(): void
  {
    showFilterPanel.value = false;
  }

  // Lifecycle
  function setupInteractions(): void
  {
    setupGlobalClickHandler();
  }

  function cleanupInteractions(): void
  {
    cleanupGlobalClickHandler();
  }

  return {
    // Context menu
    showContextMenu,
    contextMenuPosition,
    contextMenuLatLng,
    closeContextMenu,

    // Map state
    mapCenter,
    zoom,
    currentCenter,
    currentZoom,

    // Search
    searchQuery,
    isSearching,
    searchError,

    // Filter panel
    showFilterPanel,
    toggleFilterPanel,
    closeFilterPanel,

    // Event handlers
    onMapClick,
    handleMapMoveEnd,
    addPointAtContextMenu,
    addNewPoint,
    handleSearch,
    openDetail,
    openNavigation,

    // Lifecycle
    setupInteractions,
    cleanupInteractions
  };
}

