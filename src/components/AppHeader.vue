<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useLaunchPointsStore } from '../stores/launchPoints';

const emit = defineEmits<{
  'toggle-filter': []
}>();

const router = useRouter();
const authStore = useAuthStore();
const launchPointsStore = useLaunchPointsStore();

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
  <header class="app-header">
    <div class="header-left">
      <div class="logo">
        <svg viewBox="0 0 100 100" class="logo-icon">
          <path d="M50 10 C30 10 15 35 15 55 C15 75 30 90 50 90 C70 90 85 75 85 55 C85 35 70 10 50 10 Z" fill="currentColor" opacity="0.2"/>
          <path d="M30 50 Q50 30 70 50 Q50 70 30 50" fill="none" stroke="currentColor" stroke-width="3"/>
          <line x1="50" y1="35" x2="50" y2="65" stroke="currentColor" stroke-width="2"/>
        </svg>
      </div>
      <div class="header-title">
        <h1>Launchspot Manager</h1>
        <span class="filter-label">{{ getActiveFilterLabel() }}</span>
      </div>
    </div>
    
    <div class="header-right">
      <button class="filter-btn" @click="$emit('toggle-filter')" title="Filter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      </button>
      
      <div class="user-menu-container" ref="userMenuRef">
        <button class="user-btn" @click="toggleUserMenu">
          <span class="user-avatar">{{ authStore.user?.username.charAt(0).toUpperCase() }}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        
        <Transition name="menu">
          <div v-if="showUserMenu" class="user-menu">
            <div class="user-info">
              <span class="user-name">{{ authStore.user?.username }}</span>
              <span class="user-email">{{ authStore.user?.email }}</span>
            </div>
            <div class="menu-divider"></div>
            <button class="menu-item" @click="goToImpressum">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              Impressum
            </button>
            <button class="menu-item logout" @click="handleLogout">
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
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  border-radius: 0.625rem;
  color: white;
}

.logo-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.header-title h1 {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.filter-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.filter-btn svg {
  width: 1.25rem;
  height: 1.25rem;
}

.user-menu-container {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.625rem 0.375rem 0.375rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.user-btn:hover {
  background: var(--bg-hover);
}

.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: white;
  font-size: 0.875rem;
  font-weight: 600;
}

.chevron {
  width: 1rem;
  height: 1rem;
  color: var(--text-secondary);
}

.user-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 220px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
}

.user-info {
  padding: 1rem;
}

.user-name {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.125rem;
}

.user-email {
  display: block;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.menu-divider {
  height: 1px;
  background: var(--border-color);
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: none;
  border: none;
  color: var(--text-primary);
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.menu-item:hover {
  background: var(--bg-secondary);
}

.menu-item svg {
  width: 1.125rem;
  height: 1.125rem;
  color: var(--text-secondary);
}

.menu-item.logout {
  color: #ef4444;
}

.menu-item.logout svg {
  color: #ef4444;
}

.menu-enter-active,
.menu-leave-active {
  transition: all 0.2s ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 480px) {
  .header-title h1 {
    font-size: 1rem;
  }
  
  .filter-label {
    display: none;
  }
}
</style>

