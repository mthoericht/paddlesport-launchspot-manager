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
  <div class="list-view">
    <div class="list-header">
      <h2>Einsetzpunkte</h2>
      <span class="count-badge">{{ launchPointsStore.launchPoints.length }}</span>
    </div>
    
    <div class="list-content">
      <div 
        v-for="point in launchPointsStore.launchPoints" 
        :key="point.id"
        class="list-item"
        :class="{ highlighted: highlightedPointId === point.id }"
      >
        <div class="item-header">
          <div class="item-icon">
            <img 
              :src="categoriesStore.getCategoryIcon(point.categories)" 
              :alt="point.categories.join(', ')"
              class="category-icon"
            />
          </div>
          <div class="item-info">
            <h3 class="item-name">{{ point.name }}</h3>
            <div class="item-meta">
              <span class="item-creator">von {{ point.creator_username }}</span>
              <span v-if="point.is_official" class="official-badge">Offiziell</span>
            </div>
          </div>
        </div>
        
        <div class="item-categories">
          <span 
            v-for="cat in point.categories" 
            :key="cat" 
            class="category-tag"
            :style="{ backgroundColor: categoriesStore.categoryColors[cat] }"
          >
            {{ cat }}
          </span>
        </div>
        
        <div class="item-details">
          <div class="detail-row" v-if="point.opening_hours">
            <span class="detail-label">Öffnungszeiten:</span>
            <span class="detail-value">{{ point.opening_hours }}</span>
          </div>
          <div class="detail-row" v-if="point.hints">
            <span class="detail-label">Hinweise:</span>
            <span class="detail-value">{{ point.hints.substring(0, 100) }}{{ point.hints.length > 100 ? '...' : '' }}</span>
          </div>
        </div>
        
        <div class="item-actions">
          <button 
            class="action-btn primary"
            @click="handleShowOnMap(point)"
            title="Auf Karte anzeigen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Auf Karte anzeigen
          </button>
          <button 
            class="action-btn secondary"
            @click="handleOpenDetail(point)"
            title="Details anzeigen"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Details
          </button>
          <button 
            class="action-btn nav"
            @click="openNavigation(point.latitude, point.longitude, point.name)"
            title="Navigation starten"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div v-if="launchPointsStore.launchPoints.length === 0" class="empty-state">
        <p>Keine Einsetzpunkte gefunden</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-card);
  border-left: 1px solid var(--border-color);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
  position: sticky;
  top: 0;
  z-index: 10;
}

.list-header h2 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 0.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
}

.list-item {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s;
  cursor: pointer;
}

.list-item:hover {
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.1);
  transform: translateY(-1px);
}

.list-item.highlighted {
  border-color: var(--color-primary);
  background: rgba(14, 165, 233, 0.05);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
  animation: highlightPulse 2s ease-in-out infinite;
}

@keyframes highlightPulse {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.3);
  }
}

.item-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.item-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
  word-break: break-word;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.item-creator {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.official-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 1rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.item-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.category-tag {
  font-size: 0.625rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
}

.item-details {
  margin-bottom: 0.75rem;
}

.detail-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8125rem;
  margin-bottom: 0.375rem;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-weight: 500;
  color: var(--text-muted);
  flex-shrink: 0;
}

.detail-value {
  color: var(--text-primary);
  flex: 1;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 0;
  justify-content: center;
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
}

.action-btn.primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3);
}

.action-btn.secondary {
  background: var(--bg-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.action-btn.secondary:hover {
  background: var(--bg-secondary);
  border-color: var(--color-primary);
}

.action-btn svg {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.action-btn.nav {
  flex: 0 0 2.5rem;
  width: 2.5rem;
  padding: 0;
  background: var(--bg-hover);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.action-btn.nav:hover {
  background: linear-gradient(135deg, #34d399, #10b981);
  color: white;
  border-color: transparent;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: 0.9375rem;
}

@media (max-width: 768px) {
  .item-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>

