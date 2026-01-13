import { ref } from 'vue';

/**
 * Address search result from geocoding service
 */
interface SearchResult {
  lat: number;
  lon: number;
  boundingbox?: [string, string, string, string];
  display_name: string;
}

/**
 * Composable for searching addresses using Nominatim geocoding service
 * @returns Object with search state and functions
 */
export function useAddressSearch() 
{
  const searchQuery = ref('');
  const isSearching = ref(false);
  const searchError = ref('');
  let errorTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Searches for an address using Nominatim geocoding API
   * @param onSuccess - Callback function called with search result on success
   */
  async function searchAddress(onSuccess: (result: SearchResult) => void): Promise<void> 
  {
    if (!searchQuery.value.trim()) return;
    
    // Clear any existing error timeout
    if (errorTimeoutId !== null)
    {
      clearTimeout(errorTimeoutId);
      errorTimeoutId = null;
    }
    
    isSearching.value = true;
    searchError.value = '';
    
    try 
    {
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
      
      if (results.length > 0) 
      {
        const result = results[0];
        onSuccess({
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          boundingbox: result.boundingbox,
          display_name: result.display_name
        });
        searchQuery.value = '';
      }
      else 
      {
        searchError.value = 'Adresse nicht gefunden';
        errorTimeoutId = setTimeout(() =>
        {
          searchError.value = ''; 
          errorTimeoutId = null;
        }, 3000);
      }
    }
    catch (error) 
    {
      console.error('Geocoding error:', error);
      searchError.value = 'Fehler bei der Suche';
      errorTimeoutId = setTimeout(() =>
      {
        searchError.value = ''; 
        errorTimeoutId = null;
      }, 3000);
    }
    finally 
    {
      isSearching.value = false;
    }
  }

  /**
   * Clears the search query and error state
   */
  function clearSearch(): void 
  {
    if (errorTimeoutId !== null)
    {
      clearTimeout(errorTimeoutId);
      errorTimeoutId = null;
    }
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

