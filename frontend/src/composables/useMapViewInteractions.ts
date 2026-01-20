import { ref, type Ref, watch } from 'vue';
import { useRoute, useRouter, type RouteLocationNormalizedLoaded } from 'vue-router';
import type { LeafletMouseEvent, LeafletEvent } from 'leaflet';
import { useContextMenu } from './useContextMenu';
import { useMapState } from './useMapState';
import { useMapNavigation } from './useMapNavigation';
import { useAddressSearch } from './useAddressSearch';

/**
 * Options for the useMapViewInteractions composable.
 */
interface UseMapViewInteractionsOptions {
  /** Reference to the Leaflet map component instance */
  mapRef: Ref<InstanceType<typeof import('@vue-leaflet/vue-leaflet').LMap> | null>;
}

/**
 * Retrieves the initial map state from URL query parameters or sessionStorage.
 * Query parameters take precedence over sessionStorage.
 * Returns null if highlighting a point (has its own positioning logic).
 *
 * @param route - The current Vue Router route object
 * @returns The initial map center and zoom level, or null if not available
 */
function getInitialMapState(route: RouteLocationNormalizedLoaded): { center?: [number, number], zoom?: number } | null
{
  const { centerLat, centerLng, zoom: queryZoom, highlight } = route.query;
  
  // Don't restore if we're highlighting a point (that has its own logic)
  if (highlight)
  {
    return null;
  }
  
  // First try query parameters (e.g., after submitting a form)
  if (centerLat && centerLng && queryZoom)
  {
    const lat = parseFloat(centerLat as string);
    const lng = parseFloat(centerLng as string);
    const zoomLevel = parseInt(queryZoom as string);
    
    if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoomLevel))
    {
      return { center: [lat, lng], zoom: zoomLevel };
    }
  }
  
  // If no query parameters, try sessionStorage (e.g., when using back button)
  if (!centerLat && !centerLng)
  {
    try
    {
      const savedState = sessionStorage.getItem('mapState');
      if (savedState)
      {
        const { centerLat: savedLat, centerLng: savedLng, zoom: savedZoom } = JSON.parse(savedState);
        const lat = parseFloat(savedLat);
        const lng = parseFloat(savedLng);
        const zoomLevel = parseInt(savedZoom);
        
        if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoomLevel))
        {
          return { center: [lat, lng], zoom: zoomLevel };
        }
      }
    }
    catch (e)
    {
      // Ignore storage errors
    }
  }
  
  return null;
}

/**
 * Composable that manages all map view interactions including context menus,
 * map state, navigation, address search, and filter panel visibility.
 * Combines multiple specialized composables into a unified interface for MapView.
 *
 * @param options - Configuration options containing the map reference
 * @returns Object containing reactive state and methods for map interactions
 */
