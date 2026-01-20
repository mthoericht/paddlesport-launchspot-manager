<script setup lang="ts">
import { LMarker, LPopup, LIcon } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../../stores/launchPoints';
import type { LaunchPoint } from '../../types';
import type { NearbyStation } from '../../composables';
import LaunchPointPopup from './LaunchPointPopup.vue';

interface Props
{
  categoryColors: Record<string, string>;
  getCategoryIcon: (categories: string[]) => string;
  selectedPointId: number | null;
  nearbyStations: NearbyStation[];
  walkingRouteLoading: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'popup-open': [point: { id: number; latitude: number; longitude: number }];
  'popup-close': [];
  'open-detail': [point: LaunchPoint];
  'open-navigation': [lat: number, lng: number];
  'show-station-on-map': [station: NearbyStation];
  'show-walking-route': [station: NearbyStation, point: LaunchPoint];
}>();

const launchPointsStore = useLaunchPointsStore();

function handlePopupOpen(point: LaunchPoint)
{
  emit('popup-open', { id: point.id, latitude: point.latitude, longitude: point.longitude });
}

function handlePopupClose()
{
  emit('popup-close');
}
</script>

<template>
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
      <LaunchPointPopup
        :point="point"
        :nearby-stations="nearbyStations"
        :category-colors="categoryColors"
        :walking-route-loading="walkingRouteLoading"
        :is-selected="selectedPointId === point.id"
        @open-detail="emit('open-detail', $event)"
        @open-navigation="(lat, lng) => emit('open-navigation', lat, lng)"
        @show-station-on-map="emit('show-station-on-map', $event)"
        @show-walking-route="(station, point) => emit('show-walking-route', station, point)"
      />
    </LPopup>
  </LMarker>
</template>
