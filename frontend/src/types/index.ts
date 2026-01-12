export interface User {
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
}

export interface PublicTransportStation {
  id?: number;
  name: string;
  distance_meters: number;
}

export type Category = string;

export interface CategoryInfo {
  id: number;
  name_en: string;
  name_de: string;
}

/**
 * Base interface for all point types (location data)
 * This represents the common location properties shared by all point types
 */
export interface Point {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * LaunchPoint extends Point with launch-specific properties
 */
export interface LaunchPoint extends Point {
  is_official: boolean;
  hints: string | null;
  opening_hours: string;
  parking_options: string | null;
  nearby_waters: string | null;
  food_supply: string | null;
  categories: Category[];
  category_ids?: number[];
  public_transport_stations: PublicTransportStation[];
  created_by: number;
  creator_username: string;
  created_at: string;
}

export interface LaunchPointFormData {
  name: string;
  latitude: number;
  longitude: number;
  hints: string;
  opening_hours: string;
  parking_options: string;
  nearby_waters: string;
  food_supply: string;
  categories: number[];
  public_transport_stations: PublicTransportStation[];
}

export type FilterType = 'all' | 'mine' | 'official' | 'user';

export interface FilterState {
  type: FilterType;
  username?: string;
  categories: number[];
}

export type PublicTransportType = 'train' | 'tram' | 'sbahn' | 'ubahn';

/**
 * PublicTransportPoint extends Point with transport-specific properties
 */
export interface PublicTransportPoint extends Point {
  lines: string;
  types: PublicTransportType[];
}

