import type { Ref } from 'vue';
import type { LaunchPoint } from '../types';
import type { Map as LeafletMap, Layer as LeafletLayer, Marker as LeafletMarker } from 'leaflet';

interface UseShowPointOnMapOptions {
  mapRef: Ref<{ leafletObject?: LeafletMap } | null>;
  highlightedPointId: Ref<number | null>;
  showListView: Ref<boolean>;
  isMobile: Ref<boolean>;
}

export function useShowPointOnMap(options: UseShowPointOnMapOptions) 
{
  const { mapRef, highlightedPointId, showListView, isMobile } = options;

  function showPointOnMap(point: LaunchPoint) 
  {
    // Set highlight for list view (but not for marker size to avoid re-rendering)
    highlightedPointId.value = point.id;
    
    // Auf Mobile: Liste ausblenden, wenn "Auf Karte anzeigen" geklickt wird
    if (isMobile.value) 
    {
      showListView.value = false;
      // Wait a bit for the layout to update before centering map
      setTimeout(() => 
      {
        centerAndShowPoint(point);
      }, 100);
    }
    else 
    {
      centerAndShowPoint(point);
    }
    
    // Clear highlight after 5 seconds
    setTimeout(() => 
    {
      if (highlightedPointId.value === point.id) 
      {
        highlightedPointId.value = null;
      }
    }, 5000);
  }

  function centerAndShowPoint(point: LaunchPoint) 
  {
    // Center map on point with higher zoom to ensure visibility
    if (mapRef.value?.leafletObject) 
    {
      const map = mapRef.value.leafletObject;
      
      // Force map to invalidate size in case layout changed
      setTimeout(() => 
      {
        map.invalidateSize();
      }, 50);
      
      // Center map on point
      map.setView([point.latitude, point.longitude], 16, {
        animate: true,
        duration: 0.5
      });
      
      // Track if popup has been opened to prevent reopening
      let popupOpened = false;
      let retryTimeout: ReturnType<typeof setTimeout> | null = null;
      
      // Function to find and open popup for the marker
      const findAndOpenPopup = (): boolean => 
      {
        // Don't try to open if already opened
        if (popupOpened) return true;
        
        let markerFound = false;
        map.eachLayer((layer: LeafletLayer) => 
        {
          // Check if layer is a marker by checking for getLatLng method
          if (layer && typeof (layer as LeafletMarker).getLatLng === 'function') 
          {
            const marker = layer as LeafletMarker;
            const latlng = marker.getLatLng();
            // Use a slightly larger tolerance for coordinate matching
            if (Math.abs(latlng.lat - point.latitude) < 0.0005 && 
                Math.abs(latlng.lng - point.longitude) < 0.0005) 
            {
              // Check if marker is actually rendered in the DOM
              const markerElement = marker.getElement?.();
              if (markerElement && markerElement.offsetParent !== null) 
              {
                // Check if popup is already open
                const isPopupOpen = marker.isPopupOpen?.();
                if (!isPopupOpen) 
                {
                  // Marker is visible, open popup only if not already open
                  marker.openPopup();
                  popupOpened = true;
                  markerFound = true;
                }
                else 
                {
                  // Popup is already open
                  popupOpened = true;
                  markerFound = true;
                }
              }
            }
          }
        });
        return markerFound;
      };
      
      // Cleanup function to clear retry timeouts
      const cleanup = () => 
      {
        if (retryTimeout) 
        {
          clearTimeout(retryTimeout);
          retryTimeout = null;
        }
      };
      
      // Wait for map animation to complete, then try to open popup
      const openPopupAfterMove = () => 
      {
        // Don't proceed if popup already opened
        if (popupOpened) return;
        
        // Wait a bit to ensure markers are fully rendered
        retryTimeout = setTimeout(() => 
        {
          let markerFound = findAndOpenPopup();
          
          // If marker not found or not visible, retry with exponential backoff
          if (!markerFound && !popupOpened) 
          {
            const retry = (attempt: number) => 
            {
              // Stop if popup already opened or max retries reached
              if (popupOpened || attempt > 5) 
              {
                cleanup();
                return;
              }
              
              retryTimeout = setTimeout(() => 
              {
                markerFound = findAndOpenPopup();
                if (!markerFound && !popupOpened) 
                {
                  retry(attempt + 1);
                }
                else 
                {
                  cleanup();
                }
              }, 200 * attempt); // Increasing delay: 200ms, 400ms, 600ms, etc.
            };
            retry(1);
          }
          else 
          {
            cleanup();
          }
        }, 500); // Wait for animation to complete
      };
      
      // Listen for moveend event to ensure map has finished moving
      map.once('moveend', openPopupAfterMove);
      
      // Also listen for zoomend in case zoom changes
      map.once('zoomend', () => 
      {
        if (!popupOpened) 
        {
          setTimeout(openPopupAfterMove, 200);
        }
      });
      
      // Fallback: if events don't fire, still try to open popup
      retryTimeout = setTimeout(() => 
      {
        if (!popupOpened) 
        {
          openPopupAfterMove();
        }
      }, 1000);
    }
  }

  return {
    showPointOnMap,
    centerAndShowPoint
  };
}

