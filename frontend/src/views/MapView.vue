<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { LMap, LTileLayer } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { usePublicTransportStore } from '../stores/publicTransport';
import { useMapViewInteractions, useCategories, useShowPointOnMap, useGeolocation, useNearbyStations, useNearbyLaunchpoints, useWalkingRoute } from '../composables';
import type { NearbyStation, NearbyLaunchpoint } from '../composables';
import type { LaunchPoint as LaunchPointType } from '../types';
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

// Stores
const launchPointsStore = useLaunchPointsStore();
const publicTransportStore = usePublicTransportStore();
const route = useRoute();
const router = useRouter();

// Local refs
const mapRef = ref<any>(null);
const highlightedPointId = ref<number | null>(null);
const isMobile = ref(window.innerWidth <= 768);
const showListView = ref(!isMobile.value);
const publicTransportLayerRef = ref<InstanceType<typeof PublicTransportLayer> | null>(null);
const gpsMarkerRef = ref<InstanceType<typeof GpsMarkerLayer> | null>(null);
const walkingRouteLayerRef = ref<InstanceType<typeof WalkingRouteLayer> | null>(null);

// Nearby stations state
const selectedPointId = ref<number | null>(null);
const nearbyStations = ref<NearbyStation[]>([]);

// Nearby launchpoints state (for public transport popups)
const selectedStationId = ref<number | null>(null);
const nearbyLaunchpoints = ref<NearbyLaunchpoint[]>([]);

// Nearby stations composable
const { findNearbyStations } = useNearbyStations(() => publicTransportStore.publicTransportPoints);

// Nearby launchpoints composable
const { findNearbyLaunchpoints } = useNearbyLaunchpoints(() => launchPointsStore.launchPoints);

// Walking route composable
const { 
  route: walkingRoute, 
  distance: walkingDistance, 
  duration: walkingDuration, 
  isLoading: walkingRouteLoading, 
  fetchWalkingRoute, 
  clearRoute: clearWalkingRoute 
} = useWalkingRoute();

// Store reference to current launchpoint for walking route
const walkingRouteTarget = ref<{ stationName: string; pointName: string; lat: number; lng: number } | null>(null);

// Fit map to walking route bounds and open popup
function fitToWalkingRouteAndShowPopup(startLat: number, startLng: number, endLat: number, endLng: number): void
{
  if (!mapRef.value?.leafletObject) return;
  
  const map = mapRef.value.leafletObject;
  
  // Calculate bounds for the route
  const bounds: [[number, number], [number, number]] = [
    [Math.min(startLat, endLat), Math.min(startLng, endLng)],
    [Math.max(startLat, endLat), Math.max(startLng, endLng)]
  ];
  
  // Check if bounds are already visible in current view
  const mapBounds = map.getBounds();
  const routeBoundsContained = mapBounds.contains([startLat, startLng]) && mapBounds.contains([endLat, endLng]);
  
  if (!routeBoundsContained)
  {
    // Fit map to show the entire route with padding
    map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.5 });
  }
  
  // Open popup after map animation (or immediately if no animation needed)
  const delay = routeBoundsContained ? 100 : 600;
  setTimeout(() =>
  {
    if (walkingRouteLayerRef.value?.markerRef?.leafletObject)
    {
      walkingRouteLayerRef.value.markerRef.leafletObject.openPopup();
    }
  }, delay);
}

// Show walking route from station to launch point
function showWalkingRoute(station: NearbyStation, point: LaunchPointType): void
{
  walkingRouteTarget.value = { stationName: station.name, pointName: point.name, lat: point.latitude, lng: point.longitude };
  fetchWalkingRoute(station.latitude, station.longitude, point.latitude, point.longitude)
    .then(() =>
    {
      fitToWalkingRouteAndShowPopup(station.latitude, station.longitude, point.latitude, point.longitude);
    });
  
  // Close the launchpoint popup
  if (mapRef.value?.leafletObject)
  {
    mapRef.value.leafletObject.closePopup();
  }
}

// Show walking route from public transport station to nearby launchpoint
function showWalkingRouteToLaunchpoint(station: { name: string; latitude: number; longitude: number }, launchpoint: NearbyLaunchpoint): void
{
  walkingRouteTarget.value = { stationName: station.name, pointName: launchpoint.name, lat: launchpoint.latitude, lng: launchpoint.longitude };
  fetchWalkingRoute(station.latitude, station.longitude, launchpoint.latitude, launchpoint.longitude)
    .then(() =>
    {
      fitToWalkingRouteAndShowPopup(station.latitude, station.longitude, launchpoint.latitude, launchpoint.longitude);
    });
  
  if (mapRef.value?.leafletObject)
  {
    mapRef.value.leafletObject.closePopup();
  }
}

