<script setup lang="ts">
import { useLaunchPointsStore } from '../stores/launchPoints';
import { useCategoriesStore } from '../stores/categories';
import { useMapNavigation } from '../composables';
import type { LaunchPoint } from '../types';

const props = defineProps<{
  highlightedPointId?: number | null;
}>();

const emit = defineEmits<{
  'show-on-map': [point: LaunchPoint];
  'open-detail': [point: LaunchPoint];
}>();

const launchPointsStore = useLaunchPointsStore();
const categoriesStore = useCategoriesStore();
const { openNavigation } = useMapNavigation();

function handleShowOnMap(point: LaunchPoint) {
  emit('show-on-map', point);
}

function handleOpenDetail(point: LaunchPoint) {
  emit('open-detail', point);
}
</script>

<template>
  <div class="flex flex-col h-full bg-bg-card border-l border-border">
    <div class="flex items-center justify-between px-5 py-4 border-b border-border bg-bg-card sticky top-0 z-10">
      <h2 class="font-display text-lg font-semibold text-text-primary m-0">Einsetzpunkte</h2>
      <span class="inline-flex items-center justify-center min-w-7 h-7 px-2 bg-gradient-to-br from-primary to-secondary text-white rounded-2xl text-xs font-semibold">
        {{ launchPointsStore.launchPoints.length }}
      </span>
    </div>
    
    <div class="flex-1 overflow-y-auto p-3">
      <div 
        v-for="point in launchPointsStore.launchPoints" 
        :key="point.id"
        class="list-item bg-bg-secondary border border-border rounded-xl p-4 mb-3 cursor-pointer hover:border-primary hover:shadow-[0_2px_8px_rgba(14,165,233,0.1)] hover:-translate-y-px"
        :class="{ 'highlighted': highlightedPointId === point.id }"
      >
        <div class="flex items-start gap-3 mb-3">
          <div class="shrink-0 w-10 h-10 flex items-center justify-center">
            <img 
              :src="categoriesStore.getCategoryIcon(point.categories)" 
              :alt="point.categories.join(', ')"
              class="w-full h-full object-contain"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-display text-base font-semibold text-text-primary m-0 mb-1 break-words">{{ point.name }}</h3>
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-xs text-text-muted">von {{ point.creator_username }}</span>
              <span v-if="point.is_official" class="inline-block py-0.5 px-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl text-[0.625rem] font-semibold uppercase tracking-wide">
                Offiziell
              </span>
            </div>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-1.5 mb-3">
          <span 
            v-for="cat in point.categories" 
            :key="cat" 
            class="text-[0.625rem] py-1 px-2 rounded-lg text-white font-medium"
            :style="{ backgroundColor: categoriesStore.categoryColors[cat] }"
          >
            {{ cat }}
          </span>
        </div>
        
        <div class="mb-3">
          <div class="flex gap-2 text-[0.8125rem] mb-1.5 last:mb-0" v-if="point.opening_hours">
            <span class="font-medium text-text-muted shrink-0">Öffnungszeiten:</span>
            <span class="text-text-primary flex-1">{{ point.opening_hours }}</span>
          </div>
          <div class="flex gap-2 text-[0.8125rem] mb-1.5 last:mb-0" v-if="point.hints">
            <span class="font-medium text-text-muted shrink-0">Hinweise:</span>
            <span class="text-text-primary flex-1">{{ point.hints.substring(0, 100) }}{{ point.hints.length > 100 ? '...' : '' }}</span>
          </div>
        </div>
        
        <div class="flex gap-2 flex-wrap max-md:flex-col">
          <button 
            class="flex items-center gap-2 py-2 px-3 border-none rounded-lg text-[0.8125rem] font-medium cursor-pointer flex-1 min-w-0 justify-center bg-gradient-to-br from-primary to-secondary text-white hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(14,165,233,0.3)] max-md:w-full"
            @click="handleShowOnMap(point)"
            title="Auf Karte anzeigen"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Auf Karte anzeigen
          </button>
          <button 
            class="flex items-center gap-2 py-2 px-3 rounded-lg text-[0.8125rem] font-medium cursor-pointer flex-1 min-w-0 justify-center bg-bg-hover text-text-primary border border-border hover:bg-bg-secondary hover:border-primary max-md:w-full"
            @click="handleOpenDetail(point)"
            title="Details anzeigen"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Details
          </button>
          <button 
            class="nav-btn flex items-center justify-center shrink-0 w-10 h-10 p-0 rounded-lg cursor-pointer bg-bg-hover text-text-primary border border-border"
            @click="openNavigation(point.latitude, point.longitude, point.name)"
            title="Navigation starten"
          >
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div v-if="launchPointsStore.launchPoints.length === 0" class="flex items-center justify-center py-12 px-4 text-text-muted text-center">
        <p class="m-0 text-[0.9375rem]">Keine Einsetzpunkte gefunden</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "../style.css";

.list-item.highlighted {
  @apply border-primary bg-primary/5 shadow-[0_0_0_2px_rgba(14,165,233,0.2)];
  animation: highlightPulse 2s ease infinite;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.3);
  }
}

.nav-btn:hover {
  @apply bg-gradient-to-br from-emerald-400 to-emerald-500 text-white border-transparent;
}
</style>

