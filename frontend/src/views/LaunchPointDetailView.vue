<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { usePublicTransportStore } from '../stores/publicTransport';
import { useAuthStore } from '../stores/auth';
import { useCategories, useMapNavigation, useNearbyStations, useWalkingRoute } from '../composables';
import type { NearbyStation } from '../composables';
import type { PublicTransportType } from '../types';
import { LMap, LTileLayer, LPolyline, LMarker } from '@vue-leaflet/vue-leaflet';

const route = useRoute();
const router = useRouter();
const launchPointsStore = useLaunchPointsStore();
const publicTransportStore = usePublicTransportStore();
const authStore = useAuthStore();
const { categoryColors, fetchCategories } = useCategories();
const { openNavigation, navigateToPoint, navigateToStation } = useMapNavigation();
const { findNearbyStations } = useNearbyStations(() => publicTransportStore.publicTransportPoints);
const { 
  route: walkingRoute, 
  distance: walkingDistance, 
  duration: walkingDuration, 
  isLoading: walkingRouteLoading, 
  fetchWalkingRoute, 
  clearRoute: clearWalkingRoute 
} = useWalkingRoute();

const nearbyStations = ref<NearbyStation[]>([]);
const showWalkingRouteMap = ref(false);

function showWalkingRoute(station: NearbyStation): void
{
  if (!launchPointsStore.selectedPoint) return;
  const point = launchPointsStore.selectedPoint;
  fetchWalkingRoute(station.latitude, station.longitude, point.latitude, point.longitude);
  showWalkingRouteMap.value = true;
}

function closeWalkingRoute(): void
{
  clearWalkingRoute();
  showWalkingRouteMap.value = false;
}

