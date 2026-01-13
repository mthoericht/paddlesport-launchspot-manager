import { ref, computed, watch } from 'vue';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';
import type { LeafletMouseEvent } from 'leaflet';
import { useLaunchPointsStore } from '../stores/launchPoints';
import type { LaunchPointFormData } from '../types';

/**
 * Latitude/longitude tuple for map coordinates
 */
type LatLngTuple = [number, number];

/** Default latitude (center of Germany) */
const DEFAULT_LAT = 51.1657;
/** Default longitude (center of Germany) */
const DEFAULT_LNG = 10.4515;
/** Default zoom level for initial map view */
const DEFAULT_ZOOM = 6;

/**
 * Initial form values derived from URL query parameters
 */
interface InitialValues {
  latitude: number;
  longitude: number;
  zoom: number;
  hasMarker: boolean;
}

/**
 * Extracts a single string value from a LocationQuery parameter
 * @param value - Query parameter value (can be string, array, or null/undefined)
 * @returns String value or undefined
 */
function getQueryValue(value: LocationQuery[string] | undefined): string | undefined
{
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value[0] ?? undefined;
  return value;
}

/**
 * Parses URL query parameters to determine initial map position and marker state
 * @param query - Vue Router LocationQuery object
 * @returns Initial values for form and map
 */
function getInitialValuesFromQuery(query: LocationQuery): InitialValues 
{
  const lat = getQueryValue(query.lat);
  const lng = getQueryValue(query.lng);
  const centerLat = getQueryValue(query.centerLat);
  const centerLng = getQueryValue(query.centerLng);
  const queryZoom = getQueryValue(query.zoom);
  
  if (lat && lng) 
  {
    // Rechtsklick/Kontextmenü: Position direkt setzen
    return {
      latitude: parseFloat(lat as string),
      longitude: parseFloat(lng as string),
      zoom: queryZoom ? parseInt(queryZoom as string) : 14,
      hasMarker: true
    };
  }
  else if (centerLat && centerLng) 
  {
    // + Button: Kartenausschnitt übernehmen
    return {
      latitude: parseFloat(centerLat as string),
      longitude: parseFloat(centerLng as string),
      zoom: queryZoom ? parseInt(queryZoom as string) : 10,
      hasMarker: false
    };
  }
  
  return { 
    latitude: DEFAULT_LAT, 
    longitude: DEFAULT_LNG, 
    zoom: DEFAULT_ZOOM,
    hasMarker: false
  };
}

/**
 * Composable for managing the launch point create/edit form
 * Handles form state, validation, map interactions, and submission
 * @returns Form state, computed properties, and action methods
 */
