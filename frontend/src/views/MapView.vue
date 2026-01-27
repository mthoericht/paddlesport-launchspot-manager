<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, onBeforeUnmount, nextTick } from 'vue';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { usePublicTransportStore } from '../stores/publicTransport';
import { useMapViewInteractions, useShowPointOnMap, useGeolocation } from '../composables';
import { useCategoriesStore } from '../stores/categories';
import { useNearbyPopupState, useWalkingRouteDisplay, useMapQueryParams } from '../composables/map';
import FilterPanel from '../components/FilterPanel.vue';
import AppHeader from '../components/AppHeader.vue';
import LaunchPointListView from '../components/LaunchPointListView.vue';
import type { LaunchPoint } from '../types';

// Map layer components
import LaunchPointLayer from '../components/map/LaunchPointLayer.vue';
import PublicTransportLayer from '../components/map/PublicTransportLayer.vue';
import GpsMarkerLayer from '../components/map/GpsMarkerLayer.vue';
import WalkingRouteLayer from '../components/map/WalkingRouteLayer.vue';
import MapControls from '../components/map/MapControls.vue';

// Stores - needed for initial data fetch
const launchPointsStore = useLaunchPointsStore();
const publicTransportStore = usePublicTransportStore();

// Local refs
const mapRef = ref<any>(null);
const highlightedPointId = ref<number | null>(null);
const isMobile = ref(window.innerWidth <= 768);
const showListView = ref(!isMobile.value);
const publicTransportLayerRef = ref<InstanceType<typeof PublicTransportLayer> | null>(null);
const gpsMarkerRef = ref<InstanceType<typeof GpsMarkerLayer> | null>(null);
const walkingRouteLayerRef = ref<InstanceType<typeof WalkingRouteLayer> | null>(null);

// Nearby popup state composable
const {
  selectedPointId,
  nearbyStations,
  selectedStationId,
  nearbyLaunchpoints,
  handlePopupOpen,
  handlePopupClose,
  handleStationPopupOpen,
  handleStationPopupClose
} = useNearbyPopupState();

// Walking route display composable
const {
  walkingRoute,
  walkingDistance,
  walkingDuration,
  walkingRouteLoading,
  walkingRouteTarget,
  showWalkingRoute,
  showWalkingRouteToLaunchpoint,
  showWalkingRouteFromQuery,
  handleCloseWalkingRoute
} = useWalkingRouteDisplay({ mapRef, walkingRouteLayerRef });

// Map view interactions composable
const {
  // Context menu
  showContextMenu,
  contextMenuPosition,
  closeContextMenu,

  // Map state
  mapCenter,
  zoom,

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

  // Lifecycle
  setupInteractions,
  cleanupInteractions
} = useMapViewInteractions({ mapRef });

const categoriesStore = useCategoriesStore();

// Show point on map composable
const { showPointOnMap, showStationOnMap, showGpsPosition } = useShowPointOnMap({
  mapRef,
  highlightedPointId,
  showListView,
  isMobile,
  publicTransportLayerRef,
  gpsMarkerRef
});

// Map query params composable
const {
  handleHighlightFromQuery,
  hasWalkingRouteQuery,
  hasHighlightQuery
} = useMapQueryParams({
  mapRef,
  publicTransportLayerRef,
  isMobile,
  showListView,
  showPointOnMap,
  showStationOnMap
});

// Geolocation composable
const { currentPosition, positionError, isLocating, getCurrentPosition, watchPosition, stopWatching } = useGeolocation();

// Function to center map on current position and open popup
function centerOnCurrentPosition(): void
{
  if (currentPosition.value)
  {
    showGpsPosition(currentPosition.value.lat, currentPosition.value.lng, 15);
  }
  else
  {
    getCurrentPosition().then(() =>
    {
      if (currentPosition.value)
      {
        showGpsPosition(currentPosition.value.lat, currentPosition.value.lng, 15);
      }
    }).catch(() =>
    {
      // Error handling is done in the composable
    });
  }
}

