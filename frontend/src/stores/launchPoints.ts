import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LaunchPoint, LaunchPointFormData, FilterState } from '../types';
import { useAuthStore } from './auth';
import {
  fetchLaunchPoints as apiFetchLaunchPoints,
  fetchLaunchPoint as apiFetchLaunchPoint,
  createLaunchPoint as apiCreateLaunchPoint,
  updateLaunchPoint as apiUpdateLaunchPoint,
  deleteLaunchPoint as apiDeleteLaunchPoint
} from '../api/launchPoints';

export const useLaunchPointsStore = defineStore('launchPoints', () =>
{
  const launchPoints = ref<LaunchPoint[]>([]);
  const selectedPoint = ref<LaunchPoint | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const filter = ref<FilterState>({
    type: 'all',
    categories: []
  });

  const authStore = useAuthStore();

  async function fetchLaunchPoints()
  {
    loading.value = true;
    error.value = null;

    try
    {
      launchPoints.value = await apiFetchLaunchPoints(filter.value, authStore.token);
    }
    catch (err: unknown)
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
    }
    finally
    {
      loading.value = false;
    }
  }

  async function fetchLaunchPoint(id: number)
  {
    loading.value = true;
    error.value = null;

    try
    {
      selectedPoint.value = await apiFetchLaunchPoint(id, authStore.token);
      return selectedPoint.value;
    }
    catch (err: unknown)
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      return null;
    }
    finally
    {
      loading.value = false;
    }
  }

  async function createLaunchPoint(data: LaunchPointFormData)
  {
    loading.value = true;
    error.value = null;

    try
    {
      const result = await apiCreateLaunchPoint(data, authStore.token);
      await fetchLaunchPoints();
      return result.id;
    }
    catch (err: unknown)
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      return null;
    }
    finally
    {
      loading.value = false;
    }
  }

  async function updateLaunchPoint(id: number, data: LaunchPointFormData)
  {
    loading.value = true;
    error.value = null;

    try
    {
      await apiUpdateLaunchPoint(id, data, authStore.token);
      await fetchLaunchPoints();
      return true;
    }
    catch (err: unknown)
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      return false;
    }
    finally
    {
      loading.value = false;
    }
  }

  async function deleteLaunchPoint(id: number)
  {
    loading.value = true;
    error.value = null;

    try
    {
      await apiDeleteLaunchPoint(id, authStore.token);
      await fetchLaunchPoints();
      return true;
    }
    catch (err: unknown)
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      return false;
    }
    finally
    {
      loading.value = false;
    }
  }

  function setFilter(newFilter: Partial<FilterState>)
  {
    filter.value = { ...filter.value, ...newFilter };
    fetchLaunchPoints();
  }

  function toggleCategory(categoryId: number)
  {
    const index = filter.value.categories.indexOf(categoryId);
    if (index === -1)
    {
      filter.value.categories.push(categoryId);
    }
    else
    {
      filter.value.categories.splice(index, 1);
    }
    fetchLaunchPoints();
  }

  function clearFilters()
  {
    filter.value = { type: 'all', categories: [] };
    fetchLaunchPoints();
  }

  return {
    launchPoints,
    selectedPoint,
    loading,
    error,
    filter,
    fetchLaunchPoints,
    fetchLaunchPoint,
    createLaunchPoint,
    updateLaunchPoint,
    deleteLaunchPoint,
    setFilter,
    toggleCategory,
    clearFilters
  };
});
