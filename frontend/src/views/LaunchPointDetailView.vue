<script setup lang="ts">
import { onMounted, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { usePublicTransportStore } from '../stores/publicTransport';
import { useAuthStore } from '../stores/auth';
import { useMapNavigation, useNearbyStations } from '../composables';
import { useCategoriesStore } from '../stores/categories';
import type { NearbyStation } from '../composables';
import type { PublicTransportType } from '../types';

const route = useRoute();
const router = useRouter();
const launchPointsStore = useLaunchPointsStore();
const publicTransportStore = usePublicTransportStore();
const authStore = useAuthStore();
const categoriesStore = useCategoriesStore();
const { openNavigation, navigateToPoint, navigateToStation } = useMapNavigation();
const { findNearbyStations } = useNearbyStations(() => publicTransportStore.publicTransportPoints);

const nearbyStations = ref<NearbyStation[]>([]);

function showWalkingRoute(station: NearbyStation): void
{
  if (!launchPointsStore.selectedPoint) return;
  const point = launchPointsStore.selectedPoint;
  
  // Navigate to map view with walking route parameters
  router.push({
    name: 'map',
    query: {
      walkingRoute: 'true',
      fromLat: station.latitude.toString(),
      fromLng: station.longitude.toString(),
      toLat: point.latitude.toString(),
      toLng: point.longitude.toString(),
      stationName: station.name,
      pointName: point.name
    }
  });
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
  await categoriesStore.fetchCategories();
  await publicTransportStore.fetchPublicTransportPoints();
  const id = Number(route.params.id);
  await launchPointsStore.fetchLaunchPoint(id);
});
</script>

