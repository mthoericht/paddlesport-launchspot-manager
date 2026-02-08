<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';
import { useThemeStore } from './stores/theme';

const authStore = useAuthStore();
const themeStore = useThemeStore();

onMounted(() => {
  // Initialize theme on app start
  themeStore.applyTheme();
  
  if (authStore.token) {
    authStore.fetchCurrentUser();
  }
});
</script>

<template>
  <a href="#main-content" class="skip-link">Zum Hauptinhalt springen</a>
  <router-view />
</template>

<style scoped>
@reference "./style.css";

.skip-link {
  @apply absolute left-4 top-4 -translate-y-[200%] z-[9999] px-4 py-2 bg-primary text-white font-semibold rounded-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
}
</style>

<style>
/* Global styles are in style.css */
</style>
