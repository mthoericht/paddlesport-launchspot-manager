import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'theme-mode';

export const useThemeStore = defineStore('theme', () =>
{
  const mode = ref<ThemeMode>((localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'auto');
  const resolvedTheme = ref<'light' | 'dark'>('light');

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  function getSystemTheme(): 'light' | 'dark'
  {
    return mediaQuery.matches ? 'dark' : 'light';
  }

  function updateResolvedTheme()
  {
    if (mode.value === 'auto')
    {
      resolvedTheme.value = getSystemTheme();
    }
    else
    {
      resolvedTheme.value = mode.value;
    }
  }

  function applyTheme()
  {
    updateResolvedTheme();
    
    if (resolvedTheme.value === 'dark')
    {
      document.documentElement.classList.add('dark');
    }
    else
    {
      document.documentElement.classList.remove('dark');
    }
  }

  function setMode(newMode: ThemeMode)
  {
    mode.value = newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
    applyTheme();
  }

  // Listen for system theme changes
  mediaQuery.addEventListener('change', () =>
  {
    if (mode.value === 'auto')
    {
      applyTheme();
    }
  });

  // Watch for mode changes
  watch(mode, applyTheme, { immediate: true });

  return {
    mode,
    resolvedTheme,
    setMode,
    applyTheme,
  };
});
