<script setup lang="ts">
import { ref } from 'vue';
import { LMarker, LPopup, LIcon } from '@vue-leaflet/vue-leaflet';
import { usePublicTransportStore } from '../../stores/publicTransport';
import type { PublicTransportPoint, PublicTransportType } from '../../types';
import type { NearbyLaunchpoint } from '../../composables';
import PublicTransportPopup from './PublicTransportPopup.vue';

interface Props
{
  selectedStationId: number | null;
  nearbyLaunchpoints: NearbyLaunchpoint[];
  walkingRouteLoading: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'popup-open': [station: { id: number; latitude: number; longitude: number }];
  'popup-close': [];
  'show-launchpoint-on-map': [launchpoint: NearbyLaunchpoint];
  'show-walking-route': [station: { name: string; latitude: number; longitude: number }, launchpoint: NearbyLaunchpoint];
}>();

// Store marker refs for external access
const markerRefs = ref<Record<number, any>>({});

// Expose marker refs for external popup control
defineExpose({ markerRefs });

const publicTransportStore = usePublicTransportStore();

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

function handlePopupOpen(station: PublicTransportPoint)
{
  emit('popup-open', { id: station.id, latitude: station.latitude, longitude: station.longitude });
}

function handlePopupClose()
{
  emit('popup-close');
}

function handleMarkerRef(station: PublicTransportPoint, el: any)
{
  if (el && station.id)
  {
    markerRefs.value[station.id] = el;
  }
}
</script>

<template>
  <LMarker 
    v-for="station in publicTransportStore.publicTransportPoints" 
    :key="`pt-${station.id}`"
    :ref="(el: any) => handleMarkerRef(station, el)"
    :lat-lng="[station.latitude, station.longitude]"
    @popupopen="handlePopupOpen(station)"
    @popupclose="handlePopupClose"
  >
    <LIcon 
      :icon-url="getPublicTransportIcon(station.types)"
      :icon-size="[24, 24]"
      :icon-anchor="[12, 12]"
      :popup-anchor="[0, -12]"
    />
    <LPopup :options="{ maxWidth: 320, minWidth: 280 }">
      <PublicTransportPopup
        :station="station"
        :nearby-launchpoints="nearbyLaunchpoints"
        :walking-route-loading="walkingRouteLoading"
        :is-selected="selectedStationId === station.id"
        @show-launchpoint-on-map="emit('show-launchpoint-on-map', $event)"
        @show-walking-route="(station, lp) => emit('show-walking-route', station, lp)"
      />
    </LPopup>
  </LMarker>
</template>
