import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { LaunchPoint, LaunchPointFormData, FilterState, Category } from '../types';
import { useAuthStore } from './auth';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

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

  function getAuthHeaders() 
  {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authStore.token}`
    };
  }

  async function fetchLaunchPoints() 
  {
    loading.value = true;
    error.value = null;
    
    try 
    {
      const params = new URLSearchParams();
      
      if (filter.value.type === 'mine') 
      {
        params.append('filter', 'mine');
      }
      else if (filter.value.type === 'official') 
      {
        params.append('filter', 'official');
      }
      else if (filter.value.type === 'user' && filter.value.username) 
      {
        params.append('filter', 'user');
        params.append('username', filter.value.username);
      }
      
      if (filter.value.categories.length > 0) 
      {
        params.append('categories', filter.value.categories.map(String).join(','));
      }
      
      const response = await fetch(`${API_URL}/launch-points?${params}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) 
      {
        throw new Error('Fehler beim Laden der Einsetzpunkte');
      }
      
      launchPoints.value = await response.json();
    }
    catch (err: any) 
    {
      error.value = err.message;
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
      const response = await fetch(`${API_URL}/launch-points/${id}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) 
      {
        throw new Error('Einsetzpunkt nicht gefunden');
      }
      
      selectedPoint.value = await response.json();
      return selectedPoint.value;
    }
    catch (err: any) 
    {
      error.value = err.message;
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
      const response = await fetch(`${API_URL}/launch-points`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) 
      {
        throw new Error(result.error || 'Fehler beim Erstellen');
      }
      
      await fetchLaunchPoints();
      return result.id;
    }
    catch (err: any) 
    {
      error.value = err.message;
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
      const response = await fetch(`${API_URL}/launch-points/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!response.ok) 
      {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }
      
      await fetchLaunchPoints();
      return true;
    }
    catch (err: any) 
    {
      error.value = err.message;
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
      const response = await fetch(`${API_URL}/launch-points/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const result = await response.json();
      
      if (!response.ok) 
      {
        throw new Error(result.error || 'Fehler beim Löschen');
      }
      
      await fetchLaunchPoints();
      return true;
    }
    catch (err: any) 
    {
      error.value = err.message;
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

