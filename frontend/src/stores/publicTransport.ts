import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { PublicTransportPoint } from '../types';
import { fetchPublicTransportPoints } from '../api/publicTransport';

export const usePublicTransportStore = defineStore('publicTransport', () =>
{
  const publicTransportPoints = ref<PublicTransportPoint[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchPublicTransportPointsAction()
  {
    loading.value = true;
    error.value = null;

    try
    {
      publicTransportPoints.value = await fetchPublicTransportPoints();
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
    fetchPublicTransportPoints: fetchPublicTransportPointsAction
  };
});
