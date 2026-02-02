<script setup lang="ts">
import { LMarker, LPopup, LIcon } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointsStore } from '../../stores/launchPoints';
import { useCategoriesStore } from '../../stores/categories';
import { useMapUiStore } from '../../stores/mapUi';
import type { LaunchPoint } from '../../types';
import type { NearbyStation } from '../../composables';
import LaunchPointPopup from './LaunchPointPopup.vue';

interface Props
{
  walkingRouteLoading: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'show-station-on-map': [station: NearbyStation];
  'show-walking-route': [station: NearbyStation, point: LaunchPoint];
}>();

const launchPointsStore = useLaunchPointsStore();
const categoriesStore = useCategoriesStore();
const mapUiStore = useMapUiStore();

function handlePopupOpen(point: LaunchPoint)
{
  mapUiStore.handlePopupOpen({ id: point.id, latitude: point.latitude, longitude: point.longitude });
}

function handlePopupClose()
{
  mapUiStore.handlePopupClose();
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
      :icon-url="categoriesStore.getCategoryIcon(point.categories)"
      :icon-size="[28, 37]"
      :icon-anchor="[14, 37]"
      :popup-anchor="[0, -37]"
    />
    <LPopup :options="{ maxWidth: 320, minWidth: 280 }">
      <LaunchPointPopup
        :point="point"
        :walking-route-loading="walkingRouteLoading"
        @show-station-on-map="emit('show-station-on-map', $event)"
        @show-walking-route="(station, point) => emit('show-walking-route', station, point)"
      />
    </LPopup>
  </LMarker>
</template>
