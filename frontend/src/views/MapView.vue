<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, onBeforeUnmount, nextTick, computed } from 'vue';
import { useRoute } from 'vue-router';
import { LMap, LTileLayer, LMarker, LPopup, LIcon, LCircle } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { useMapViewInteractions, useCategories, useShowPointOnMap, useGeolocation } from '../composables';
import FilterPanel from '../components/FilterPanel.vue';
import AppHeader from '../components/AppHeader.vue';
import LaunchPointListView from '../components/LaunchPointListView.vue';
import type { LaunchPoint } from '../types';

// Stores
const launchPointsStore = useLaunchPointsStore();
const route = useRoute();

// Local refs
const mapRef = ref<any>(null);
const highlightedPointId = ref<number | null>(null);
const isMobile = ref(window.innerWidth <= 768);
const showListView = ref(!isMobile.value); // Auf Mobile standardmäßig ausgeblendet

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

// Use show point on map composable
const { showPointOnMap } = useShowPointOnMap({
  mapRef,
  highlightedPointId,
  showListView,
  isMobile
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
    if (route.query.highlight)
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
        >
          <LIcon 
            :icon-url="getCategoryIcon(point.categories)"
            :icon-size="[28, 37]"
            :icon-anchor="[14, 37]"
            :popup-anchor="[0, -37]"
          />
          <LPopup>
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