// Show walking route from query parameters (e.g., from detail view)
function showWalkingRouteFromQuery(): void
{
  const { walkingRoute: hasWalkingRoute, fromLat, fromLng, toLat, toLng, stationName, pointName } = route.query;
  
  if (hasWalkingRoute !== 'true' || !fromLat || !fromLng || !toLat || !toLng) return;
  
  const startLat = parseFloat(fromLat as string);
  const startLng = parseFloat(fromLng as string);
  const endLat = parseFloat(toLat as string);
  const endLng = parseFloat(toLng as string);
  
  if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) return;
  
  // Set the walking route target for the popup
  walkingRouteTarget.value = {
    stationName: (stationName as string) || 'Station',
    pointName: (pointName as string) || 'Einsetzpunkt',
    lat: endLat,
    lng: endLng
  };
  
  // Fetch and display the walking route
  fetchWalkingRoute(startLat, startLng, endLat, endLng)
    .then(() =>
    {
      fitToWalkingRouteAndShowPopup(startLat, startLng, endLat, endLng);
    });
  
  // Clear the query parameters to avoid re-fetching on navigation
  router.replace({
    path: route.path,
    query: {}
  });
}

// Handle walking route close
function handleCloseWalkingRoute(): void
{
  clearWalkingRoute();
  walkingRouteTarget.value = null;
}

function handlePopupOpen(point: { id: number; latitude: number; longitude: number })
{
  selectedPointId.value = point.id;
  nearbyStations.value = findNearbyStations(point.latitude, point.longitude);
}

function handlePopupClose()
{
  selectedPointId.value = null;
  nearbyStations.value = [];
}

function handleStationPopupOpen(station: { id: number; latitude: number; longitude: number })
{
  selectedStationId.value = station.id;
  nearbyLaunchpoints.value = findNearbyLaunchpoints(station.latitude, station.longitude);
}

function handleStationPopupClose()
{
  selectedStationId.value = null;
  nearbyLaunchpoints.value = [];
}

function showLaunchpointOnMap(launchpoint: NearbyLaunchpoint): void
{
  if (mapRef.value?.leafletObject)
  {
    mapRef.value.leafletObject.setView([launchpoint.latitude, launchpoint.longitude], 16);
    mapRef.value.leafletObject.closePopup();
  }
}

// Watch for window resize to update mobile state
function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
  if (isMobile.value && showListView.value) {
    showListView.value = false;
  } else if (!isMobile.value && !showListView.value) {
    showListView.value = true;
  }
}

onMounted(() => {
  window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
});

// Composables
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
  openNavigation,

  // Lifecycle
  setupInteractions,
  cleanupInteractions
} = useMapViewInteractions({ mapRef });

const { categoryColors, getCategoryIcon, fetchCategories } = useCategories();

// Use show point on map composable
const { showPointOnMap, showStationOnMap, showGpsPosition } = useShowPointOnMap({
  mapRef,
  highlightedPointId,
  showListView,
  isMobile,
  publicTransportLayerRef,
  gpsMarkerRef
});

// Use geolocation composable
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

function clearHighlightQueryParams() {
  router.replace({ path: route.path, query: {} });
}

function handleHighlightFromQuery() {
  const highlightId = route.query.highlight;
  const lat = route.query.lat;
  const lng = route.query.lng;
  
  // Handle station highlight from DetailView
  const stationLat = route.query.stationLat;
  const stationLng = route.query.stationLng;
  const stationId = route.query.stationId;
  
  if (stationLat && stationLng && stationId) {
    const station = {
      id: Number(stationId),
      latitude: parseFloat(stationLat as string),
      longitude: parseFloat(stationLng as string)
    };
    
    if (publicTransportLayerRef.value?.markerRefs?.[station.id]) {
      showStationOnMap(station);
      clearHighlightQueryParams();
    } else {
      const unwatch = watch(
        () => publicTransportStore.publicTransportPoints,
        () => {
          nextTick(() => {
            if (publicTransportLayerRef.value?.markerRefs?.[station.id]) {
              showStationOnMap(station);
              clearHighlightQueryParams();
              unwatch();
            }
          });
        },
        { immediate: true }
      );
    }
    return;
  }
  
  if (highlightId && lat && lng) {
    if (isMobile.value) {
      showListView.value = false;
    }
    
    const pointId = Number(highlightId);
    const point = launchPointsStore.launchPoints.find(p => p.id === pointId);
    
    if (point) {
      showPointOnMap(point);
      clearHighlightQueryParams();
    } else if (mapRef.value?.leafletObject) {
      mapRef.value.leafletObject.setView([parseFloat(lat as string), parseFloat(lng as string)], 15);
      
      const unwatch = watch(() => launchPointsStore.launchPoints, (points) => {
        const foundPoint = points.find(p => p.id === pointId);
        if (foundPoint) {
          showPointOnMap(foundPoint);
          clearHighlightQueryParams();
          unwatch();
        }
      }, { immediate: true });
    }
  }
}

