<script setup lang="ts">
import type { LaunchPoint } from '../../types';
import type { NearbyStation } from '../../composables';
import type { PublicTransportType } from '../../types';

interface Props
{
  point: LaunchPoint;
  nearbyStations: NearbyStation[];
  categoryColors: Record<string, string>;
  walkingRouteLoading: boolean;
  isSelected: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'open-detail': [point: LaunchPoint];
  'open-navigation': [lat: number, lng: number];
  'show-station-on-map': [station: NearbyStation];
  'show-walking-route': [station: NearbyStation, point: LaunchPoint];
}>();

function getTransportTypeLabel(type: PublicTransportType): string
{
  const labels: Record<PublicTransportType, string> = {
    train: 'Bahn',
    tram: 'Tram',
    sbahn: 'S-Bahn',
    ubahn: 'U-Bahn'
  };
  return labels[type] || type;
}
</script>

<template>
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
    
    <!-- Nearby Public Transport Stations -->
    <div v-if="isSelected && nearbyStations.length > 0" class="popup-nearby-stations">
      <h4>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
          <path d="M9 18v-6a3 3 0 016 0v6"/>
          <circle cx="12" cy="10" r="1"/>
        </svg>
        ÖPNV in der Nähe
        <span class="distance-hint">(Luftlinie, max 2km)</span>
      </h4>
      <ul class="nearby-stations-list">
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
          </div>
          <div class="station-actions">
            <span class="station-distance">{{ station.distanceMeters }}m</span>
            <button 
              class="station-map-btn"
              @click="emit('show-station-on-map', station)"
              title="Auf Karte anzeigen"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </button>
            <button 
              class="station-map-btn station-walk-btn"
              @click="emit('show-walking-route', station, point)"
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
    </div>
    <div v-else-if="isSelected && nearbyStations.length === 0" class="popup-no-stations">
      <span>Keine ÖPNV-Stationen im Umkreis von 2km</span>
    </div>
    
    <div class="popup-actions">
      <button @click="emit('open-detail', point)" class="popup-btn">Details</button>
      <button @click="emit('open-navigation', point.latitude, point.longitude)" class="popup-btn popup-btn-nav" title="Route starten">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
        </svg>
      </button>
    </div>
  </div>
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

.popup-actions {
  display: flex;
  gap: 0.5rem;
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

.popup-btn-nav {
  flex: 0 0 2.25rem;
  padding: 0.5rem;
}

.popup-btn-nav svg {
  width: 1rem;
  height: 1rem;
}

/* Nearby Stations in Popup */
.popup-nearby-stations {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.popup-nearby-stations h4 {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
  margin: 0 0 0.5rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.popup-nearby-stations h4 svg {
  color: #0066CC;
}

.popup-nearby-stations .distance-hint {
  font-weight: 400;
  font-size: 0.625rem;
  color: #94a3b8;
  text-transform: none;
}

.nearby-stations-list {
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.nearby-station-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.5rem;
  background: #f8fafc;
  border-radius: 0.375rem;
  margin-bottom: 0.375rem;
  gap: 0.5rem;
}

.nearby-station-item:last-child {
  margin-bottom: 0;
}

.station-info {
  flex: 1;
  min-width: 0;
}

.station-info .station-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #1e293b;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.station-info .station-types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.25rem;
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

.station-actions {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
}

.nearby-station-item .station-distance {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0066CC;
  background: #e0f2fe;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.station-map-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.station-map-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.3);
}

.station-map-btn svg {
  width: 0.75rem;
  height: 0.75rem;
}

.station-walk-btn {
  background: linear-gradient(135deg, #059669, #10b981);
}

.station-walk-btn:hover {
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
}

.station-walk-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.popup-no-stations {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
}
</style>
