import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLaunchPointsStore } from '../stores/launchPoints';
import type { Category, LaunchPointFormData } from '../types';

type LatLngTuple = [number, number];

const DEFAULT_LAT = 51.1657;
const DEFAULT_LNG = 10.4515;
const DEFAULT_ZOOM = 6;

interface InitialValues {
  latitude: number;
  longitude: number;
  zoom: number;
  hasMarker: boolean;
}

function getInitialValuesFromQuery(query: any): InitialValues {
  const { lat, lng, centerLat, centerLng, zoom: queryZoom } = query;
  
  if (lat && lng) {
    // Rechtsklick/Kontextmenü: Position direkt setzen
    return {
      latitude: parseFloat(lat as string),
      longitude: parseFloat(lng as string),
      zoom: queryZoom ? parseInt(queryZoom as string) : 14,
      hasMarker: true
    };
  } else if (centerLat && centerLng) {
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

export function useLaunchPointForm() {
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

  function toggleCategory(cat: Category): void {
    const index = form.value.categories.indexOf(cat);
    if (index === -1) {
      form.value.categories.push(cat);
    } else {
      form.value.categories.splice(index, 1);
    }
  }

  function handleMapClick(e: any): void {
    const { lat, lng } = e.latlng;
    form.value.latitude = lat;
    form.value.longitude = lng;
    markerPosition.value = [lat, lng];
  }

  function addStation(): boolean {
    if (!newStation.value.name.trim() || !newStation.value.distance_meters || newStation.value.distance_meters <= 0) {
      return false;
    }
    if (form.value.public_transport_stations.length >= 5) {
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

  function removeStation(index: number): void {
    form.value.public_transport_stations.splice(index, 1);
  }

  async function handleSubmit(): Promise<boolean> {
    localError.value = '';
    
    if (!form.value.name.trim()) {
      localError.value = 'Bitte gib einen Namen ein.';
      return false;
    }
    
    if (form.value.categories.length === 0) {
      localError.value = 'Bitte wähle mindestens eine Kategorie.';
      return false;
    }
    
    let success: boolean | number | null;
    
    if (isEdit.value) {
      success = await launchPointsStore.updateLaunchPoint(pointId.value, form.value);
    } else {
      success = await launchPointsStore.createLaunchPoint(form.value);
    }
    
    if (success) {
      router.push('/map');
      return true;
    }
    return false;
  }

  function goBack(): void {
    router.back();
  }

  async function loadExistingPoint(): Promise<void> {
    if (isEdit.value) {
      const point = await launchPointsStore.fetchLaunchPoint(pointId.value);
      if (point) {
        form.value = {
          name: point.name,
          latitude: point.latitude,
          longitude: point.longitude,
          hints: point.hints || '',
          opening_hours: point.opening_hours || '24h',
          parking_options: point.parking_options || '',
          nearby_waters: point.nearby_waters || '',
          food_supply: point.food_supply || '',
          categories: [...point.categories],
          public_transport_stations: [...point.public_transport_stations]
        };
        markerPosition.value = [point.latitude, point.longitude];
        mapCenter.value = [point.latitude, point.longitude];
        zoom.value = 14;
      }
    }
  }

  // Marker-Position mit Formular synchronisieren
  watch(markerPosition, ([lat, lng]) => {
    form.value.latitude = lat;
    form.value.longitude = lng;
  });

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
    
    // Actions
    toggleCategory,
    handleMapClick,
    addStation,
    removeStation,
    handleSubmit,
    goBack,
    loadExistingPoint,
    
    // Store access
    launchPointsStore
  };
}

