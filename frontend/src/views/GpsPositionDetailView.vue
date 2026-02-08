<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useGeolocation, formatCoordinate, getCompassDirection } from '../composables';

const router = useRouter();
const { currentPosition, positionError, isLocating, watchPosition } = useGeolocation();

const updateTime = ref<Date | null>(null);
let updateInterval: number | null = null;

function goBack()
{
  router.push('/map');
}

const formattedLat = computed(() => 
{
  if (!currentPosition.value) return '-';
  return formatCoordinate(currentPosition.value.lat, true);
});

const formattedLng = computed(() => 
{
  if (!currentPosition.value) return '-';
  return formatCoordinate(currentPosition.value.lng, false);
});

const decimalCoords = computed(() =>
{
  if (!currentPosition.value) return '-';
  return `${currentPosition.value.lat.toFixed(6)}, ${currentPosition.value.lng.toFixed(6)}`;
});

function copyCoordinates()
{
  if (!currentPosition.value) return;
  const text = `${currentPosition.value.lat.toFixed(6)}, ${currentPosition.value.lng.toFixed(6)}`;
  navigator.clipboard.writeText(text);
}

function openInMaps()
{
  if (!currentPosition.value) return;
  const url = `https://www.google.com/maps?q=${currentPosition.value.lat},${currentPosition.value.lng}`;
  window.open(url, '_blank');
}

function centerOnMap()
{
  if (!currentPosition.value) return;
  router.push({
    name: 'map',
    query: {
      lat: currentPosition.value.lat.toString(),
      lng: currentPosition.value.lng.toString(),
      zoom: '16'
    }
  });
}

onMounted(() =>
{
  watchPosition();
  updateTime.value = new Date();
  updateInterval = window.setInterval(() =>
  {
    updateTime.value = new Date();
  }, 1000);
});

onUnmounted(() =>
{
  if (updateInterval)
  {
    clearInterval(updateInterval);
  }
});
</script>

<template>
  <div class="min-h-screen min-h-dvh bg-bg-primary">
    <header class="flex items-center gap-4 px-6 py-4 bg-bg-card border-b border-border sticky top-0 z-10">
      <button 
        class="flex items-center justify-center w-10 h-10 rounded-xl bg-bg-secondary border border-border text-text-primary cursor-pointer transition-all duration-200 hover:bg-bg-hover"
        @click="goBack"
        aria-label="Zurück zur Karte"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="flex-1 font-display text-xl font-semibold text-text-primary">Meine Position</h1>
    </header>
    
    <main class="p-6 max-w-[800px] mx-auto" v-if="currentPosition">
      <div class="bg-bg-card rounded-2xl p-6 shadow-sm">
        <div class="mb-6">
          <h2 class="font-display text-2xl font-bold text-text-primary mb-3 flex items-center gap-3">
            <svg class="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="#4285F4" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
            </svg>
            GPS Position
          </h2>
          <p class="text-sm text-text-muted">Aktuelle GPS-Daten deines Geräts</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Breitengrad (Latitude)</span>
            <span class="text-sm text-text-primary font-mono">{{ formattedLat }}</span>
          </div>
          
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Längengrad (Longitude)</span>
            <span class="text-sm text-text-primary font-mono">{{ formattedLng }}</span>
          </div>
          
          <div class="flex flex-col gap-1 md:col-span-2">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Dezimalkoordinaten</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-text-primary font-mono">{{ decimalCoords }}</span>
              <button 
                @click="copyCoordinates"
                class="p-1.5 rounded-md bg-bg-secondary hover:bg-bg-hover text-text-secondary hover:text-primary transition-colors"
                aria-label="Koordinaten in Zwischenablage kopieren"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-border">
          <div class="flex flex-col gap-1">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Genauigkeit</span>
            <span class="text-sm text-text-primary">
              <span class="inline-flex items-center gap-1.5">
                <span 
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-green-500': currentPosition.accuracy <= 10,
                    'bg-yellow-500': currentPosition.accuracy > 10 && currentPosition.accuracy <= 50,
                    'bg-red-500': currentPosition.accuracy > 50
                  }"
                ></span>
                {{ Math.round(currentPosition.accuracy) }} m
              </span>
            </span>
          </div>
          
          <div class="flex flex-col gap-1" v-if="currentPosition.heading !== null && currentPosition.heading !== undefined">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Richtung</span>
            <span class="text-sm text-text-primary">
              {{ Math.round(currentPosition.heading) }}° {{ getCompassDirection(currentPosition.heading) }}
            </span>
          </div>
          
          <div class="flex flex-col gap-1" v-if="currentPosition.speed !== null && currentPosition.speed !== undefined && currentPosition.speed > 0">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wide">Geschwindigkeit</span>
            <span class="text-sm text-text-primary">{{ (currentPosition.speed * 3.6).toFixed(1) }} km/h</span>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button 
            class="map-btn inline-flex items-center gap-2 px-4 py-2 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
            @click="centerOnMap"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Auf Karte zentrieren
          </button>
          
          <button 
            class="nav-btn inline-flex items-center gap-2 px-4 py-2 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
            @click="openInMaps"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            In Google Maps öffnen
          </button>
        </div>
      </div>
    </main>
    
    <div class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-text-secondary" v-else-if="isLocating">
      <div class="spinner w-10 h-10 border-[3px] border-border border-t-primary rounded-full"></div>
      <p>GPS-Position wird ermittelt...</p>
    </div>
    
    <div class="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-text-secondary p-6" v-else-if="positionError">
      <svg class="w-16 h-16 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="text-center max-w-sm">{{ positionError }}</p>
      <button 
        @click="watchPosition" 
        class="btn-primary px-6 py-3 text-white border-none rounded-xl font-semibold cursor-pointer transition-all duration-200 hover:-translate-y-px hover:shadow-lg"
      >
        Erneut versuchen
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
