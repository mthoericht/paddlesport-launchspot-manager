<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup, LIcon } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { useAddressSearch, useContextMenu, useMapState, useMapNavigation, useCategories } from '../composables';
import FilterPanel from '../components/FilterPanel.vue';
import AppHeader from '../components/AppHeader.vue';

// Stores
const launchPointsStore = useLaunchPointsStore();

// Composables
const { searchQuery, isSearching, searchError, searchAddress } = useAddressSearch();
const { 
  showContextMenu, 
  contextMenuPosition, 
  contextMenuLatLng, 
  handleMapClick, 
  closeContextMenu,
  setupGlobalClickHandler,
  cleanupGlobalClickHandler
} = useContextMenu();
const { 
  mapCenter, 
  zoom, 
  currentCenter, 
  currentZoom, 
  handleMapMoveEnd: onMapMoveEnd,
  fitBounds
} = useMapState();
const { openDetail, addPointAtLocation, addPointWithCurrentView } = useMapNavigation();
const { categoryColors, getCategoryIcon } = useCategories();

// Local state
const showFilterPanel = ref(false);
const mapRef = ref<any>(null);

// Event Handlers
function onMapClick(e: any): void {
  handleMapClick(e);
}

function handleMapMoveEnd(e: any): void {
  onMapMoveEnd(e);
  closeContextMenu();
}

function addPointAtContextMenu(): void {
  addPointAtLocation(
    contextMenuLatLng.value.lat, 
    contextMenuLatLng.value.lng, 
    currentZoom.value
  );
  closeContextMenu();
}

function addNewPoint(): void {
  addPointWithCurrentView(
    currentCenter.value[0], 
    currentCenter.value[1], 
    currentZoom.value
  );
}

function handleSearch(): void {
  searchAddress((result) => {
    if (result.boundingbox) {
      const bounds: [[number, number], [number, number]] = [
        [parseFloat(result.boundingbox[0]), parseFloat(result.boundingbox[2])],
        [parseFloat(result.boundingbox[1]), parseFloat(result.boundingbox[3])]
      ];
      fitBounds(mapRef.value, bounds);
    } else if (mapRef.value?.leafletObject) {
      mapRef.value.leafletObject.setView([result.lat, result.lon], 16);
    }
  });
}

onMounted(() => {
  launchPointsStore.fetchLaunchPoints();
  setupGlobalClickHandler();
});

onUnmounted(() => {
  cleanupGlobalClickHandler();
});
</script>

<template>
  <div class="map-view">
    <AppHeader @toggle-filter="showFilterPanel = !showFilterPanel" />
    
    <div class="map-container">
      <!-- Adress-Suchfeld -->
      <div class="search-container">
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
        @click="onMapClick"
        @contextmenu="onMapClick"
        @moveend="handleMapMoveEnd"
        @zoomend="handleMapMoveEnd"
      >
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
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
              <button @click="openDetail(point)" class="popup-btn">Details</button>
            </div>
          </LPopup>
        </LMarker>
      </LMap>
      
      <button class="fab" @click="addNewPoint" title="Neuen Einsetzpunkt hinzufügen">
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
      
      <FilterPanel 
        v-if="showFilterPanel" 
        @close="showFilterPanel = false"
      />
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

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
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
    padding: 0 0.5rem;
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

.popup-btn {
  width: 100%;
  padding: 0.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.popup-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
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

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.5);
}

.fab svg {
  width: 1.5rem;
  height: 1.5rem;
}

@media (max-width: 768px) {
  .fab {
    bottom: 1rem;
    right: 1rem;
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
