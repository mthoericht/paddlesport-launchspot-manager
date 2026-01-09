import { ref } from 'vue';
import type { LeafletMouseEvent } from 'leaflet';

interface Position {
  x: number;
  y: number;
}

interface LatLng {
  lat: number;
  lng: number;
}

export function useContextMenu() 
{
  const showContextMenu = ref(false);
  const contextMenuPosition = ref<Position>({ x: 0, y: 0 });
  const contextMenuLatLng = ref<LatLng>({ lat: 0, lng: 0 });
  let pendingTimeout: ReturnType<typeof setTimeout> | null = null;
  let pendingPosition: Position | null = null;
  let pendingLatLng: LatLng | null = null;
  let menuOpenedByMouseDown = false; // Flag to track if menu was opened by mousedown
  let menuOpenTime = 0; // Timestamp when menu was opened

  function openContextMenu(position: Position, latLng: LatLng, openedByMouseDown: boolean = false): void 
  {
    // Cancel if a timeout is running
    cancelPendingMenu();
    
    contextMenuPosition.value = position;
    contextMenuLatLng.value = latLng;
    showContextMenu.value = true;
    menuOpenedByMouseDown = openedByMouseDown;
    menuOpenTime = Date.now();
  }

  function closeContextMenu(): void 
  {
    cancelPendingMenu();
    showContextMenu.value = false;
    menuOpenedByMouseDown = false;
    menuOpenTime = 0;
  }

  function cancelPendingMenu(): void 
  {
    if (pendingTimeout)
    {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
      pendingPosition = null;
      pendingLatLng = null;
    }
  }

  function isClickOnMarkerOrPopup(e: LeafletMouseEvent): boolean 
  {
    const target = e.originalEvent?.target as HTMLElement | null;
    return !!(target?.closest('.leaflet-marker-icon') || target?.closest('.leaflet-popup'));
  }

  function handleMapMouseDown(e: LeafletMouseEvent): boolean 
  {
    // Ignore if clicked on marker or popup
    if (isClickOnMarkerOrPopup(e))
    {
      return false;
    }

    // Only for left mouse button (button === 0) or touch events
    const mouseEvent = e.originalEvent as MouseEvent | TouchEvent | null;
    if (mouseEvent && 'button' in mouseEvent && mouseEvent.button !== 0)
    {
      return false;
    }
    
    const { lat, lng } = e.latlng;
    const { x, y } = e.containerPoint;
    
    // Cancel if a previous timeout is running
    cancelPendingMenu();
    
    // Save position for later
    pendingPosition = { x, y };
    pendingLatLng = { lat, lng };
    
    // 500ms delay for left-click/touch events
    pendingTimeout = setTimeout(() =>
    {
      if (pendingPosition && pendingLatLng)
      {
        openContextMenu(pendingPosition, pendingLatLng, true); // true = opened by mousedown
      }
      pendingTimeout = null;
      pendingPosition = null;
      pendingLatLng = null;
    }, 500);
    
    return true;
  }

  function handleMapMouseUp(): void 
  {
    // Cancel timeout when releasing mouse, but only if menu hasn't been shown yet
    // If menu is already shown, mouseup should do nothing
    if (!showContextMenu.value)
    {
      cancelPendingMenu();
    }
  }

  function handleMapClick(e: LeafletMouseEvent): void 
  {
    // If menu was opened by mousedown, prevent click event from closing it
    // Click event comes after mouseup and would otherwise close menu immediately
    if (menuOpenedByMouseDown && showContextMenu.value)
    {
      e.originalEvent?.stopPropagation();
      e.originalEvent?.preventDefault();
    }
  }

  function handleMapContextMenu(e: LeafletMouseEvent): boolean 
  {
    // Ignore if clicked on marker or popup
    if (isClickOnMarkerOrPopup(e))
    {
      return false;
    }
    
    const { lat, lng } = e.latlng;
    const { x, y } = e.containerPoint;
    
    // Show immediately on right-click
    openContextMenu({ x, y }, { lat, lng });
    
    // Prevent global click handler from closing menu immediately
    e.originalEvent?.stopPropagation();
    e.originalEvent?.preventDefault();
    return true;
  }

  // Global click handler to close context menu
  function setupGlobalClickHandler(): void 
  {
    document.addEventListener('click', (e: MouseEvent) =>
    {
      // Ignore clicks on the context menu itself
      const target = e.target as HTMLElement | null;
      if (target?.closest('.context-menu'))
      {
        return;
      }
      
      // If menu was opened by mousedown, ignore the first click event
      // (comes from map after mouseup within 500ms)
      if (menuOpenedByMouseDown && showContextMenu.value && Date.now() - menuOpenTime < 500)
      {
        // Reset flag so next click event can close menu
        menuOpenedByMouseDown = false;
        return;
      }
      
      closeContextMenu();
    });
  }

  function cleanupGlobalClickHandler(): void 
  {
    document.removeEventListener('click', closeContextMenu);
  }

  return {
    showContextMenu,
    contextMenuPosition,
    contextMenuLatLng,
    openContextMenu,
    closeContextMenu,
    cancelPendingMenu,
    handleMapMouseDown,
    handleMapMouseUp,
    handleMapClick,
    handleMapContextMenu,
    setupGlobalClickHandler,
    cleanupGlobalClickHandler
  };
}