export function useLaunchPointForm() 
{
  const route = useRoute();
  const router = useRouter();
  const launchPointsStore = useLaunchPointsStore();

  const isEdit = computed(() => route.name === 'edit-launch-point');
  const pointId = computed(() => Number(route.params.id));

  // Initiale Werte aus Query-Parametern
  const initialValues = getInitialValuesFromQuery(route.query);

  const form = ref<LaunchPointFormData>({
    name: '',
    latitude: initialValues.latitude,
    longitude: initialValues.longitude,
    hints: '',
    opening_hours: '24h',
    parking_options: '',
    nearby_waters: '',
    food_supply: '',
    categories: [],
    public_transport_stations: []
  });

  const markerPosition = ref<LatLngTuple>(
    initialValues.hasMarker 
      ? [initialValues.latitude, initialValues.longitude] 
      : [DEFAULT_LAT, DEFAULT_LNG]
  );
  const mapCenter = ref<LatLngTuple>([initialValues.latitude, initialValues.longitude]);
  const zoom = ref(initialValues.zoom);

  const newStation = ref<{ name: string; distance_meters: number | null }>({ 
    name: '', 
    distance_meters: null 
  });
  const localError = ref('');

  /**
   * Toggles a category selection on/off
   * @param categoryId - ID of the category to toggle
   */
  function toggleCategory(categoryId: number): void 
  {
    const index = form.value.categories.indexOf(categoryId);
    if (index === -1) 
    {
      form.value.categories.push(categoryId);
    }
    else 
    {
      form.value.categories.splice(index, 1);
    }
  }

  /**
   * Handles map click events to update marker position
   * @param e - Leaflet mouse event with coordinates
   */
  function handleMapClick(e: LeafletMouseEvent): void 
  {
    const { lat, lng } = e.latlng;
    form.value.latitude = lat;
    form.value.longitude = lng;
    markerPosition.value = [lat, lng];
  }

  /**
   * Adds a new public transport station to the form (max 5)
   * @returns True if station was added successfully
   */
  function addStation(): boolean 
  {
    if (!newStation.value.name.trim() || !newStation.value.distance_meters || newStation.value.distance_meters <= 0) 
    {
      return false;
    }
    if (form.value.public_transport_stations.length >= 5) 
    {
      localError.value = 'Maximal 5 ÖPNV-Stationen erlaubt.';
      return false;
    }
    form.value.public_transport_stations.push({ 
      name: newStation.value.name, 
      distance_meters: newStation.value.distance_meters 
    });
    newStation.value = { name: '', distance_meters: null };
    return true;
  }

  /**
   * Removes a public transport station from the form
   * @param index - Index of the station to remove
   */
  function removeStation(index: number): void 
  {
    form.value.public_transport_stations.splice(index, 1);
  }

  /**
   * Validates and submits the form (create or update)
   * @returns True if submission was successful
   */
  async function handleSubmit(): Promise<boolean> 
  {
    localError.value = '';
    
    if (!form.value.name.trim()) 
    {
      localError.value = 'Bitte gib einen Namen ein.';
      return false;
    }
    
    if (form.value.categories.length === 0) 
    {
      localError.value = 'Bitte wähle mindestens eine Kategorie.';
      return false;
    }
    
    // Ensure all category IDs are valid numbers
    const validCategoryIds = form.value.categories.filter(id => typeof id === 'number' && id > 0);
    if (validCategoryIds.length === 0) 
    {
      localError.value = 'Ungültige Kategorien ausgewählt. Bitte versuche es erneut.';
      return false;
    }
    
    // Create a clean form data object with valid category IDs
    const formData: LaunchPointFormData = {
      ...form.value,
      categories: validCategoryIds
    };
    
    console.log('Submitting form with categories:', formData.categories);
    
    let success: boolean | number | null;
    
    if (isEdit.value) 
    {
      success = await launchPointsStore.updateLaunchPoint(pointId.value, formData);
    }
    else 
    {
      success = await launchPointsStore.createLaunchPoint(formData);
    }
    
    if (success) 
    {
      // Preserve zoom and center from current view when navigating back to map
      const currentZoom = zoom.value;
      const [currentLat, currentLng] = mapCenter.value;
      router.push({
        path: '/map',
        query: {
          centerLat: currentLat.toFixed(6),
          centerLng: currentLng.toFixed(6),
          zoom: currentZoom.toString()
        }
      });
      return true;
    }
    return false;
  }

  /** Navigates back to previous page */
  function goBack(): void 
  {
    router.back();
  }

  /** Loads existing launch point data when in edit mode */
  async function loadExistingPoint(): Promise<void> 
  {
    if (isEdit.value) 
    {
      const point = await launchPointsStore.fetchLaunchPoint(pointId.value);
      if (point) 
      {
        form.value = {
          name: point.name,
          latitude: point.latitude,
          longitude: point.longitude,
          hints: point.hints || '',
          opening_hours: point.opening_hours || '24h',
          parking_options: point.parking_options || '',
          nearby_waters: point.nearby_waters || '',
          food_supply: point.food_supply || '',
          categories: point.category_ids ? [...point.category_ids] : [],
          public_transport_stations: [...point.public_transport_stations]
        };
        markerPosition.value = [point.latitude, point.longitude];
        mapCenter.value = [point.latitude, point.longitude];
        zoom.value = 14;
      }
    }
  }

  // Marker-Position mit Formular synchronisieren
  watch(markerPosition, ([lat, lng]) => 
  {
    form.value.latitude = lat;
    form.value.longitude = lng;
  });

  // Expose only necessary store state (encapsulation)
  const loading = computed(() => launchPointsStore.loading);
  const storeError = computed(() => launchPointsStore.error);

  return {
    // State
    form,
    markerPosition,
    mapCenter,
    zoom,
    newStation,
    localError,
    isEdit,
    pointId,
    loading,
    storeError,
    
    // Actions
    toggleCategory,
    handleMapClick,
    addStation,
    removeStation,
    handleSubmit,
    goBack,
    loadExistingPoint
  };
}

