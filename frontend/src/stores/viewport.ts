import { defineStore } from 'pinia';
import { ref } from 'vue';

const MOBILE_BREAKPOINT = 768;

function checkIsMobile(): boolean
{
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

export const useViewportStore = defineStore('viewport', () =>
{
  const isMobile = ref(checkIsMobile());

  function updateViewport(): void
  {
    isMobile.value = checkIsMobile();
  }

  window.addEventListener('resize', updateViewport);

  return {
    isMobile,
    updateViewport
  };
});
