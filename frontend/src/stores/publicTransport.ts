import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PublicTransportPoint } from '../types';
import { API_BASE_URL } from '../config/api';

const API_URL = `${API_BASE_URL}/api`;

export const usePublicTransportStore = defineStore('publicTransport', () => 
{
  const publicTransportPoints = ref<PublicTransportPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPublicTransportPoints() 
  {
    loading.value = true;
    error.value = null;
    
    try 
    {
      const response = await fetch(`${API_URL}/public-transport`);
      
      if (!response.ok) 
      {
        throw new Error('Fehler beim Laden der ÖPNV-Stationen');
      }
      
      publicTransportPoints.value = await response.json();
    }
    catch (err: unknown)
    {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error.value = errorMessage;
      console.error('Error fetching public transport points:', errorMessage);
    }
    finally 
    {
      loading.value = false;
    }
  }

  return {
    publicTransportPoints,
    loading,
    error,
    fetchPublicTransportPoints
  };
});
