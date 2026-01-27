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
  <router-view />
</template>

<style>
/* Global styles are in style.css */
</style>
