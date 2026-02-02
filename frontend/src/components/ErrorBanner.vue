<script setup lang="ts">
defineProps<{
  message: string;
  dismissible?: boolean;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <div 
    class="flex items-center gap-3 px-4 py-3 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:bg-red-500/15 dark:text-red-400"
    role="alert"
  >
    <svg 
      class="shrink-0 w-5 h-5" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
    <p class="flex-1 text-sm font-medium m-0">{{ message }}</p>
    <button
      v-if="dismissible"
      type="button"
      class="shrink-0 p-1 rounded-lg hover:bg-red-500/20 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
      aria-label="Fehlermeldung schließen"
      @click="emit('dismiss')"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  </div>
</template>
