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
  <div class="absolute top-0 right-0 w-80 max-w-full h-full bg-bg-card shadow-[-4px_0_20px_rgba(0,0,0,0.15)] flex flex-col z-[1000] transition-all duration-300 ease-in-out max-md:z-[1001] max-[480px]:w-full">
    <div class="flex items-center justify-between px-5 py-4 border-b border-border">
      <h2 class="font-display text-lg font-semibold text-text-primary">Filter</h2>
      <button 
        class="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-secondary text-text-secondary cursor-pointer transition-all duration-200 hover:bg-bg-hover hover:text-text-primary"
        @click="$emit('close')"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    
    <div class="flex-1 overflow-y-auto p-5">
      <div class="mb-6 last:mb-0">
        <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Anzeigen</h3>
        <div class="flex flex-col gap-2">
          <label 
            class="filter-radio flex items-center gap-3 py-3 px-4 bg-bg-secondary border border-border rounded-xl cursor-pointer transition-all duration-200 text-text-primary hover:border-primary"
            :class="{ 'active': launchPointsStore.filter.type === 'all' }"
          >
            <input 
              type="radio" 
              name="filter-type" 
              value="all"
              class="hidden"
              :checked="launchPointsStore.filter.type === 'all'"
              @change="setFilterType('all')"
            />
            <span>Alle Punkte</span>
          </label>
          
          <label 
            class="filter-radio flex items-center gap-3 py-3 px-4 bg-bg-secondary border border-border rounded-xl cursor-pointer transition-all duration-200 text-text-primary hover:border-primary"
            :class="{ 'active': launchPointsStore.filter.type === 'mine' }"
          >
            <input 
              type="radio" 
              name="filter-type" 
              value="mine"
              class="hidden"
              :checked="launchPointsStore.filter.type === 'mine'"
              @change="setFilterType('mine')"
            />
            <span>Meine Punkte</span>
          </label>
          
          <label 
            class="filter-radio flex items-center gap-3 py-3 px-4 bg-bg-secondary border border-border rounded-xl cursor-pointer transition-all duration-200 text-text-primary hover:border-primary"
            :class="{ 'active': launchPointsStore.filter.type === 'official' }"
          >
            <input 
              type="radio" 
              name="filter-type" 
              value="official"
              class="hidden"
              :checked="launchPointsStore.filter.type === 'official'"
              @change="setFilterType('official')"
            />
            <span>Offizielle Punkte</span>
          </label>
          
          <label 
            class="filter-radio flex items-center gap-3 py-3 px-4 bg-bg-secondary border border-border rounded-xl cursor-pointer transition-all duration-200 text-text-primary hover:border-primary"
            :class="{ 'active': launchPointsStore.filter.type === 'user' }"
          >
            <input 
              type="radio" 
              name="filter-type" 
              value="user"
              class="hidden"
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
          class="w-full mt-3 py-3 px-4 border border-border rounded-xl bg-bg-secondary text-text-primary text-[0.9375rem] cursor-pointer focus:outline-none focus:border-primary"
        >
          <option value="">Benutzer wählen...</option>
          <option v-for="user in users" :key="user.id" :value="user.username">
            {{ user.username }}
          </option>
        </select>
      </div>
      
      <div class="mb-6 last:mb-0">
        <h3 class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Kategorien</h3>
        <div class="flex flex-col gap-2">
          <label 
            v-for="cat in categoriesStore.categories" 
            :key="cat.id" 
            class="category-checkbox flex items-center gap-3 py-3 px-4 bg-bg-secondary border border-border rounded-xl cursor-pointer transition-all duration-200 text-text-primary hover:border-primary"
            :class="{ 'active': launchPointsStore.filter.categories.includes(cat.id) }"
          >
            <input 
              type="checkbox" 
              class="hidden"
              :checked="launchPointsStore.filter.categories.includes(cat.id)"
              @change="launchPointsStore.toggleCategory(cat.id)"
            />
            <span 
              class="checkbox-icon flex items-center justify-center w-5 h-5 border-2 border-border rounded-md transition-all duration-200"
              :class="{ 'bg-primary border-primary': launchPointsStore.filter.categories.includes(cat.id) }"
            >
              <svg v-if="launchPointsStore.filter.categories.includes(cat.id)" class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </span>
            <span>{{ cat.name_de }}</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="px-5 py-4 border-t border-border">
      <button 
        class="w-full py-3 bg-bg-secondary border border-border rounded-xl text-text-secondary text-[0.9375rem] font-medium cursor-pointer transition-all duration-200 hover:bg-bg-hover hover:text-text-primary"
        @click="clearFilters"
      >
        Filter zurücksetzen
      </button>
    </div>
  </div>
</template>

<style scoped>
.filter-radio.active {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-color: transparent;
  color: white;
}

.category-checkbox.active {
  border-color: var(--color-primary);
  background: rgba(14, 165, 233, 0.1);
}
</style>