export function useMapViewInteractions(options: UseMapViewInteractionsOptions)
{
  const { mapRef } = options;
  const route = useRoute();
  const router = useRouter();

  // Get initial map state from query params or sessionStorage
  const initialMapState = getInitialMapState(route);

  /**
   * Removes highlight-related query parameters (highlight, lat, lng) from the current URL.
   * Uses router.replace to avoid adding to browser history.
   */
  function removeHighlightParams(): void
  {
    if (route.query.highlight || route.query.lat || route.query.lng)
    {
      const newQuery = { ...route.query };
      delete newQuery.highlight;
      delete newQuery.lat;
      delete newQuery.lng;
      
      router.replace({
        path: route.path,
        query: newQuery
      });
    }
  }

  // Compose other composables
  const {
    showContextMenu,
    contextMenuPosition,
    contextMenuLatLng,
    handleMapMouseDown: contextMenuHandleMouseDown,
    handleMapMouseUp: contextMenuHandleMouseUp,
    handleMapClick: contextMenuHandleClick,
    handleMapContextMenu: contextMenuHandleContextMenu,
    cancelPendingMenu,
    closeContextMenu: contextMenuClose,
    setupGlobalClickHandler,
    cleanupGlobalClickHandler
  } = useContextMenu();

  /**
   * Closes the context menu and removes highlight parameters from the URL.
   * Wraps the base context menu close function with additional cleanup.
   */
  function closeContextMenu(): void
  {
    contextMenuClose();
    removeHighlightParams();
  }

  const {
    mapCenter,
    zoom,
    currentCenter,
    currentZoom,
    handleMapMoveEnd: mapStateHandleMoveEnd,
    setMapView,
    fitBounds
  } = useMapState(initialMapState?.center, initialMapState?.zoom);

  const { openDetail, addPointAtLocation, addPointWithCurrentView, openNavigation } = useMapNavigation();
  const { searchQuery, isSearching, searchError, searchAddress } = useAddressSearch();

  // Local state
  const showFilterPanel = ref(false);

  /**
   * Handles mouse down events on the map.
   * Delegates to context menu handler for long-press detection.
   *
   * @param e - The Leaflet mouse event
   */
  function onMapMouseDown(e: LeafletMouseEvent): void
  {
    contextMenuHandleMouseDown(e);
  }

  /**
   * Handles mouse up events on the map.
   * Delegates to context menu handler to complete long-press detection.
   */
  function onMapMouseUp(): void
  {
    contextMenuHandleMouseUp();
  }

  /**
   * Handles click events on the map.
   * Delegates to context menu handler for click-based menu interactions.
   *
   * @param e - The Leaflet mouse event
   */
  function onMapClick(e: LeafletMouseEvent): void
  {
    contextMenuHandleClick(e);
  }

  /**
   * Handles right-click context menu events on the map.
   * Delegates to context menu handler to show the custom context menu.
   *
   * @param e - The Leaflet mouse event
   */
  function onMapContextMenu(e: LeafletMouseEvent): void
  {
    contextMenuHandleContextMenu(e);
  }

  /**
   * Handles the start of map movement (pan/drag).
   * Cancels any pending context menu to prevent accidental triggers during drag.
   */
  function handleMapMoveStart(): void
  {
    cancelPendingMenu();
  }

  /**
   * Handles the end of map movement.
   * Updates map state, closes context menu, and persists position to sessionStorage.
   *
   * @param e - The Leaflet event from moveend
   */
  function handleMapMoveEnd(e: LeafletEvent): void
  {
    mapStateHandleMoveEnd(e);
    closeContextMenu(); // This also removes highlight params
    
    // Save current map state to sessionStorage for restoration when navigating back
    if (mapRef.value?.leafletObject)
    {
      const map = mapRef.value.leafletObject;
      const center = map.getCenter();
      const zoomLevel = map.getZoom();
      
      try
      {
        sessionStorage.setItem('mapState', JSON.stringify({
          centerLat: center.lat,
          centerLng: center.lng,
          zoom: zoomLevel
        }));
      }
      catch (e)
      {
        // Ignore storage errors (e.g., in private browsing mode)
      }
    }
  }

  /**
   * Navigates to the add point form with coordinates from the context menu location.
   * Closes the context menu after initiating navigation.
   */
  function addPointAtContextMenu(): void
  {
    addPointAtLocation(
      contextMenuLatLng.value.lat,
      contextMenuLatLng.value.lng,
      currentZoom.value
    );
    closeContextMenu();
  }

  /**
   * Navigates to the add point form using the current map center coordinates.
   * Used when adding a point from the UI button rather than context menu.
   */
  function addNewPoint(): void
  {
    addPointWithCurrentView(
      currentCenter.value[0],
      currentCenter.value[1],
      currentZoom.value
    );
  }

  /**
   * Executes an address search and updates the map view to show the results.
   * Uses bounding box if available, otherwise centers on the result coordinates.
   */
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

  /**
   * Toggles the visibility of the filter panel.
   */
  function toggleFilterPanel(): void
  {
    showFilterPanel.value = !showFilterPanel.value;
  }

  /**
   * Closes the filter panel.
   */
  function closeFilterPanel(): void
  {
    showFilterPanel.value = false;
  }

  // Watch for route changes to restore map view when query parameters change
  // This handles cases where the route changes after initial mount
  watch(() => route.query, (newQuery) =>
  {
    // Only restore if we're on the map route and query parameters changed
    if (route.name === 'map' && mapRef.value?.leafletObject)
    {
      const { centerLat, centerLng, zoom: queryZoom, highlight } = newQuery;
      
      // Don't restore if we're highlighting a point (that has its own logic)
      if (highlight)
      {
        return;
      }
      
      // Only restore if query parameters actually changed
      if (centerLat && centerLng && queryZoom)
      {
        const lat = parseFloat(centerLat as string);
        const lng = parseFloat(centerLng as string);
        const zoomLevel = parseInt(queryZoom as string);
        
        if (!isNaN(lat) && !isNaN(lng) && !isNaN(zoomLevel))
        {
          // Update map view when query parameters change
          setMapView([lat, lng], zoomLevel);
          mapRef.value.leafletObject.setView([lat, lng], zoomLevel);
        }
      }
    }
  }, { immediate: false });

  /**
   * Sets up all interaction handlers including global click handler and touch events.
   * Should be called on component mount (e.g., in onMounted hook).
   * Registers touch event handlers on the Leaflet map for mobile device support.
   */
  function setupInteractions(): void
  {
    setupGlobalClickHandler();
    
    // Register touch events directly on Leaflet Map object for mobile devices
    // Leaflet does emit mousedown/mouseup for touch, but we register
    // additionally touchstart/touchend for better compatibility
    if (mapRef.value?.leafletObject)
    {
      const map = mapRef.value.leafletObject;
      
      const touchStartHandler = (e: LeafletEvent) =>
      {
        // Only process if it's really a touch event
        const mouseEvent = e as unknown as LeafletMouseEvent;
        const originalEvent = mouseEvent.originalEvent as TouchEvent | MouseEvent | null;
        if (originalEvent && 'touches' in originalEvent && originalEvent.touches)
        {
          contextMenuHandleMouseDown(mouseEvent);
        }
      };
      
      const touchEndHandler = () =>
      {
        contextMenuHandleMouseUp();
      };
      
      map.on('touchstart', touchStartHandler);
      map.on('touchend', touchEndHandler);
      
      // Store handlers for cleanup
      (map as any)._contextMenuTouchHandlers = { touchStartHandler, touchEndHandler };
    }
  }

  /**
   * Cleans up all interaction handlers including global click handler and touch events.
   * Should be called on component unmount (e.g., in onUnmounted hook).
   * Removes touch event handlers from the Leaflet map to prevent memory leaks.
   */
  function cleanupInteractions(): void
  {
    cleanupGlobalClickHandler();
    
    // Remove touch event handlers
    if (mapRef.value?.leafletObject)
    {
      const map = mapRef.value.leafletObject;
      const handlers = (map as any)._contextMenuTouchHandlers;
      if (handlers)
      {
        map.off('touchstart', handlers.touchStartHandler);
        map.off('touchend', handlers.touchEndHandler);
        delete (map as any)._contextMenuTouchHandlers;
      }
    }
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
    onMapMouseDown,
    onMapMouseUp,
    onMapClick,
    onMapContextMenu,
    handleMapMoveStart,
    handleMapMoveEnd,
    addPointAtContextMenu,
    addPointAtLocation,
    addNewPoint,
    handleSearch,
    openDetail,
    openNavigation,

    // Lifecycle
    setupInteractions,
    cleanupInteractions
  };
}

