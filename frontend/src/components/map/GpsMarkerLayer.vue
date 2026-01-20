<script setup lang="ts">
import { ref, computed } from 'vue';
import { LMarker, LPopup, LIcon, LCircle } from '@vue-leaflet/vue-leaflet';

interface GpsPosition
{
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

interface Props
{
  position: GpsPosition | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'center-on-position': [];
  'add-point-at-position': [];
}>();

const markerRef = ref<any>(null);

// Expose marker ref for external popup control
defineExpose({ markerRef });

// Convert heading degrees to compass direction
function getCompassDirection(heading: number): string
{
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'] as const;
  const index = Math.round(heading / 45) % 8;
  return directions[index] ?? 'N';
}

// Create GPS marker icon as SVG data URL
// If heading is available, show a directional arrow
const gpsIconUrl = computed(() => 
{
  const heading = props.position?.heading;
  const hasHeading = heading !== null && heading !== undefined && !isNaN(heading);
  
  if (hasHeading)
  {
    // Directional icon with arrow pointing in heading direction
    // SVG is rotated via transform to point in the correct direction
    const svg = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g transform="rotate(${heading}, 16, 16)" filter="url(#shadow)">
          <!-- Main circle -->
          <circle cx="16" cy="16" r="10" fill="#4285F4" stroke="white" stroke-width="2"/>
          <!-- Direction arrow (pointing up, rotated by heading) -->
          <polygon points="16,6 20,14 16,12 12,14" fill="white"/>
          <!-- Center dot -->
          <circle cx="16" cy="17" r="3" fill="white"/>
        </g>
      </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }
  else
  {
    // Standard icon without direction
    const svg = `
      <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#4285F4" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="white"/>
      </svg>
    `;
    return 'data:image/svg+xml;base64,' + btoa(svg);
  }
});

const iconSize = computed((): [number, number] => 
{
  const hasHeading = props.position?.heading !== null && props.position?.heading !== undefined;
  return hasHeading ? [32, 32] : [24, 24];
});

const iconAnchor = computed((): [number, number] => 
{
  const hasHeading = props.position?.heading !== null && props.position?.heading !== undefined;
  return hasHeading ? [16, 16] : [12, 12];
});
</script>

<template>
  <template v-if="position">
    <LMarker 
      :lat-lng="[position.lat, position.lng]"
      :key="'gps-marker'"
      :ref="(el: any) => { markerRef = el }"
    >
      <LIcon 
        :icon-url="gpsIconUrl"
        :icon-size="iconSize"
        :icon-anchor="iconAnchor"
      />
      <LPopup>
        <div class="popup-content">
          <h3>Meine Position</h3>
          <p>Genauigkeit: {{ Math.round(position.accuracy) }}m</p>
          <p v-if="position.heading !== null && position.heading !== undefined">
            Richtung: {{ Math.round(position.heading) }}° {{ getCompassDirection(position.heading) }}
          </p>
          <p v-if="position.speed !== null && position.speed !== undefined && position.speed > 0">
            Geschwindigkeit: {{ (position.speed * 3.6).toFixed(1) }} km/h
          </p>
          <div class="popup-actions">
            <button @click="emit('center-on-position')" class="popup-btn">Zentrieren</button>
            <button @click="emit('add-point-at-position')" class="popup-btn">Einsetzpunkt hinzufügen</button>
          </div>
        </div>
      </LPopup>
    </LMarker>
    <LCircle
      v-if="position.accuracy > 0"
      :lat-lng="[position.lat, position.lng]"
      :radius="position.accuracy"
      :fill-opacity="0.2"
      fill-color="#4285F4"
      color="#4285F4"
      :weight="1"
    />
  </template>
</template>

<style scoped>
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

.popup-content p {
  font-size: 0.875rem;
  color: #475569;
  margin: 0.25rem 0;
}

.popup-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
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
</style>
