<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { useAuthStore } from '../stores/auth';
import { useCategoriesStore } from '../stores/categories';
import { API_BASE_URL } from '../config/api';
import type { FilterType } from '../types';

const emit = defineEmits<{
  'close': []
}>();

const launchPointsStore = useLaunchPointsStore();
const authStore = useAuthStore();
const categoriesStore = useCategoriesStore();

const users = ref<{ id: number; username: string }[]>([]);
const selectedUsername = ref(launchPointsStore.filter.username || '');

async function fetchUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
      headers: { 'Authorization': `Bearer ${authStore.token}` }
    });
    if (response.ok) {
      users.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

function setFilterType(type: FilterType) {
  if (type === 'user' && selectedUsername.value) {
    launchPointsStore.setFilter({ type, username: selectedUsername.value });
  } else {
    launchPointsStore.setFilter({ type, username: undefined });
  }
}

function handleUsernameChange() {
  if (launchPointsStore.filter.type === 'user') {
    launchPointsStore.setFilter({ username: selectedUsername.value });
  }
}

function clearFilters() {
  selectedUsername.value = '';
  launchPointsStore.clearFilters();
}

onMounted(async () => {
  await categoriesStore.fetchCategories();
  fetchUsers();
});
</script>

<template>
  <div class="filter-panel">
    <div class="panel-header">
      <h2>Filter</h2>
      <button class="close-btn" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    
    <div class="panel-content">
      <div class="filter-section">
        <h3>Anzeigen</h3>
        <div class="filter-options">
          <label class="filter-radio" :class="{ active: launchPointsStore.filter.type === 'all' }">
            <input 
              type="radio" 
              name="filter-type" 
              value="all"
              :checked="launchPointsStore.filter.type === 'all'"
              @change="setFilterType('all')"
            />
            <span>Alle Punkte</span>
          </label>
          
          <label class="filter-radio" :class="{ active: launchPointsStore.filter.type === 'mine' }">
            <input 
              type="radio" 
              name="filter-type" 
              value="mine"
              :checked="launchPointsStore.filter.type === 'mine'"
              @change="setFilterType('mine')"
            />
            <span>Meine Punkte</span>
          </label>
          
          <label class="filter-radio" :class="{ active: launchPointsStore.filter.type === 'official' }">
            <input 
              type="radio" 
              name="filter-type" 
              value="official"
              :checked="launchPointsStore.filter.type === 'official'"
              @change="setFilterType('official')"
            />
            <span>Offizielle Punkte</span>
          </label>
          
          <label class="filter-radio" :class="{ active: launchPointsStore.filter.type === 'user' }">
            <input 
              type="radio" 
              name="filter-type" 
              value="user"
              :checked="launchPointsStore.filter.type === 'user'"
              @change="setFilterType('user')"
            />
            <span>Nach Benutzer</span>
          </label>
        </div>
        
        <select 
          v-if="launchPointsStore.filter.type === 'user'"
          v-model="selectedUsername"
          @change="handleUsernameChange"
          class="user-select"
        >
          <option value="">Benutzer wählen...</option>
          <option v-for="user in users" :key="user.id" :value="user.username">
            {{ user.username }}
          </option>
        </select>
      </div>
      
      <div class="filter-section">
        <h3>Kategorien</h3>
        <div class="category-options">
          <label 
            v-for="cat in categoriesStore.categories" 
            :key="cat.id" 
            class="category-checkbox"
            :class="{ active: launchPointsStore.filter.categories.includes(cat.id) }"
          >
            <input 
              type="checkbox" 
              :checked="launchPointsStore.filter.categories.includes(cat.id)"
              @change="launchPointsStore.toggleCategory(cat.id)"
            />
            <span class="checkbox-icon">
              <svg v-if="launchPointsStore.filter.categories.includes(cat.id)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span>{{ cat.name_de }}</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="panel-footer">
      <button class="btn-clear" @click="clearFilters">Filter zurücksetzen</button>
    </div>
  </div>
</template>

<style scoped>
.filter-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  max-width: 100%;
  height: 100%;
  background: var(--bg-card);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  transition: transform 0.3s ease, margin-right 0.3s ease;
}


.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h2 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.close-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

.filter-section {
  margin-bottom: 1.5rem;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-section h3 {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-radio {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.filter-radio input {
  display: none;
}

.filter-radio:hover {
  border-color: var(--color-primary);
}

.filter-radio.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: transparent;
  color: white;
}

.user-select {
  width: 100%;
  margin-top: 0.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.9375rem;
  cursor: pointer;
}

.user-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.category-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.category-checkbox input {
  display: none;
}

.category-checkbox:hover {
  border-color: var(--color-primary);
}

.category-checkbox.active {
  border-color: var(--color-primary);
  background: rgba(14, 165, 233, 0.1);
}

.checkbox-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-color);
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.category-checkbox.active .checkbox-icon {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.checkbox-icon svg {
  width: 0.875rem;
  height: 0.875rem;
  color: white;
}

.panel-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid var(--border-color);
}

.btn-clear {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .filter-panel {
    z-index: 1001; /* Above list view on mobile */
  }
}

@media (max-width: 480px) {
  .filter-panel {
    width: 100%;
  }
}
</style>
