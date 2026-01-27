<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useLaunchPointsStore } from '../stores/launchPoints';
import { useThemeStore, type ThemeMode } from '../stores/theme';

const props = defineProps<{
  showList?: boolean;
  showFilter?: boolean;
}>();

const emit = defineEmits<{
  'toggle-filter': [];
  'toggle-list': [];
}>();

const router = useRouter();
const authStore = useAuthStore();
const launchPointsStore = useLaunchPointsStore();
const themeStore = useThemeStore();

const showUserMenu = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

function toggleUserMenu(event: Event) {
  event.stopPropagation();
  showUserMenu.value = !showUserMenu.value;
}

function closeUserMenu() {
  showUserMenu.value = false;
}

function handleClickOutside(event: Event) {
  const target = event.target as HTMLElement;
  if (showUserMenu.value && userMenuRef.value && !userMenuRef.value.contains(target)) {
    closeUserMenu();
  }
}

function goToImpressum(event: Event) {
  event.stopPropagation();
  closeUserMenu();
  router.push('/impressum');
}

function handleLogout(event: Event) {
  event.stopPropagation();
  closeUserMenu();
  authStore.logout();
  router.push('/login');
}

function cycleTheme(event: Event) {
  event.stopPropagation();
  const modes: ThemeMode[] = ['light', 'dark', 'auto'];
  const currentIndex = modes.indexOf(themeStore.mode);
  const nextIndex = (currentIndex + 1) % modes.length;
  themeStore.setMode(modes[nextIndex] as ThemeMode);
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

function getActiveFilterLabel() {
  const filter = launchPointsStore.filter;
  const parts = [];
  
  if (filter.type === 'mine') {
    parts.push('Meine');
  } else if (filter.type === 'official') {
    parts.push('Offizielle');
  } else if (filter.type === 'user' && filter.username) {
    parts.push(filter.username);
  }
  
  if (filter.categories.length > 0) {
    parts.push(filter.categories.join(', '));
  }
  
  return parts.length > 0 ? parts.join(' • ') : 'Alle anzeigen';
}
</script>

<template>
  <header class="flex items-center justify-between px-4 py-3 bg-bg-card border-b border-border z-[1100] relative">
    <div class="flex items-center gap-3">
      <div class="flex items-center justify-center w-10 h-10 rounded-[0.625rem] text-white bg-gradient-to-br from-primary to-secondary">
        <svg viewBox="0 0 100 100" class="w-6 h-6">
          <path d="M50 10 C30 10 15 35 15 55 C15 75 30 90 50 90 C70 90 85 75 85 55 C85 35 70 10 50 10 Z" fill="currentColor" opacity="0.2"/>
          <path d="M30 50 Q50 30 70 50 Q50 70 30 50" fill="none" stroke="currentColor" stroke-width="3"/>
          <line x1="50" y1="35" x2="50" y2="65" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <div>
        <h1 class="font-display text-lg font-semibold text-text-primary leading-tight">Launchspot Manager</h1>
        <span class="text-xs text-text-secondary max-sm:hidden">{{ getActiveFilterLabel() }}</span>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <button 
        class="flex items-center justify-center w-10 h-10 rounded-[0.625rem] bg-bg-secondary border border-border text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
        @click="$emit('toggle-list')" 
        :title="props.showList ? 'Liste ausblenden' : 'Liste anzeigen'"
      >
        <svg v-if="props.showList" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="8" y1="6" x2="21" y2="6"/>
          <line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/>
          <line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
      </button>
      
      <button 
        class="flex items-center justify-center w-10 h-10 rounded-[0.625rem] bg-bg-secondary border border-border text-text-secondary cursor-pointer hover:bg-bg-hover hover:text-primary [&_svg]:w-5 [&_svg]:h-5"
        :class="{ 'bg-gradient-to-br from-primary to-secondary !border-transparent !text-white': props.showFilter }" 
        @click="$emit('toggle-filter')" 
        title="Filter"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      </button>
      
      <div class="relative" ref="userMenuRef">
        <button 
          class="flex items-center gap-2 py-1.5 pr-2.5 pl-1.5 bg-bg-secondary border border-border rounded-full cursor-pointer hover:bg-bg-hover"
          @click="toggleUserMenu"
        >
          <span class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-sm font-semibold">{{ authStore.user?.username.charAt(0).toUpperCase() }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-text-secondary">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        
        <Transition name="menu">
          <div v-if="showUserMenu" class="absolute top-[calc(100%+0.5rem)] right-0 min-w-[220px] bg-bg-card border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] overflow-hidden z-[1001]">
            <div class="p-4">
              <span class="block font-semibold text-text-primary mb-0.5">{{ authStore.user?.username }}</span>
              <span class="block text-sm text-text-secondary">{{ authStore.user?.email }}</span>
            </div>
            <div class="h-px bg-border"></div>
            <button class="flex items-center gap-3 w-full py-3.5 px-4 bg-transparent border-none text-text-primary text-[0.9375rem] cursor-pointer text-left hover:bg-bg-secondary [&_svg]:w-[1.125rem] [&_svg]:h-[1.125rem] [&_svg]:text-text-secondary" @click="cycleTheme">
              <!-- Sun icon for light mode -->
              <svg v-if="themeStore.mode === 'light'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <!-- Moon icon for dark mode -->
              <svg v-else-if="themeStore.mode === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
              <!-- Auto icon for system mode -->
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              {{ themeStore.mode === 'light' ? 'Hell' : themeStore.mode === 'dark' ? 'Dunkel' : 'Automatisch' }}
            </button>
            <button class="flex items-center gap-3 w-full py-3.5 px-4 bg-transparent border-none text-text-primary text-[0.9375rem] cursor-pointer text-left hover:bg-bg-secondary [&_svg]:w-[1.125rem] [&_svg]:h-[1.125rem] [&_svg]:text-text-secondary" @click="goToImpressum">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Impressum
            </button>
            <button class="flex items-center gap-3 w-full py-3.5 px-4 bg-transparent border-none text-red-500 text-[0.9375rem] cursor-pointer text-left hover:bg-bg-secondary [&_svg]:w-[1.125rem] [&_svg]:h-[1.125rem] [&_svg]:text-red-500" @click="handleLogout">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Abmelden
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>

