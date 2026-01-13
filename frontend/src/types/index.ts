/**
 * Frontend Types
 * 
 * Re-exports shared API types and adds frontend-specific types
 */

// Re-export all shared API types
export type {
  User,
  CategoryInfo,
  PublicTransportStation,
  PublicTransportPoint,
  PublicTransportType,
  LaunchPoint,
  FilterType,
  FilterState
} from '../../../shared/types/api.js';

// Frontend-specific types (not part of the API contract)

/**
 * Category name as string
 */
export type Category = string;

/**
 * Form data for creating/updating a launch point
 * Uses the same field names as the API request
 */
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
  public_transport_stations: { name: string; distance_meters: number }[];
}
