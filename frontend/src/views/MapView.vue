<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, onBeforeUnmount, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LCircle } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { usePublicTransportStore } from '../stores/publicTransport';
import { useMapViewInteractions, useCategories, useShowPointOnMap, useGeolocation, useNearbyStations } from '../composables';
import type { NearbyStation } from '../composables';
import FilterPanel from '../components/FilterPanel.vue';
import AppHeader from '../components/AppHeader.vue';
import LaunchPointListView from '../components/LaunchPointListView.vue';
import type { LaunchPoint, PublicTransportType } from '../types';

// Stores
const launchPointsStore = useLaunchPointsStore();
const publicTransportStore = usePublicTransportStore();
const route = useRoute();

// Local refs
const mapRef = ref<any>(null);
const highlightedPointId = ref<number | null>(null);
const isMobile = ref(window.innerWidth <= 768);
const showListView = ref(!isMobile.value); // Auf Mobile standardmäßig ausgeblendet
const stationMarkerRefs = ref<Record<number, any>>({});

// Nearby stations state
const selectedPointId = ref<number | null>(null);
const nearbyStations = ref<NearbyStation[]>([]);

// Nearby stations composable
const { findNearbyStations } = useNearbyStations(() => publicTransportStore.publicTransportPoints);

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

// Watch for window resize to update mobile state
function checkMobile() {
  isMobile.value = window.innerWidth <= 768;
  // Auf Mobile: Liste standardmäßig ausblenden, auf Desktop: anzeigen
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

// Public transport helper functions
function getPublicTransportIcon(types: PublicTransportType[]): string
{
  // Choose icon color based on primary type
  const typeColors: Record<PublicTransportType, string> = {
    train: '#0066CC',
    tram: '#FF6600',
    sbahn: '#00A550',
    ubahn: '#003399'
  };
  
  const primaryType = types[0] || 'train';
  const color = typeColors[primaryType] || '#666666';
  
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <path d="M8 8h8v8h-8z" fill="white"/>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function getTransportTypeLabel(type: PublicTransportType): string
{
  const labels: Record<PublicTransportType, string> = {
    train: 'Bahn',
    tram: 'Tram',
    sbahn: 'S-Bahn',
    ubahn: 'U-Bahn'
  };
  return labels[type] || type;
}

// Use show point on map composable
const { showPointOnMap, showStationOnMap } = useShowPointOnMap({
  mapRef,
  highlightedPointId,
  showListView,
  isMobile,
  stationMarkerRefs
});

// Use geolocation composable
const { currentPosition, isLocating, getCurrentPosition, watchPosition, stopWatching } = useGeolocation();

// Create GPS marker icon as SVG data URL
const gpsIconUrl = computed(() => 
{
  const svg = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#4285F4" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `;
  return 'data:image/svg+xml;base64,' + btoa(svg);
});

// Function to center map on current position
function centerOnCurrentPosition(): void
{
  if (currentPosition.value && mapRef.value?.leafletObject)
  {
    mapRef.value.leafletObject.setView([currentPosition.value.lat, currentPosition.value.lng], 15);
  }
  else
  {
    getCurrentPosition().then(() =>
    {
      centerOnCurrentPosition();
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
    // Try to get position first
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
    
    // Check if marker refs are already available
    if (stationMarkerRefs.value[station.id]) {
      showStationOnMap(station);
    } else {
      // Wait for stations to load and markers to render
      const unwatch = watch(
        () => publicTransportStore.publicTransportPoints,
        () => {
          nextTick(() => {
            if (stationMarkerRefs.value[station.id]) {
              showStationOnMap(station);
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
    // Auf Mobile: Liste ausblenden, wenn von Detailansicht navigiert wird
    if (isMobile.value) {
      showListView.value = false;
    }
    
    const pointId = Number(highlightId);
    const point = launchPointsStore.launchPoints.find(p => p.id === pointId);
    
    if (point) {
      showPointOnMap(point);
    } else if (mapRef.value?.leafletObject) {
      // Point not loaded yet, center map and wait for points to load
      mapRef.value.leafletObject.setView([parseFloat(lat as string), parseFloat(lng as string)], 15);
      
      // Watch for points to load
      const unwatch = watch(() => launchPointsStore.launchPoints, (points) => {
        const foundPoint = points.find(p => p.id === pointId);
        if (foundPoint) {
          showPointOnMap(foundPoint);
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
  // Wait for transition to complete (0.3s) plus a small buffer
  nextTick(() => {
    setTimeout(() => {
      if (mapRef.value?.leafletObject) {
        mapRef.value.leafletObject.invalidateSize();
      }
    }, 350); // Slightly longer than transition duration (0.3s)
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
  
  // Start watching position for GPS marker
  watchPosition();
  
  // Wait for map to be ready, then handle highlight if needed
  // Note: Map view restoration is already handled in useMapViewInteractions
  // by setting initial values, so we only need to handle highlight here
  await nextTick();
  setTimeout(() =>
  {
    if (!mapRef.value?.leafletObject)
    {
      return;
    }
    
    // Handle highlight from query parameters (e.g., from detail view)
    // This takes precedence over restore and will override the initial view
    if (route.query.highlight || route.query.stationId)
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
        
        <!-- Launch Point Markers -->
        <LMarker 
          v-for="point in launchPointsStore.launchPoints" 
          :key="point.id"
          :lat-lng="[point.latitude, point.longitude]"
          @popupopen="handlePopupOpen(point)"
          @popupclose="handlePopupClose"
        >
          <LIcon 
            :icon-url="getCategoryIcon(point.categories)"
            :icon-size="[28, 37]"
            :icon-anchor="[14, 37]"
            :popup-anchor="[0, -37]"
          />
          <LPopup :options="{ maxWidth: 320, minWidth: 280 }">
            <div class="popup-content">
              <h3>{{ point.name }}</h3>
              <div class="popup-categories">
                <span 
                  v-for="cat in point.categories" 
                  :key="cat" 
                  class="category-tag"
                  :style="{ backgroundColor: categoryColors[cat] }"
                >
                  {{ cat }}
                </span>
              </div>
              <p class="popup-creator">von {{ point.creator_username }}</p>
              
              <!-- Nearby Public Transport Stations -->
              <div v-if="selectedPointId === point.id && nearbyStations.length > 0" class="popup-nearby-stations">
                <h4>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                    <rect x="4" y="4" width="16" height="16" rx="2"/>
                    <path d="M9 18v-6a3 3 0 016 0v6"/>
                    <circle cx="12" cy="10" r="1"/>
                  </svg>
                  ÖPNV in der Nähe
                  <span class="distance-hint">(Luftlinie, max 2km)</span>
                </h4>
                <ul class="nearby-stations-list">
                  <li v-for="station in nearbyStations" :key="station.id" class="nearby-station-item">
                    <div class="station-info">
                      <span class="station-name">{{ station.name }}</span>
                      <div class="station-types">
                        <span 
                          v-for="type in station.types" 
                          :key="type"
                          class="transport-type-tag"
                          :class="`transport-type-${type}`"
                        >
                          {{ getTransportTypeLabel(type) }}
                        </span>
                      </div>
                    </div>
                    <div class="station-actions">
                      <span class="station-distance">{{ station.distanceMeters }}m</span>
                      <button 
                        class="station-map-btn"
                        @click="showStationOnMap(station)"
                        title="Auf Karte anzeigen"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                      </button>
                    </div>
                  </li>
                </ul>
              </div>
              <div v-else-if="selectedPointId === point.id && nearbyStations.length === 0" class="popup-no-stations">
                <span>Keine ÖPNV-Stationen im Umkreis von 2km</span>
              </div>
              
              <div class="popup-actions">
                <button @click="openDetail(point)" class="popup-btn">Details</button>
                <button @click="openNavigation(point.latitude, point.longitude)" class="popup-btn popup-btn-nav" title="Route starten">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                </button>
              </div>
            </div>
          </LPopup>
        </LMarker>
        
        <!-- Public Transport Station Markers -->
        <LMarker 
          v-for="station in publicTransportStore.publicTransportPoints" 
          :key="`pt-${station.id}`"
          :ref="(el: any) => { if (el && station.id) stationMarkerRefs[station.id] = el }"
          :lat-lng="[station.latitude, station.longitude]"
        >
          <LIcon 
            :icon-url="getPublicTransportIcon(station.types)"
            :icon-size="[24, 24]"
            :icon-anchor="[12, 12]"
            :popup-anchor="[0, -12]"
          />
          <LPopup>
            <div class="popup-content public-transport-popup">
              <h3>{{ station.name }}</h3>
              <div class="popup-transport-info">
                <div v-if="station.lines" class="popup-lines">
                  <strong>Linie:</strong> {{ station.lines }}
                </div>
                <div v-if="station.types.length > 0" class="popup-types">
                  <strong>Zugarten:</strong>
                  <div class="transport-types">
                    <span 
                      v-for="type in station.types" 
                      :key="type" 
                      class="transport-type-tag"
                      :class="`transport-type-${type}`"
                    >
                      {{ getTransportTypeLabel(type) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </LPopup>
        </LMarker>
        
        <!-- Current GPS Position Marker -->
        <template v-if="currentPosition">
          <LMarker 
            :lat-lng="[currentPosition.lat, currentPosition.lng]"
            :key="'gps-marker'"
          >
            <LIcon 
              :icon-url="gpsIconUrl"
              :icon-size="[24, 24]"
              :icon-anchor="[12, 12]"
            />
            <LPopup>
              <div class="popup-content">
                <h3>Meine Position</h3>
                <p>Genauigkeit: {{ Math.round(currentPosition.accuracy) }}m</p>
                <div class="popup-actions">
                  <button @click="centerOnCurrentPosition" class="popup-btn">Zentrieren</button>
                  <button @click="addPointAtCurrentPosition" class="popup-btn">Einsetzpunkt hinzufügen</button>
                </div>
              </div>
            </LPopup>
          </LMarker>
          <LCircle
            v-if="currentPosition.accuracy > 0"
            :lat-lng="[currentPosition.lat, currentPosition.lng]"
            :radius="currentPosition.accuracy"
            :fill-opacity="0.2"
            fill-color="#4285F4"
            color="#4285F4"
            :weight="1"
          />
        </template>
      </LMap>
      
      <!-- GPS Location Button -->
      <button 
        v-if="currentPosition"
        class="fab gps-fab" 
        :class="{ 'hide-on-mobile': showListView || showFilterPanel }"
        @click="centerOnCurrentPosition" 
        title="Auf meine Position zentrieren"
        :disabled="isLocating"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </button>
      
      <!-- Add Point Button -->
      <button 
        class="fab" 
        :class="{ 'hide-on-mobile': showListView || showFilterPanel }"
        @click="addNewPoint" 
        title="Neuen Einsetzpunkt hinzufügen"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      
      <!-- Kontextmenü -->
      <div 
        v-if="showContextMenu" 
        class="context-menu"
        :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
        @click.stop
      >
        <button class="context-menu-item" @click="addPointAtContextMenu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <span>Einsetzpunkt hinzufügen</span>
        </button>
      </div>
      
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

@media (max-width: 480px) {
  .search-container {
    max-width: none;
    left: 0;
    transform: none;
    padding: 0 0.5rem 0 3.5rem; /* Leave space for zoom controls on left */
  }
  
  .search-input {
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
  }
}

.popup-content {
  min-width: 180px;
}

.popup-content h3 {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.popup-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.category-tag {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: white;
  font-weight: 500;
}

.popup-creator {
  font-size: 0.75rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.popup-actions {
  display: flex;
  gap: 0.5rem;
}

.popup-btn {
  flex: 1;
  padding: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.popup-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.popup-btn-nav {
  flex: 0 0 2.25rem;
  padding: 0.5rem;
}

.popup-btn-nav svg {
  width: 1rem;
  height: 1rem;
}

/* Public Transport Popup Styles */
.public-transport-popup {
  min-width: 200px;
}

.popup-transport-info {
  margin-top: 0.5rem;
}

.popup-lines {
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.popup-lines strong {
  color: #475569;
  margin-right: 0.25rem;
}

.popup-types {
  font-size: 0.875rem;
  color: #1e293b;
}

.popup-types strong {
  color: #475569;
  display: block;
  margin-bottom: 0.25rem;
}

.transport-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.transport-type-tag {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  color: white;
  font-weight: 500;
}

.transport-type-train {
  background-color: #0066CC;
}

.transport-type-tram {
  background-color: #FF6600;
}

.transport-type-sbahn {
  background-color: #00A550;
}

.transport-type-ubahn {
  background-color: #003399;
}

/* Nearby Stations in Popup */
.popup-nearby-stations {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.popup-nearby-stations h4 {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.popup-nearby-stations h4 svg {
  color: #0066CC;
}

.popup-nearby-stations .distance-hint {
  font-weight: 400;
  font-size: 0.625rem;
  color: #94a3b8;
  text-transform: none;
}

.nearby-stations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.nearby-station-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  margin-bottom: 0.375rem;
  gap: 0.5rem;
}

.nearby-station-item:last-child {
  margin-bottom: 0;
}

.station-info {
  flex: 1;
  min-width: 0;
}

.station-info .station-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1e293b;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.station-info .station-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
}

.nearby-station-item .station-distance {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0066CC;
  background: #e0f2fe;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.popup-no-stations {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}

.station-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.station-map-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.station-map-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
}

.station-map-btn svg {
  width: 0.75rem;
  height: 0.75rem;
}

.fab {
  position: absolute;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
  transition: all 0.2s;
  z-index: 1000;
}

.fab.gps-fab {
  bottom: 5.5rem;
  background: linear-gradient(135deg, #4285F4, #34A853);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
}

.fab.gps-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(66, 133, 244, 0.5);
}

.fab:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.5);
}

.fab svg {
  width: 1.5rem;
  height: 1.5rem;
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
  
  .fab {
    bottom: 1rem;
    right: 1rem;
  }
  
  .fab.gps-fab {
    bottom: 5.5rem;
  }
  
  .list-toggle-btn {
    bottom: 5rem;
    left: 1rem;
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .fab.hide-on-mobile {
    display: none; /* Hide FAB button when list or filter is shown on mobile */
  }
}

/* Kontextmenü */
.context-menu {
  position: absolute;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 2000;
  min-width: 200px;
  padding: 0.25rem;
  animation: contextMenuFadeIn 0.15s ease-out;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.context-menu-item:hover {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
}

.context-menu-item svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}
</style>
