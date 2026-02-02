<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, nextTick, computed } from 'vue';
import { useRouter } from 'vue-router';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { usePublicTransportStore } from '../stores/publicTransport';
import { useViewportStore } from '../stores/viewport';
import { useMapUiStore } from '../stores/mapUi';
import { useMapViewInteractions, useShowPointOnMap, useGeolocation } from '../composables';
import { useCategoriesStore } from '../stores/categories';
import { useWalkingRouteDisplay, useMapQueryParams } from '../composables/map';
import FilterPanel from '../components/FilterPanel.vue';
import AppHeader from '../components/AppHeader.vue';
import LaunchPointListView from '../components/LaunchPointListView.vue';
import ErrorBanner from '../components/ErrorBanner.vue';
import type { LaunchPoint } from '../types';

// Map layer components
import LaunchPointLayer from '../components/map/LaunchPointLayer.vue';
import PublicTransportLayer from '../components/map/PublicTransportLayer.vue';
import GpsMarkerLayer from '../components/map/GpsMarkerLayer.vue';
import WalkingRouteLayer from '../components/map/WalkingRouteLayer.vue';
import MapControls from '../components/map/MapControls.vue';

// Router
const router = useRouter();

// Stores
const launchPointsStore = useLaunchPointsStore();
const publicTransportStore = usePublicTransportStore();
const viewportStore = useViewportStore();
const mapUiStore = useMapUiStore();

// Local refs (component instances and non-serializable state only)
const mapRef = ref<any>(null);
const publicTransportLayerRef = ref<InstanceType<typeof PublicTransportLayer> | null>(null);
const gpsMarkerRef = ref<InstanceType<typeof GpsMarkerLayer> | null>(null);
const walkingRouteLayerRef = ref<InstanceType<typeof WalkingRouteLayer> | null>(null);

// Walking route display composable
const {
  walkingRoute,
  walkingDistance,
  walkingDuration,
  walkingRouteLoading,
  walkingRouteTarget,
  walkingRouteError,
  showWalkingRoute,
  showWalkingRouteToLaunchpoint,
  showWalkingRouteFromQuery,
  handleCloseWalkingRoute
} = useWalkingRouteDisplay({ mapRef, walkingRouteLayerRef });

// Aggregated error for banner (first error wins)
const mapViewError = computed(() =>
  launchPointsStore.error ||
  publicTransportStore.error ||
  categoriesStore.error ||
  walkingRouteError.value ||
  searchError.value ||
  positionError.value ||
  null
);

function clearMapViewErrors(): void
{
  launchPointsStore.error = null;
  publicTransportStore.error = null;
  categoriesStore.error = null;
  handleCloseWalkingRoute();
  searchError.value = '';
  positionError.value = null;
}

// Map view interactions composable
const {
  // Map state
  mapCenter,
  zoom,

  // Search
  searchQuery,
  isSearching,
  searchError,

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
} = useMapViewInteractions({ mapRef, mapUiStore });

const categoriesStore = useCategoriesStore();

// Show point on map composable
const { showPointOnMap, showStationOnMap, showGpsPosition } = useShowPointOnMap({
  mapRef,
  mapUiStore,
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
  mapUiStore,
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

// Function to navigate to GPS position detail page
function showPositionDetails(): void
{
  router.push({ name: 'my-position' });
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
    mapUiStore.closeContextMenu();
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
        mapUiStore.closeContextMenu();
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

// Sync showListView when viewport switches between mobile/desktop
watch(() => viewportStore.isMobile, (mobile) =>
{
  mapUiStore.syncWithViewport(mobile);
});

function handleListViewOpenDetail(point: LaunchPoint)
{
  openDetail(point);
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

watch(() => mapUiStore.showListView, invalidateMapSize);
watch(() => mapUiStore.showFilterPanel, invalidateMapSize);

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
    <ErrorBanner
      v-if="mapViewError"
      :message="mapViewError"
      :dismissible="true"
      @dismiss="clearMapViewErrors"
    />
    <AppHeader 
      :show-list="mapUiStore.showListView"
      :show-filter="mapUiStore.showFilterPanel"
      @toggle-filter="mapUiStore.toggleFilterPanel"
      @toggle-list="mapUiStore.toggleListView"
    />
    
    <div class="flex flex-1 overflow-hidden md:relative">
      <div 
        class="flex-1 relative overflow-hidden transition-[width] duration-300"
        :class="{ 'md:w-[60%] md:min-w-[400px]': mapUiStore.showListView }"
      >
        <!-- Adress-Suchfeld -->
        <div 
          v-if="!viewportStore.isMobile || !mapUiStore.showListView" 
          class="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-[400px] px-4 box-border max-[480px]:max-w-none max-[480px]:left-0 max-[480px]:translate-x-0 max-[480px]:pl-14 max-[480px]:pr-2"
        >
          <div class="flex bg-bg-card rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] overflow-hidden">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Adresse suchen..."
              class="flex-1 py-3.5 px-5 border-none text-[0.9375rem] bg-transparent text-text-primary outline-none placeholder:text-text-muted max-[480px]:py-3 max-[480px]:px-4 max-[480px]:text-sm"
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
            :walking-route-loading="walkingRouteLoading"
            @show-station-on-map="showStationOnMap"
            @show-walking-route="showWalkingRoute"
          />
          
          <!-- Public Transport Layer -->
          <PublicTransportLayer
            ref="publicTransportLayerRef"
            :walking-route-loading="walkingRouteLoading"
            @show-launchpoint-on-map="showLaunchpointOnMap"
            @show-walking-route="showWalkingRouteToLaunchpoint"
          />
          
          <!-- GPS Marker Layer -->
          <GpsMarkerLayer
            ref="gpsMarkerRef"
            :position="currentPosition"
            @show-position-details="showPositionDetails"
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
          :current-position="currentPosition"
          :position-error="positionError"
          :is-locating="isLocating"
          @add-new-point="addNewPoint"
          @center-on-position="centerOnCurrentPosition"
          @add-point-at-context="addPointAtContextMenu"
        />
        
        <Transition name="filter-slide">
          <FilterPanel 
            v-if="mapUiStore.showFilterPanel" 
            @close="mapUiStore.closeFilterPanel"
          />
        </Transition>
      </div>
      
      <Transition name="list-slide">
        <LaunchPointListView 
          v-if="mapUiStore.showListView"
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