// Function to add point at current GPS position
function addPointAtCurrentPosition(): void
{
  if (currentPosition.value)
  {
    const zoomLevel = mapRef.value?.leafletObject?.getZoom() || 15;
    addPointAtLocation(
      currentPosition.value.lat,
      currentPosition.value.lng,
      zoomLevel
    );
    closeContextMenu();
  }
  else
  {
    getCurrentPosition().then(() =>
    {
      if (currentPosition.value)
      {
        const zoomLevel = mapRef.value?.leafletObject?.getZoom() || 15;
        addPointAtLocation(
          currentPosition.value.lat,
          currentPosition.value.lng,
          zoomLevel
        );
        closeContextMenu();
      }
    }).catch(() =>
    {
      // Error handling is done in the composable
    });
  }
}

function showLaunchpointOnMap(launchpoint: { latitude: number; longitude: number }): void
{
  if (mapRef.value?.leafletObject)
  {
    mapRef.value.leafletObject.setView([launchpoint.latitude, launchpoint.longitude], 16);
    mapRef.value.leafletObject.closePopup();
  }
}

// Watch for window resize to update mobile state
function checkMobile()
{
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value && showListView.value)
  {
    showListView.value = false;
  }
  else if (!isMobile.value && !showListView.value)
  {
    showListView.value = true;
  }
}

