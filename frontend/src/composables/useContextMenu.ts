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

  function openContextMenu(position: Position, latLng: LatLng): void 
  {
    contextMenuPosition.value = position;
    contextMenuLatLng.value = latLng;
    showContextMenu.value = true;
  }

  function closeContextMenu(): void 
  {
    showContextMenu.value = false;
  }

  function handleMapClick(e: LeafletMouseEvent): boolean 
  {
    // Ignorieren wenn auf Marker oder Popup geklickt wurde
    const target = e.originalEvent?.target as HTMLElement | null;
    if (target?.closest('.leaflet-marker-icon') || 
        target?.closest('.leaflet-popup')) 
    {
      return false;
    }
    
    const { lat, lng } = e.latlng;
    const { x, y } = e.containerPoint;
    
    openContextMenu({ x, y }, { lat, lng });
    
    // Verhindere dass der globale Click-Handler das Menü sofort schließt
    e.originalEvent?.stopPropagation();
    return true;
  }

  // Globaler Click-Handler zum Schließen des Kontextmenüs
  function setupGlobalClickHandler(): void 
  {
    document.addEventListener('click', closeContextMenu);
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
    handleMapClick,
    setupGlobalClickHandler,
    cleanupGlobalClickHandler
  };
}

