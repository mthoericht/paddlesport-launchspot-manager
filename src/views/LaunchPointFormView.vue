<script setup lang="ts">
import { onMounted } from 'vue';
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointForm, useCategories } from '../composables';

// Composables
const {
  form,
  markerPosition,
  mapCenter,
  zoom,
  newStation,
  localError,
  isEdit,
  toggleCategory,
  handleMapClick,
  addStation,
  removeStation,
  handleSubmit,
  goBack,
  loadExistingPoint,
  launchPointsStore
} = useLaunchPointForm();

const { allCategories } = useCategories();

onMounted(() => {
  loadExistingPoint();
});
</script>

<template>
  <div class="form-view">
    <header class="form-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>{{ isEdit ? 'Einsetzpunkt bearbeiten' : 'Neuer Einsetzpunkt' }}</h1>
    </header>
    
    <form @submit.prevent="handleSubmit" class="form-content">
      <div class="form-section">
        <h2>Grunddaten</h2>
        
        <div class="form-group">
          <label for="name">Name *</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            required 
            placeholder="z.B. Bootsanleger am Starnberger See"
          />
        </div>
        
        <div class="form-group">
          <label>Kategorien *</label>
          <div class="category-grid">
            <button 
              v-for="cat in allCategories" 
              :key="cat" 
              type="button"
              class="category-checkbox"
              :class="{ active: form.categories.includes(cat) }"
              @click="toggleCategory(cat)"
            >
              {{ cat }}
            </button>
          </div>
        </div>
        
        <div class="form-group">
          <label for="opening_hours">Öffnungszeiten</label>
          <input 
            id="opening_hours"
            v-model="form.opening_hours" 
            type="text" 
            placeholder="z.B. 06:00 - 22:00 oder 24h"
          />
        </div>
      </div>
      
      <div class="form-section">
        <h2>Position auf der Karte</h2>
        <p class="section-hint">Klicke auf die Karte, um die Position zu setzen.</p>
        
        <div class="map-picker">
          <LMap 
            :center="mapCenter" 
            :zoom="zoom" 
            :use-global-leaflet="false"
            class="map"
            @click="handleMapClick"
          >
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <LMarker :lat-lng="markerPosition" />
          </LMap>
        </div>
        
        <div class="coord-display">
          <span>Lat: {{ form.latitude.toFixed(6) }}</span>
          <span>Lng: {{ form.longitude.toFixed(6) }}</span>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Details</h2>
        
        <div class="form-group">
          <label for="hints">Hinweise</label>
          <textarea 
            id="hints"
            v-model="form.hints" 
            rows="3"
            placeholder="Zusätzliche Informationen zum Einsetzpunkt..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="parking_options">Parkmöglichkeiten</label>
          <textarea 
            id="parking_options"
            v-model="form.parking_options" 
            rows="2"
            placeholder="Beschreibung der Parkmöglichkeiten..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="nearby_waters">Gewässer in der Nähe</label>
          <textarea 
            id="nearby_waters"
            v-model="form.nearby_waters" 
            rows="2"
            placeholder="Nahegelegene Seen, Flüsse etc..."
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="food_supply">Lebensmittelversorgung</label>
          <textarea 
            id="food_supply"
            v-model="form.food_supply" 
            rows="2"
            placeholder="Supermärkte, Restaurants in der Nähe..."
          ></textarea>
        </div>
      </div>
      
      <div class="form-section">
        <h2>ÖPNV-Stationen (max. 5)</h2>
        
        <div class="stations-input">
          <input 
            v-model="newStation.name" 
            type="text" 
            placeholder="Stationsname"
            class="station-name-input"
          />
          <input 
            v-model.number="newStation.distance_meters" 
            type="number" 
            min="1"
            placeholder="Entfernung (m)"
            class="station-distance-input"
          />
          <button 
            type="button" 
            @click="addStation"
            class="btn-add"
            :disabled="form.public_transport_stations.length >= 5"
          >
            +
          </button>
        </div>
        
        <ul class="stations-list" v-if="form.public_transport_stations.length > 0">
          <li v-for="(station, index) in form.public_transport_stations" :key="index">
            <span class="station-name">{{ station.name }}</span>
            <span class="station-distance">{{ station.distance_meters }}m</span>
            <button type="button" @click="removeStation(index)" class="btn-remove">×</button>
          </li>
        </ul>
      </div>
      
      <div v-if="localError || launchPointsStore.error" class="error-message">
        {{ localError || launchPointsStore.error }}
      </div>
      
      <div class="form-actions">
        <button type="button" @click="goBack" class="btn-secondary">Abbrechen</button>
        <button type="submit" class="btn-primary" :disabled="launchPointsStore.loading">
          <span v-if="launchPointsStore.loading">Speichern...</span>
          <span v-else>{{ isEdit ? 'Aktualisieren' : 'Erstellen' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-view {
  min-height: 100vh;
  background: var(--bg-primary);
}

.form-header {
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

.form-header h1 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.form-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 1.5rem;
}

.form-section {
  background: var(--bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.form-section h2 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.section-hint {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
}

.category-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  color: var(--text-secondary);
}


.category-checkbox:hover {
  border-color: var(--color-primary);
}

.category-checkbox.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: transparent;
  color: white;
}

.map-picker {
  height: 300px;
  border-radius: 0.75rem;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.map-picker .map {
  width: 100%;
  height: 100%;
}

.coord-display {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-family: monospace;
}

.stations-input {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.station-name-input {
  flex: 2;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.station-distance-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-add {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  background: var(--color-primary);
  color: white;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-add:hover:not(:disabled) {
  background: var(--color-secondary);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stations-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.stations-list li:last-child {
  margin-bottom: 0;
}

.stations-list .station-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}

.stations-list .station-distance {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.btn-remove {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #ef4444;
  color: white;
}

.error-message {
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.75rem;
  color: #ef4444;
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.875rem 1.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn-secondary,
  .btn-primary {
    width: 100%;
  }
}
</style>
