<script setup lang="ts">
import { onMounted } from 'vue';
import { LMap, LTileLayer, LMarker } from '@vue-leaflet/vue-leaflet';
import { useLaunchPointForm } from '../composables';
import { useCategoriesStore } from '../stores/categories';

// Composables
const {
  form,
  markerPosition,
  mapCenter,
  zoom,
  newStation,
  localError,
  isEdit,
  loading,
  storeError,
  toggleCategory,
  handleMapClick,
  addStation,
  removeStation,
  handleSubmit,
  goBack,
  loadExistingPoint
} = useLaunchPointForm();

const categoriesStore = useCategoriesStore();

onMounted(async () => {
  await categoriesStore.fetchCategories();
  loadExistingPoint();
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
      <h1 class="font-display text-xl font-semibold text-text-primary">{{ isEdit ? 'Einsetzpunkt bearbeiten' : 'Neuer Einsetzpunkt' }}</h1>
    </header>
    
    <form @submit.prevent="handleSubmit" class="max-w-[800px] mx-auto p-6">
      <div class="bg-bg-card rounded-2xl p-6 mb-6 shadow-sm">
        <h2 class="font-display text-lg font-semibold text-text-primary mb-4">Grunddaten</h2>
        
        <div class="mb-5 last:mb-0">
          <label for="name" class="block text-sm font-medium text-text-secondary mb-2">Name *</label>
          <input 
            id="name"
            v-model="form.name" 
            type="text" 
            required 
            placeholder="z.B. Bootsanleger am Starnberger See"
            class="w-full py-3.5 px-4 border border-border rounded-xl text-base bg-bg-secondary text-text-primary transition-all duration-200 font-body focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          />
        </div>
        
        <div class="mb-5 last:mb-0">
          <label class="block text-sm font-medium text-text-secondary mb-2">Kategorien *</label>
          <div class="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
            <button 
              v-for="cat in categoriesStore.categories" 
              :key="cat.id" 
              type="button"
              class="flex items-center justify-center p-3 bg-bg-secondary border-2 border-border rounded-xl cursor-pointer transition-all duration-200 font-medium text-text-secondary hover:border-primary"
              :class="{ 'category-active': form.categories.includes(cat.id) }"
              @click="toggleCategory(cat.id)"
            >
              {{ cat.name_de }}
            </button>
          </div>
        </div>
        
        <div class="mb-5 last:mb-0">
          <label for="opening_hours" class="block text-sm font-medium text-text-secondary mb-2">Öffnungszeiten</label>
          <input 
            id="opening_hours"
            v-model="form.opening_hours" 
            type="text" 
            placeholder="z.B. 06:00 - 22:00 oder 24h"
            class="w-full py-3.5 px-4 border border-border rounded-xl text-base bg-bg-secondary text-text-primary transition-all duration-200 font-body focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          />
        </div>
      </div>
      
      <div class="bg-bg-card rounded-2xl p-6 mb-6 shadow-sm">
        <h2 class="font-display text-lg font-semibold text-text-primary mb-4">Position auf der Karte</h2>
        <p class="text-sm text-text-secondary mb-4">Klicke auf die Karte, um die Position zu setzen.</p>
        
        <div class="h-[300px] rounded-xl overflow-hidden mb-3">
          <LMap 
            :center="mapCenter" 
            :zoom="zoom" 
            :use-global-leaflet="false"
            class="w-full h-full"
            @click="handleMapClick"
          >
            <LTileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <LMarker :lat-lng="markerPosition" />
          </LMap>
        </div>
        
        <div class="flex gap-4 text-sm text-text-secondary font-mono">
          <span>Lat: {{ form.latitude.toFixed(6) }}</span>
          <span>Lng: {{ form.longitude.toFixed(6) }}</span>
        </div>
      </div>
      
      <div class="bg-bg-card rounded-2xl p-6 mb-6 shadow-sm">
        <h2 class="font-display text-lg font-semibold text-text-primary mb-4">Details</h2>
        
        <div class="mb-5 last:mb-0">
          <label for="hints" class="block text-sm font-medium text-text-secondary mb-2">Hinweise</label>
          <textarea 
            id="hints"
            v-model="form.hints" 
            rows="3"
            placeholder="Zusätzliche Informationen zum Einsetzpunkt..."
            class="w-full py-3.5 px-4 border border-border rounded-xl text-base bg-bg-secondary text-text-primary transition-all duration-200 font-body resize-y min-h-[80px] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          ></textarea>
        </div>
        
        <div class="mb-5 last:mb-0">
          <label for="parking_options" class="block text-sm font-medium text-text-secondary mb-2">Parkmöglichkeiten</label>
          <textarea 
            id="parking_options"
            v-model="form.parking_options" 
            rows="2"
            placeholder="Beschreibung der Parkmöglichkeiten..."
            class="w-full py-3.5 px-4 border border-border rounded-xl text-base bg-bg-secondary text-text-primary transition-all duration-200 font-body resize-y min-h-[80px] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          ></textarea>
        </div>
        
        <div class="mb-5 last:mb-0">
          <label for="nearby_waters" class="block text-sm font-medium text-text-secondary mb-2">Gewässer in der Nähe</label>
          <textarea 
            id="nearby_waters"
            v-model="form.nearby_waters" 
            rows="2"
            placeholder="Nahegelegene Seen, Flüsse etc..."
            class="w-full py-3.5 px-4 border border-border rounded-xl text-base bg-bg-secondary text-text-primary transition-all duration-200 font-body resize-y min-h-[80px] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          ></textarea>
        </div>
        
        <div class="mb-5 last:mb-0">
          <label for="food_supply" class="block text-sm font-medium text-text-secondary mb-2">Lebensmittelversorgung</label>
          <textarea 
            id="food_supply"
            v-model="form.food_supply" 
            rows="2"
            placeholder="Supermärkte, Restaurants in der Nähe..."
            class="w-full py-3.5 px-4 border border-border rounded-xl text-base bg-bg-secondary text-text-primary transition-all duration-200 font-body resize-y min-h-[80px] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10"
          ></textarea>
        </div>
      </div>
      
      <div class="bg-bg-card rounded-2xl p-6 mb-6 shadow-sm">
        <h2 class="font-display text-lg font-semibold text-text-primary mb-4">ÖPNV-Stationen (max. 5)</h2>
        
        <div class="flex gap-2 mb-4">
          <input 
            v-model="newStation.name" 
            type="text" 
            placeholder="Stationsname"
            class="flex-[2] py-3 px-4 border border-border rounded-xl bg-bg-secondary text-text-primary"
          />
          <input 
            v-model.number="newStation.distance_meters" 
            type="number" 
            min="1"
            placeholder="Entfernung (m)"
            class="flex-1 py-3 px-4 border border-border rounded-xl bg-bg-secondary text-text-primary"
          />
          <button 
            type="button" 
            @click="addStation"
            class="w-11 h-11 rounded-xl bg-primary text-white border-none text-2xl cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="form.public_transport_stations.length >= 5"
          >
            +
          </button>
        </div>
        
        <ul class="list-none p-0 m-0" v-if="form.public_transport_stations.length > 0">
          <li 
            v-for="(station, index) in form.public_transport_stations" 
            :key="index"
            class="flex items-center gap-3 p-3 bg-bg-secondary rounded-lg mb-2 last:mb-0"
          >
            <span class="flex-1 font-medium text-text-primary">{{ station.name }}</span>
            <span class="text-sm text-text-secondary bg-bg-hover py-1 px-2 rounded">{{ station.distance_meters }}m</span>
            <button 
              type="button" 
              @click="removeStation(index)" 
              class="w-7 h-7 rounded-full bg-red-500/10 text-red-500 border-none text-xl cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-red-500 hover:text-white"
            >
              ×
            </button>
          </li>
        </ul>
      </div>
      
      <div 
        v-if="localError || storeError" 
        class="py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm mb-6"
      >
        {{ localError || storeError }}
      </div>
      
      <div class="flex gap-4 justify-end max-sm:flex-col-reverse">
        <button 
          type="button" 
          @click="goBack" 
          class="py-3.5 px-6 bg-bg-secondary text-text-primary border border-border rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-bg-hover max-sm:w-full"
        >
          Abbrechen
        </button>
        <button 
          type="submit" 
          class="btn-primary py-3.5 px-6 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed max-sm:w-full"
          :disabled="loading"
        >
          <span v-if="loading">Speichern...</span>
          <span v-else>{{ isEdit ? 'Aktualisieren' : 'Erstellen' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.category-active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: transparent;
  color: white;
}

.btn-primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}
</style>