function formatWalkingDistance(meters: number): string
{
  if (meters >= 1000)
  {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

function formatWalkingDuration(seconds: number): string
{
  const minutes = Math.round(seconds / 60);
  if (minutes >= 60)
  {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} Std. ${remainingMinutes} Min.`;
  }
  return `${minutes} Min.`;
}

watch(() => launchPointsStore.selectedPoint, (point) => {
  if (point) {
    nearbyStations.value = findNearbyStations(point.latitude, point.longitude);
  }
}, { immediate: true });

function getTransportTypeLabel(type: PublicTransportType): string {
  const labels: Record<PublicTransportType, string> = {
    train: 'Bahn',
    tram: 'Tram',
    sbahn: 'S-Bahn',
    ubahn: 'U-Bahn'
  };
  return labels[type] || type;
}

function showOnMap() {
  if (!launchPointsStore.selectedPoint) return;
  navigateToPoint(launchPointsStore.selectedPoint);
}

function showStationOnMap(station: NearbyStation) {
  navigateToStation(station);
}

const canEdit = computed(() => {
  const point = launchPointsStore.selectedPoint;
  if (!point || !authStore.user) return false;
  return point.created_by === authStore.user.id || authStore.isAdmin;
});

async function handleDelete() {
  if (!launchPointsStore.selectedPoint) return;
  
  if (confirm('Möchtest du diesen Einsetzpunkt wirklich löschen?')) {
    const success = await launchPointsStore.deleteLaunchPoint(launchPointsStore.selectedPoint.id);
    if (success) {
      router.push('/map');
    }
  }
}

function goBack() {
  router.push('/map');
}

function editPoint() {
  router.push(`/launch-point/${route.params.id}/edit`);
}

onMounted(async () => {
  await fetchCategories();
  await publicTransportStore.fetchPublicTransportPoints();
  const id = Number(route.params.id);
  await launchPointsStore.fetchLaunchPoint(id);
});
</script>

<template>
  <div class="detail-view">
    <header class="detail-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Einsetzpunkt Details</h1>
      <div class="header-actions" v-if="canEdit">
        <button class="icon-btn" @click="editPoint" title="Bearbeiten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="icon-btn delete" @click="handleDelete" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </header>
    
    <main class="detail-content" v-if="launchPointsStore.selectedPoint">
      <div class="point-card">
        <div class="point-header">
          <h2>{{ launchPointsStore.selectedPoint.name }}</h2>
          <div class="categories">
            <span 
              v-for="cat in launchPointsStore.selectedPoint.categories" 
              :key="cat" 
              class="category-tag"
              :style="{ backgroundColor: categoryColors[cat] }"
            >
              {{ cat }}
            </span>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Erstellt von</span>
            <span class="info-value">{{ launchPointsStore.selectedPoint.creator_username }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Koordinaten</span>
            <span class="info-value">
              {{ launchPointsStore.selectedPoint.latitude.toFixed(6) }}, 
              {{ launchPointsStore.selectedPoint.longitude.toFixed(6) }}
            </span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Auf Karte anzeigen</span>
            <button 
              class="map-btn"
              @click="showOnMap"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Auf Karte anzeigen
            </button>
          </div>
          
          <div class="info-item">
            <span class="info-label">Navigation</span>
            <button 
              class="nav-btn"
              @click="openNavigation(launchPointsStore.selectedPoint.latitude, launchPointsStore.selectedPoint.longitude)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              Route starten
            </button>
          </div>
          
          <div class="info-item">
            <span class="info-label">Öffnungszeiten</span>
            <span class="info-value">{{ launchPointsStore.selectedPoint.opening_hours || '24h' }}</span>
          </div>
          
          <div class="info-item" v-if="launchPointsStore.selectedPoint.is_official">
            <span class="info-label">Status</span>
            <span class="info-value official-badge">Offizieller Punkt</span>
          </div>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.hints">
          <h3>Hinweise</h3>
          <p>{{ launchPointsStore.selectedPoint.hints }}</p>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.parking_options">
          <h3>Parkmöglichkeiten</h3>
          <p>{{ launchPointsStore.selectedPoint.parking_options }}</p>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.nearby_waters">
          <h3>Gewässer in der Nähe</h3>
          <p>{{ launchPointsStore.selectedPoint.nearby_waters }}</p>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.food_supply">
          <h3>Lebensmittelversorgung</h3>
          <p>{{ launchPointsStore.selectedPoint.food_supply }}</p>
        </div>
        
        <div class="info-section nearby-transport-section">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M9 18v-6a3 3 0 016 0v6"/>
              <circle cx="12" cy="10" r="1"/>
            </svg>
            ÖPNV in der Nähe
            <span class="distance-hint">(Luftlinie, max 2km)</span>
          </h3>
          <ul v-if="nearbyStations.length > 0" class="nearby-stations-list">
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
                <span v-if="station.lines" class="station-lines">Linie: {{ station.lines }}</span>
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
                <button 
                  class="station-map-btn station-walk-btn"
                  @click="showWalkingRoute(station)"
                  title="Fußweg anzeigen"
                  :disabled="walkingRouteLoading"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="4" r="2"/>
                    <path d="M15 22v-4l-3-3 2-4 3 3h3"/>
                    <path d="M9 14l-3 8"/>
                    <path d="M12 11V9"/>
                  </svg>
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="no-stations">Keine ÖPNV-Stationen im Umkreis von 2km gefunden.</p>
          
          <!-- Walking Route Map -->
          <div v-if="showWalkingRouteMap && walkingRoute.length > 0" class="walking-route-section">
            <div class="walking-route-header">
              <h4>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                  <circle cx="12" cy="4" r="2"/>
                  <path d="M15 22v-4l-3-3 2-4 3 3h3"/>
                  <path d="M9 14l-3 8"/>
                  <path d="M12 11V9"/>
                </svg>
                Fußweg zum Einsetzpunkt
              </h4>
              <button class="walking-route-close-btn" @click="closeWalkingRoute">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div class="walking-route-info">
              <span class="walking-distance">{{ formatWalkingDistance(walkingDistance) }}</span>
              <span class="walking-duration">~{{ formatWalkingDuration(walkingDuration) }}</span>
            </div>
            <div class="walking-route-map-container">
              <LMap
                :zoom="15"
                :center="[launchPointsStore.selectedPoint?.latitude || 0, launchPointsStore.selectedPoint?.longitude || 0]"
                :use-global-leaflet="false"
              >
                <LTileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LPolyline
                  :lat-lngs="walkingRoute"
                  color="#2563eb"
                  :weight="4"
                  :opacity="0.8"
                  dash-array="8, 8"
                />
                <LMarker
                  v-if="walkingRoute.length > 0"
                  :lat-lng="walkingRoute[0] as [number, number]"
                />
                <LMarker
                  v-if="walkingRoute.length > 0"
                  :lat-lng="walkingRoute[walkingRoute.length - 1] as [number, number]"
                />
              </LMap>
            </div>
          </div>
        </div>
      </div>
    </main>
    
    <div class="loading" v-else-if="launchPointsStore.loading">
      <div class="spinner"></div>
      <p>Laden...</p>
    </div>
    
    <div class="error" v-else-if="launchPointsStore.error">
      <p>{{ launchPointsStore.error }}</p>
      <button @click="goBack" class="btn-primary">Zurück zur Karte</button>
    </div>
  </div>
</template>

<style scoped>
.detail-view {
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg-primary);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--bg-hover);
}

.back-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.detail-header h1 {
  flex: 1;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.icon-btn.delete:hover {
  color: #ef4444;
}

.icon-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.detail-content {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.point-card {
  background: var(--bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.point-header {
  margin-bottom: 1.5rem;
}

.point-header h2 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  color: white;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.map-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.map-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.map-btn svg {
  width: 1rem;
  height: 1rem;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #34d399, #10b981);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.nav-btn svg {
  width: 1rem;
  height: 1rem;
}

.official-badge {
  display: inline-block;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.info-section p {
  color: var(--text-primary);
  line-height: 1.6;
}

.stations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stations-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.stations-list li:last-child {
  margin-bottom: 0;
}

.station-name {
  font-weight: 500;
  color: var(--text-primary);
}

.station-distance {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* Nearby Transport Section */
.nearby-transport-section h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nearby-transport-section h3 svg {
  color: #0066CC;
}

.nearby-transport-section .distance-hint {
  font-weight: 400;
  font-size: 0.75rem;
  color: var(--text-muted);
}

.nearby-stations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nearby-station-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  gap: 1rem;
}

.nearby-station-item:last-child {
  margin-bottom: 0;
}

.station-info {
  flex: 1;
  min-width: 0;
}

.station-info .station-name {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.375rem;
}

.station-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
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

.station-lines {
  display: block;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.25rem;
}

.nearby-station-item .station-distance {
  font-size: 0.875rem;
  font-weight: 600;
  color: #0066CC;
  background: #e0f2fe;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.no-stations {
  color: var(--text-muted);
  font-size: 0.875rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  text-align: center;
}

.station-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.station-map-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.station-map-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.station-map-btn svg {
  width: 1rem;
  height: 1rem;
}

.station-walk-btn {
  background: linear-gradient(135deg, #059669, #10b981);
}

.station-walk-btn:hover {
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
}

.station-walk-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

/* Walking Route Section */
.walking-route-section {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
}

.walking-route-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.walking-route-header h4 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.walking-route-header h4 svg {
  color: #059669;
}

.walking-route-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  background: var(--bg-hover);
  color: var(--text-secondary);
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.walking-route-close-btn:hover {
  background: var(--bg-primary);
  color: var(--text-primary);
}

.walking-route-info {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.walking-route-info .walking-distance {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  background: #dbeafe;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
}

.walking-route-info .walking-duration {
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
  background: #d1fae5;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
}

.walking-route-map-container {
  height: 250px;
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
  color: var(--text-secondary);
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}
</style>