onMounted(() =>
{
  window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() =>
{
  window.removeEventListener('resize', checkMobile);
});

function handleListViewOpenDetail(point: LaunchPoint)
{
  openDetail(point);
}

function toggleListView()
{
  showListView.value = !showListView.value;
}

// Watch for list view and filter panel changes to invalidate map size
function invalidateMapSize()
{
  nextTick(() =>
  {
    setTimeout(() =>
    {
      if (mapRef.value?.leafletObject)
      {
        mapRef.value.leafletObject.invalidateSize();
      }
    }, 350);
  });
}

watch(showListView, invalidateMapSize);
watch(showFilterPanel, invalidateMapSize);

onMounted(async () =>
{
  await categoriesStore.fetchCategories();
  await launchPointsStore.fetchLaunchPoints();
  await publicTransportStore.fetchPublicTransportPoints();
  setupInteractions();
  
  watchPosition();
  
  await nextTick();
  setTimeout(() =>
  {
    if (!mapRef.value?.leafletObject)
    {
      return;
    }
    
    if (hasWalkingRouteQuery())
    {
      showWalkingRouteFromQuery();
    }
    else if (hasHighlightQuery())
    {
      handleHighlightFromQuery();
    }
  }, 100);
});

onUnmounted(() =>
{
  cleanupInteractions();
  stopWatching();
});
</script>

<template>
  <div class="flex flex-col h-screen h-dvh bg-bg-primary">
    <AppHeader 
      :show-list="showListView"
      :show-filter="showFilterPanel"
      @toggle-filter="toggleFilterPanel"
      @toggle-list="toggleListView"
    />
    
    <div class="flex flex-1 overflow-hidden md:relative">
      <div 
        class="flex-1 relative overflow-hidden transition-[width] duration-300"
        :class="{ 'md:w-[60%] md:min-w-[400px]': showListView }"
      >
        <!-- Adress-Suchfeld -->
        <div 
          v-if="!isMobile || !showListView" 
          class="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-[400px] px-4 box-border max-[480px]:max-w-none max-[480px]:left-0 max-[480px]:translate-x-0 max-[480px]:pl-14 max-[480px]:pr-2"
        >
          <div class="flex bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Adresse suchen..."
              class="flex-1 py-3.5 px-5 border-none text-[0.9375rem] bg-transparent outline-none placeholder:text-slate-400 max-[480px]:py-3 max-[480px]:px-4 max-[480px]:text-sm"
              @keyup.enter="handleSearch"
            />
            <button 
              class="search-btn flex items-center justify-center w-12 border-none cursor-pointer transition-all duration-200 hover:enabled:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleSearch"
              :disabled="isSearching || !searchQuery.trim()"
            >
              <svg v-if="!isSearching" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span v-else class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            </button>
          </div>
          <div v-if="searchError" class="mt-2 py-2 px-4 bg-red-50 text-red-600 rounded-lg text-sm text-center">{{ searchError }}</div>
        </div>
        
        <LMap 
          ref="mapRef"
          :center="mapCenter" 
          :zoom="zoom" 
          :use-global-leaflet="false"
          class="w-full h-full z-[1]"
          @mousedown="onMapMouseDown"
          @mouseup="onMapMouseUp"
          @click="onMapClick"
          @contextmenu="onMapContextMenu"
          @movestart="handleMapMoveStart"
          @moveend="handleMapMoveEnd"
          @zoomend="handleMapMoveEnd"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          <!-- Launch Point Layer -->
          <LaunchPointLayer
            :category-colors="categoriesStore.categoryColors"
            :get-category-icon="categoriesStore.getCategoryIcon"
            :selected-point-id="selectedPointId"
            :nearby-stations="nearbyStations"
            :walking-route-loading="walkingRouteLoading"
            @popup-open="handlePopupOpen"
            @popup-close="handlePopupClose"
            @show-station-on-map="showStationOnMap"
            @show-walking-route="showWalkingRoute"
          />
          
          <!-- Public Transport Layer -->
          <PublicTransportLayer
            ref="publicTransportLayerRef"
            :selected-station-id="selectedStationId"
            :nearby-launchpoints="nearbyLaunchpoints"
            :walking-route-loading="walkingRouteLoading"
            @popup-open="handleStationPopupOpen"
            @popup-close="handleStationPopupClose"
            @show-launchpoint-on-map="showLaunchpointOnMap"
            @show-walking-route="showWalkingRouteToLaunchpoint"
          />
          
          <!-- GPS Marker Layer -->
          <GpsMarkerLayer
            ref="gpsMarkerRef"
            :position="currentPosition"
            @center-on-position="centerOnCurrentPosition"
            @add-point-at-position="addPointAtCurrentPosition"
          />
          
          <!-- Walking Route Layer -->
          <WalkingRouteLayer
            ref="walkingRouteLayerRef"
            :route="walkingRoute"
            :distance="walkingDistance"
            :duration="walkingDuration"
            :target="walkingRouteTarget"
            @close-route="handleCloseWalkingRoute"
          />
        </LMap>
        
        <!-- Map Controls (FABs, Context Menu, GPS Error) -->
        <MapControls
          :show-context-menu="showContextMenu"
          :context-menu-position="contextMenuPosition"
          :current-position="currentPosition"
          :position-error="positionError"
          :is-locating="isLocating"
          :hide-on-mobile="showListView || showFilterPanel"
          @add-new-point="addNewPoint"
          @center-on-position="centerOnCurrentPosition"
          @add-point-at-context="addPointAtContextMenu"
          @close-context-menu="closeContextMenu"
        />
        
        <Transition name="filter-slide">
          <FilterPanel 
            v-if="showFilterPanel" 
            @close="closeFilterPanel"
          />
        </Transition>
      </div>
      
      <Transition name="list-slide">
        <LaunchPointListView 
          v-if="showListView"
          :highlighted-point-id="highlightedPointId"
          @show-on-map="showPointOnMap"
          @open-detail="handleListViewOpenDetail"
          class="w-[40%] min-w-[320px] max-w-[500px] max-md:absolute max-md:inset-0 max-md:w-full max-md:max-w-full max-md:z-[500] max-md:shadow-[-4px_0_20px_rgba(0,0,0,0.15)]"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
/* List view transition animations */
.list-slide-enter-active,
.list-slide-leave-active,
.filter-slide-enter-active,
.filter-slide-leave-active {
  transition: all 0.3s ease;
}

.list-slide-enter-from,
.list-slide-leave-to,
.filter-slide-enter-from,
.filter-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.list-slide-enter-to,
.list-slide-leave-from,
.filter-slide-enter-to,
.filter-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

/* Search button gradient */
.search-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}
</style>
