<script setup lang="ts">
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
  showContextMenu: boolean;
  contextMenuPosition: { x: number; y: number };
  currentPosition: GpsPosition | null;
  positionError: string | null;
  isLocating: boolean;
  hideOnMobile: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'add-new-point': [];
  'center-on-position': [];
  'add-point-at-context': [];
  'close-context-menu': [];
}>();
</script>

<template>
  <!-- GPS Location Button -->
  <button 
    v-if="currentPosition"
    class="fab gps-fab" 
    :class="{ 'hide-on-mobile': hideOnMobile }"
    @click="emit('center-on-position')" 
    title="Auf meine Position zentrieren"
    :disabled="isLocating"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </button>
  
  <!-- GPS Error Message -->
  <div 
    v-if="positionError && !currentPosition" 
    class="gps-error"
    :class="{ 'hide-on-mobile': hideOnMobile }"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="gps-error-icon">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <span>{{ positionError }}</span>
  </div>
  
  <!-- Add Point Button -->
  <button 
    class="fab" 
    :class="{ 'hide-on-mobile': hideOnMobile }"
    @click="emit('add-new-point')" 
    title="Neuen Einsetzpunkt hinzufügen"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>
  
  <!-- Kontextmenü -->
  <div 
    v-if="showContextMenu" 
    class="context-menu"
    :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
    @click.stop
  >
    <button class="context-menu-item" @click="emit('add-point-at-context')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span>Einsetzpunkt hinzufügen</span>
    </button>
  </div>
</template>

<style scoped>
.fab {
  position: absolute;
  bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
  right: 1.5rem;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
  transition: all 0.2s;
  z-index: 1000;
}

.fab.gps-fab {
  bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(135deg, #4285F4, #34A853);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
}

.fab.gps-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(66, 133, 244, 0.5);
}

.fab:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(14, 165, 233, 0.5);
}

.fab svg {
  width: 1.5rem;
  height: 1.5rem;
}

.gps-error {
  position: absolute;
  bottom: calc(10rem + env(safe-area-inset-bottom, 0px));
  right: 1rem;
  background: rgba(239, 68, 68, 0.95);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 200px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.gps-error-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* Kontextmenü */
.context-menu {
  position: absolute;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 2000;
  min-width: 200px;
  padding: 0.25rem;
  animation: contextMenuFadeIn 0.15s ease-out;
}

@keyframes contextMenuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}

.context-menu-item:hover {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
}

.context-menu-item svg {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .fab {
    bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
    right: 1rem;
  }
  
  .fab.gps-fab {
    bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  }
  
  .fab.hide-on-mobile {
    display: none;
  }
  
  .gps-error {
    bottom: calc(9rem + env(safe-area-inset-bottom, 0px));
    right: 0.75rem;
    max-width: 180px;
  }
  
  .gps-error.hide-on-mobile {
    display: none;
  }
}
</style>
