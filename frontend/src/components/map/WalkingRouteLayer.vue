<script setup lang="ts">
import { ref } from 'vue';
import { LMarker, LPopup, LPolyline } from '@vue-leaflet/vue-leaflet';

interface WalkingRouteTarget
{
  stationName: string;
  pointName: string;
  lat: number;
  lng: number;
}

interface Props
{
  route: [number, number][];
  distance: number;
  duration: number;
  target: WalkingRouteTarget | null;
}

defineProps<Props>();

const emit = defineEmits<{
  'close-route': [];
}>();

const markerRef = ref<any>(null);

// Expose marker ref for external popup control
defineExpose({ markerRef });

// Format distance for display
function formatWalkingDistance(meters: number): string
{
  if (meters >= 1000)
  {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

// Format duration for display
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
</script>

<template>
  <!-- Walking Route Polyline -->
  <LPolyline
    v-if="route.length > 0"
    :lat-lngs="route"
    color="#2563eb"
    :weight="4"
    :opacity="0.8"
    dash-array="8, 8"
    :no-clip="true"
  />
  
  <!-- Walking Route Info Marker at destination -->
  <LMarker
    v-if="route.length > 0 && target"
    :ref="(el: any) => { markerRef = el }"
    :lat-lng="[target.lat, target.lng]"
    :z-index-offset="1000"
  >
    <LPopup :options="{ autoClose: false, closeOnClick: false }">
      <div class="popup-content walking-route-popup">
        <h4>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="12" cy="4" r="2"/>
            <path d="M15 22v-4l-3-3 2-4 3 3h3"/>
            <path d="M9 14l-3 8"/>
            <path d="M12 11V9"/>
          </svg>
          Fußweg
        </h4>
        <p class="walking-route-target">{{ target.stationName }} → {{ target.pointName }}</p>
        <div class="walking-route-info">
          <span class="walking-distance">{{ formatWalkingDistance(distance) }}</span>
          <span class="walking-duration">~{{ formatWalkingDuration(duration) }}</span>
        </div>
        <button class="popup-btn walking-route-close" @click="emit('close-route')">
          Route schließen
        </button>
      </div>
    </LPopup>
  </LMarker>
</template>

<style scoped>
.popup-content {
  min-width: 180px;
}

/* Walking Route Popup */
.walking-route-popup {
  min-width: 180px;
}

.walking-route-popup h4 {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.walking-route-popup h4 svg {
  color: #059669;
}

.walking-route-target {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0 0 0.5rem 0;
}

.walking-route-info {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.walking-distance {
  font-size: 0.875rem;
  font-weight: 600;
  color: #2563eb;
  background: #dbeafe;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.walking-duration {
  font-size: 0.875rem;
  font-weight: 500;
  color: #059669;
  background: #d1fae5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
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

.walking-route-close {
  width: 100%;
  font-size: 0.75rem;
  padding: 0.375rem 0.5rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.walking-route-close:hover {
  background: #e2e8f0;
  color: #1e293b;
}
</style>