<template>
  <div class="min-h-screen min-h-dvh bg-bg-primary">
    <header class="flex items-center gap-4 px-6 py-4 bg-bg-card border-b border-border sticky top-0 z-10">
      <button 
        class="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-secondary border border-border text-text-primary cursor-pointer transition-all duration-200 hover:bg-bg-hover"
        @click="goBack"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="flex-1 font-display text-xl font-semibold text-text-primary">Einsetzpunkt Details</h1>
      <div class="flex gap-2" v-if="canEdit">
        <button 
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-secondary border border-border text-text-secondary cursor-pointer transition-all duration-200 hover:bg-bg-hover hover:text-primary"
          @click="editPoint" 
          title="Bearbeiten"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button 
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-secondary border border-border text-text-secondary cursor-pointer transition-all duration-200 hover:bg-bg-hover hover:text-red-500"
          @click="handleDelete" 
          title="Löschen"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </header>
    
    <main class="p-6 max-w-[800px] mx-auto" v-if="launchPointsStore.selectedPoint">
      <div class="bg-bg-card rounded-2xl p-6 shadow-sm">
        <div class="mb-6">
          <h2 class="font-display text-2xl font-bold text-text-primary mb-3">{{ launchPointsStore.selectedPoint.name }}</h2>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="cat in launchPointsStore.selectedPoint.categories" 
              :key="cat" 
              class="text-xs px-3 py-1 rounded-full text-white font-medium"
              :style="{ backgroundColor: categoriesStore.categoryColors[cat] }"
            >
              {{ cat }}
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6 pb-6 border-b border-border">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Erstellt von</span>
            <span class="text-sm text-text-primary">{{ launchPointsStore.selectedPoint.creator_username }}</span>
          </div>
          
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Koordinaten</span>
            <span class="text-sm text-text-primary">
              {{ launchPointsStore.selectedPoint.latitude.toFixed(6) }}, 
              {{ launchPointsStore.selectedPoint.longitude.toFixed(6) }}
            </span>
          </div>
          
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Auf Karte anzeigen</span>
            <button 
              class="map-btn inline-flex items-center gap-2 px-4 py-2 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
              @click="showOnMap"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Auf Karte anzeigen
            </button>
          </div>
          
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Navigation</span>
            <button 
              class="nav-btn inline-flex items-center gap-2 px-4 py-2 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
              @click="openNavigation(launchPointsStore.selectedPoint.latitude, launchPointsStore.selectedPoint.longitude)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              Route starten
            </button>
          </div>
          
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Öffnungszeiten</span>
            <span class="text-sm text-text-primary">{{ launchPointsStore.selectedPoint.opening_hours || '24h' }}</span>
          </div>
          
          <div class="flex flex-col gap-1" v-if="launchPointsStore.selectedPoint.is_official">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Status</span>
            <span class="official-badge inline-block text-white px-3 py-1 rounded-full text-xs font-medium">Offizieller Punkt</span>
          </div>
        </div>
        
        <div class="mb-6 last:mb-0" v-if="launchPointsStore.selectedPoint.hints">
          <h3 class="text-sm font-semibold text-text-secondary mb-2">Hinweise</h3>
          <p class="text-text-primary leading-relaxed">{{ launchPointsStore.selectedPoint.hints }}</p>
        </div>
        
        <div class="mb-6 last:mb-0" v-if="launchPointsStore.selectedPoint.parking_options">
          <h3 class="text-sm font-semibold text-text-secondary mb-2">Parkmöglichkeiten</h3>
          <p class="text-text-primary leading-relaxed">{{ launchPointsStore.selectedPoint.parking_options }}</p>
        </div>
        
        <div class="mb-6 last:mb-0" v-if="launchPointsStore.selectedPoint.nearby_waters">
          <h3 class="text-sm font-semibold text-text-secondary mb-2">Gewässer in der Nähe</h3>
          <p class="text-text-primary leading-relaxed">{{ launchPointsStore.selectedPoint.nearby_waters }}</p>
        </div>
        
        <div class="mb-6 last:mb-0" v-if="launchPointsStore.selectedPoint.food_supply">
          <h3 class="text-sm font-semibold text-text-secondary mb-2">Lebensmittelversorgung</h3>
          <p class="text-text-primary leading-relaxed">{{ launchPointsStore.selectedPoint.food_supply }}</p>
        </div>
        
        <div class="mb-6 last:mb-0">
          <h3 class="text-sm font-semibold text-text-secondary mb-2 flex items-center gap-2">
            <svg class="w-[18px] h-[18px] text-[#0066CC]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="4" y="4" width="16" height="16" rx="2"/>
              <path d="M9 18v-6a3 3 0 016 0v6"/>
              <circle cx="12" cy="10" r="1"/>
            </svg>
            ÖPNV in der Nähe
            <span class="font-normal text-xs text-text-muted">(Luftlinie, max 2km)</span>
          </h3>
          <ul v-if="nearbyStations.length > 0" class="list-none p-0 m-0">
            <li v-for="station in nearbyStations" :key="station.id" class="flex justify-between items-start p-3 px-4 bg-bg-secondary rounded-lg mb-2 last:mb-0 gap-4">
              <div class="flex-1 min-w-0">
                <span class="block font-semibold text-text-primary mb-1.5">{{ station.name }}</span>
                <div class="flex flex-wrap gap-1 mb-1">
                  <span 
                    v-for="type in station.types" 
                    :key="type"
                    class="text-[0.625rem] px-1.5 py-0.5 rounded text-white font-medium"
                    :class="{
                      'bg-[#0066CC]': type === 'train',
                      'bg-[#FF6600]': type === 'tram',
                      'bg-[#00A550]': type === 'sbahn',
                      'bg-[#003399]': type === 'ubahn'
                    }"
                  >
                    {{ getTransportTypeLabel(type) }}
                  </span>
                </div>
                <span v-if="station.lines" class="block text-xs text-text-muted mt-1">Linie: {{ station.lines }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span class="text-sm font-semibold text-[#0066CC] bg-[#e0f2fe] px-2 py-1 rounded shrink-0">{{ station.distanceMeters }}m</span>
                <button 
                  class="station-map-btn flex items-center justify-center w-8 h-8 rounded-md text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
                  @click="showStationOnMap(station)"
                  title="Auf Karte anzeigen"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </button>
                <button 
                  class="station-walk-btn flex items-center justify-center w-8 h-8 rounded-md text-white border-none cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
                  @click="showWalkingRoute(station)"
                  title="Fußweg anzeigen"
                >
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="4" r="2"/>
                    <path d="M15 22v-4l-3-3 2-4 3 3h3"/>
                    <path d="M9 14l-3 8"/>
                    <path d="M12 11V9"/>
                  </svg>
                </button>
              </div>
            </li>
          </ul>
          <p v-else class="text-text-muted text-sm p-3 bg-bg-secondary rounded-lg text-center">Keine ÖPNV-Stationen im Umkreis von 2km gefunden.</p>
        </div>
      </div>
    </main>
    
    <div class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-text-secondary" v-else-if="launchPointsStore.loading">
      <div class="spinner w-10 h-10 border-[3px] border-border border-t-primary rounded-full"></div>
      <p>Laden...</p>
    </div>
    
    <div class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-text-secondary" v-else-if="launchPointsStore.error">
      <p>{{ launchPointsStore.error }}</p>
      <button 
        @click="goBack" 
        class="btn-primary px-6 py-3 text-white border-none rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
      >
        Zurück zur Karte
      </button>
    </div>
  </div>
</template>

<style scoped>
.map-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.map-btn:hover {
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.nav-btn {
  background: linear-gradient(135deg, #34d399, #10b981);
}

.nav-btn:hover {
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.official-badge {
  background: linear-gradient(135deg, #10b981, #059669);
}

.station-map-btn {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.station-map-btn:hover {
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.station-walk-btn {
  background: linear-gradient(135deg, #059669, #10b981);
}

.station-walk-btn:hover {
  box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
