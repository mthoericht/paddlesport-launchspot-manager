<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { useAuthStore } from '../stores/auth';
import { useCategories } from '../composables';

const route = useRoute();
const router = useRouter();
const launchPointsStore = useLaunchPointsStore();
const authStore = useAuthStore();
const { categoryColors } = useCategories();

const canEdit = computed(() => {
  const point = launchPointsStore.selectedPoint;
  if (!point || !authStore.user) return false;
  return point.created_by === authStore.user.id || authStore.isAdmin;
});

async function handleDelete() {
  if (!launchPointsStore.selectedPoint) return;
  
  if (confirm('Möchtest du diesen Einsetzpunkt wirklich löschen?')) {
    const success = await launchPointsStore.deleteLaunchPoint(launchPointsStore.selectedPoint.id);
    if (success) {
      router.push('/map');
    }
  }
}

function goBack() {
  router.push('/map');
}

function editPoint() {
  router.push(`/launch-point/${route.params.id}/edit`);
}

onMounted(() => {
  const id = Number(route.params.id);
  launchPointsStore.fetchLaunchPoint(id);
});
</script>

<template>
  <div class="detail-view">
    <header class="detail-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Einsetzpunkt Details</h1>
      <div class="header-actions" v-if="canEdit">
        <button class="icon-btn" @click="editPoint" title="Bearbeiten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="icon-btn delete" @click="handleDelete" title="Löschen">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
    </header>
    
    <main class="detail-content" v-if="launchPointsStore.selectedPoint">
      <div class="point-card">
        <div class="point-header">
          <h2>{{ launchPointsStore.selectedPoint.name }}</h2>
          <div class="categories">
            <span 
              v-for="cat in launchPointsStore.selectedPoint.categories" 
              :key="cat" 
              class="category-tag"
              :style="{ backgroundColor: categoryColors[cat] }"
            >
              {{ cat }}
            </span>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Erstellt von</span>
            <span class="info-value">{{ launchPointsStore.selectedPoint.creator_username }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Koordinaten</span>
            <span class="info-value">
              {{ launchPointsStore.selectedPoint.latitude.toFixed(6) }}, 
              {{ launchPointsStore.selectedPoint.longitude.toFixed(6) }}
            </span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Öffnungszeiten</span>
            <span class="info-value">{{ launchPointsStore.selectedPoint.opening_hours || '24h' }}</span>
          </div>
          
          <div class="info-item" v-if="launchPointsStore.selectedPoint.is_official">
            <span class="info-label">Status</span>
            <span class="info-value official-badge">Offizieller Punkt</span>
          </div>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.hints">
          <h3>Hinweise</h3>
          <p>{{ launchPointsStore.selectedPoint.hints }}</p>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.parking_options">
          <h3>Parkmöglichkeiten</h3>
          <p>{{ launchPointsStore.selectedPoint.parking_options }}</p>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.nearby_waters">
          <h3>Gewässer in der Nähe</h3>
          <p>{{ launchPointsStore.selectedPoint.nearby_waters }}</p>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.food_supply">
          <h3>Lebensmittelversorgung</h3>
          <p>{{ launchPointsStore.selectedPoint.food_supply }}</p>
        </div>
        
        <div class="info-section" v-if="launchPointsStore.selectedPoint.public_transport_stations?.length">
          <h3>ÖPNV-Stationen in der Nähe</h3>
          <ul class="stations-list">
            <li v-for="station in launchPointsStore.selectedPoint.public_transport_stations" :key="station.id">
              <span class="station-name">{{ station.name }}</span>
              <span class="station-distance">{{ station.distance_meters }}m</span>
            </li>
          </ul>
        </div>
      </div>
    </main>
    
    <div class="loading" v-else-if="launchPointsStore.loading">
      <div class="spinner"></div>
      <p>Laden...</p>
    </div>
    
    <div class="error" v-else-if="launchPointsStore.error">
      <p>{{ launchPointsStore.error }}</p>
      <button @click="goBack" class="btn-primary">Zurück zur Karte</button>
    </div>
  </div>
</template>

<style scoped>
.detail-view {
  min-height: 100vh;
  background: var(--bg-primary);
}

.detail-header {
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

.detail-header h1 {
  flex: 1;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.icon-btn.delete:hover {
  color: #ef4444;
}

.icon-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.detail-content {
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.point-card {
  background: var(--bg-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.point-header {
  margin-bottom: 1.5rem;
}

.point-header h2 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  color: white;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.9rem;
  color: var(--text-primary);
}

.official-badge {
  display: inline-block;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.info-section {
  margin-bottom: 1.5rem;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.info-section p {
  color: var(--text-primary);
  line-height: 1.6;
}

.stations-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.stations-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.stations-list li:last-child {
  margin-bottom: 0;
}

.station-name {
  font-weight: 500;
  color: var(--text-primary);
}

.station-distance {
  font-size: 0.875rem;
  color: var(--text-secondary);
  background: var(--bg-hover);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
  color: var(--text-secondary);
}

.spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
}
</style>
