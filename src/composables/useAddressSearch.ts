import { ref } from 'vue';

interface SearchResult {
  lat: number;
  lon: number;
  boundingbox?: [string, string, string, string];
  display_name: string;
}

export function useAddressSearch() {
  const searchQuery = ref('');
  const isSearching = ref(false);
  const searchError = ref('');

  async function searchAddress(onSuccess: (result: SearchResult) => void): Promise<void> {
    if (!searchQuery.value.trim()) return;
    
    isSearching.value = true;
    searchError.value = '';
    
    try {
      const query = encodeURIComponent(searchQuery.value.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`,
        {
          headers: {
            'Accept-Language': 'de'
          }
        }
      );
      
      const results = await response.json();
      
      if (results.length > 0) {
        const result = results[0];
        onSuccess({
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          boundingbox: result.boundingbox,
          display_name: result.display_name
        });
        searchQuery.value = '';
      } else {
        searchError.value = 'Adresse nicht gefunden';
        setTimeout(() => { searchError.value = ''; }, 3000);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      searchError.value = 'Fehler bei der Suche';
      setTimeout(() => { searchError.value = ''; }, 3000);
    } finally {
      isSearching.value = false;
    }
  }

  function clearSearch(): void {
    searchQuery.value = '';
    searchError.value = '';
  }

  return {
    searchQuery,
    isSearching,
    searchError,
    searchAddress,
    clearSearch
  };
}