function handleListViewOpenDetail(point: LaunchPoint) {
  openDetail(point);
}

function toggleListView() {
  showListView.value = !showListView.value;
}

// Watch for list view and filter panel changes to invalidate map size
function invalidateMapSize() {
  nextTick(() => {
    setTimeout(() => {
      if (mapRef.value?.leafletObject) {
        mapRef.value.leafletObject.invalidateSize();
      }
    }, 350);
  });
}

watch(showListView, invalidateMapSize);
watch(showFilterPanel, invalidateMapSize);

onMounted(async () =>
{
  await fetchCategories();
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
    
    if (route.query.walkingRoute === 'true')
    {
      showWalkingRouteFromQuery();
    }
    else if (route.query.highlight || route.query.stationId)
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
  <div class="map-view">
    <AppHeader 
      :show-list="showListView"
      :show-filter="showFilterPanel"
      @toggle-filter="toggleFilterPanel"
      @toggle-list="toggleListView"
    />
    
    <div class="view-container">
      <div class="map-container" :class="{ 'with-list': showListView }">
        <!-- Adress-Suchfeld -->
        <div v-if="!isMobile || !showListView" class="search-container">
          <div class="search-box">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Adresse suchen..."
              class="search-input"
              @keyup.enter="handleSearch"
            />
            <button 
              class="search-btn" 
              @click="handleSearch"
              :disabled="isSearching || !searchQuery.trim()"
            >
              <svg v-if="!isSearching" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <span v-else class="search-spinner"></span>
            </button>
          </div>
          <div v-if="searchError" class="search-error">{{ searchError }}</div>
        </div>
        
        <LMap 
          ref="mapRef"
          :center="mapCenter" 
          :zoom="zoom" 
          :use-global-leaflet="false"
          class="map"
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
            :category-colors="categoryColors"
            :get-category-icon="getCategoryIcon"
            :selected-point-id="selectedPointId"
            :nearby-stations="nearbyStations"
            :walking-route-loading="walkingRouteLoading"
            @popup-open="handlePopupOpen"
            @popup-close="handlePopupClose"
            @open-detail="openDetail"
            @open-navigation="openNavigation"
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
            @open-detail="openDetail"
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
          class="list-view-container"
        />
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.map-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  background: var(--bg-primary);
}

.view-container {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  transition: width 0.3s ease;
}

.map-container.with-list {
  width: 60%;
  min-width: 400px;
}

.list-view-container {
  width: 40%;
  min-width: 320px;
  max-width: 500px;
}

/* List view transition animations */
.list-slide-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.list-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.list-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.list-slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.list-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.list-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

/* Filter panel transition animations */
.filter-slide-enter-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.filter-slide-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.filter-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.filter-slide-enter-to {
  transform: translateX(0);
  opacity: 1;
}

.filter-slide-leave-from {
  transform: translateX(0);
  opacity: 1;
}

.filter-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

.map {
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Adress-Suchfeld */
.search-container {
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  width: 100%;
  max-width: 400px;
  padding: 0 1rem;
  box-sizing: border-box;
}

.search-box {
  display: flex;
  background: white;
  border-radius: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.search-input {
  flex: 1;
  padding: 0.875rem 1.25rem;
  border: none;
  font-size: 0.9375rem;
  background: transparent;
  outline: none;
}

.search-input::placeholder {
  color: #94a3b8;
}

.search-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.search-btn svg {
  width: 1.25rem;
  height: 1.25rem;
  color: white;
}

.search-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.search-error {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  text-align: center;
}

@media (max-width: 768px) {
  .view-container {
    position: relative;
  }
  
  .map-container.with-list {
    width: 100%;
  }
  
  .list-view-container {
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    max-width: 100%;
    height: 100%;
    border-left: none;
    z-index: 500;
    box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  }
}

@media (max-width: 480px) {
  .search-container {
    max-width: none;
    left: 0;
    transform: none;
    padding: 0 0.5rem 0 3.5rem;
  }
  
  .search-input {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}
</style>
