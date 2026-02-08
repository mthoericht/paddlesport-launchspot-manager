/**
 * Zentralisierte Mock-Daten für Storybook
 */

import type { PublicTransportPoint } from '../frontend/src/types';
import type { NearbyStation, NearbyLaunchpoint } from '../frontend/src/composables';

export const mockLaunchPoint = {
  id: 1,
  name: 'Tegeler See Nord',
  latitude: 52.57,
  longitude: 13.26,
  is_official: true,
  hints: 'Ruhiger Einstieg, Parkplätze vorhanden.',
  opening_hours: '24/7',
  parking_options: 'Kostenlose Parkplätze',
  nearby_waters: 'Tegeler See',
  food_supply: null,
  created_by: 1,
  creator_username: 'admin',
  created_at: '2024-01-15T10:00:00Z',
  categories: ['Kajak', 'SUP'],
  category_ids: [1, 2],
  public_transport_stations: []
};

export const mockCategories = [
  { id: 1, name_en: 'kajak', name_de: 'Kajak' },
  { id: 2, name_en: 'sup', name_de: 'SUP' },
  { id: 3, name_en: 'swimming', name_de: 'Schwimmen' },
  { id: 4, name_en: 'relax', name_de: 'Entspannen' }
];

export const mockPublicTransportStation: PublicTransportPoint = {
  id: 101,
  name: 'Tegel S-Bahn',
  latitude: 52.58,
  longitude: 13.27,
  lines: 'S25, U6',
  types: ['sbahn', 'ubahn']
};

export const mockNearbyStations: NearbyStation[] = [
  {
    ...mockPublicTransportStation,
    distanceMeters: 450
  },
  {
    id: 102,
    name: 'Tegel Bus',
    latitude: 52.57,
    longitude: 13.25,
    lines: 'M20',
    types: ['tram'],
    distanceMeters: 820
  }
];

export const mockNearbyLaunchpoints: NearbyLaunchpoint[] = [
  {
    ...mockLaunchPoint,
    distanceMeters: 450
  },
  {
    id: 2,
    name: 'Kleine Havel Einfahrt',
    latitude: 52.56,
    longitude: 13.25,
    is_official: false,
    hints: null,
    opening_hours: 'Tageslicht',
    parking_options: null,
    nearby_waters: null,
    food_supply: null,
    created_by: 2,
    creator_username: 'paddler',
    created_at: '2024-02-01T14:30:00Z',
    categories: ['Kajak'],
    category_ids: [1],
    public_transport_stations: [],
    distanceMeters: 1200
  }
];
