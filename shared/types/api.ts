/**
 * Shared API Types
 * 
 * These types define the contract between Frontend and Backend.
 * All API responses should conform to these types.
 * 
 * Naming convention: snake_case for JSON field names (API standard)
 */

// ============================================================================
// Base Types
// ============================================================================

/**
 * User information returned by the API
 */
export interface User 
{
  id: number;
  email: string;
  username: string;
  is_admin: boolean;
}

/**
 * Category information
 */
export interface CategoryInfo 
{
  id: number;
  name_en: string;
  name_de: string;
}

// ============================================================================
// Public Transport Types
// ============================================================================

export type PublicTransportType = 'train' | 'tram' | 'sbahn' | 'ubahn';

/**
 * Public transport station associated with a launch point
 */
export interface PublicTransportStation 
{
  id?: number;
  name: string;
  distance_meters: number;
}

/**
 * Public transport point on the map
 */
export interface PublicTransportPoint 
{
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  lines: string;
  types: PublicTransportType[];
}

// ============================================================================
// Launch Point Types
// ============================================================================

/**
 * Launch point returned by GET /api/launch-points and GET /api/launch-points/:id
 */
export interface LaunchPoint 
{
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  is_official: boolean;
  hints: string | null;
  opening_hours: string;
  parking_options: string | null;
  nearby_waters: string | null;
  food_supply: string | null;
  created_by: number;
  creator_username: string;
  created_at: string;
  categories: string[];
  category_ids: number[];
  public_transport_stations: PublicTransportStation[];
}

/**
 * Request body for POST /api/launch-points
 */
export interface CreateLaunchPointRequest 
{
  name: string;
  latitude: number;
  longitude: number;
  hints?: string;
  opening_hours?: string;
  parking_options?: string;
  nearby_waters?: string;
  food_supply?: string;
  categories: number[];
  public_transport_stations?: PublicTransportStation[];
}

/**
 * Request body for PUT /api/launch-points/:id
 */
export interface UpdateLaunchPointRequest 
{
  name: string;
  latitude: number;
  longitude: number;
  hints?: string;
  opening_hours?: string;
  parking_options?: string;
  nearby_waters?: string;
  food_supply?: string;
  categories: number[];
  public_transport_stations?: PublicTransportStation[];
}

/**
 * Response for POST /api/launch-points (create)
 */
export interface CreateLaunchPointResponse 
{
  message: string;
  id: number;
}

/**
 * Response for PUT /api/launch-points/:id and DELETE /api/launch-points/:id
 */
export interface MessageResponse 
{
  message: string;
}

/**
 * Error response
 */
export interface ErrorResponse 
{
  error: string;
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterType = 'all' | 'mine' | 'official' | 'user';

export interface FilterState 
{
  type: FilterType;
  username?: string;
  categories: number[];
}
