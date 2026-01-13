/**
 * Mapper functions for transforming Prisma models to API DTOs
 */

import type { LaunchPointWithRelations } from '../types/point.js';
import type { LaunchPoint, PublicTransportStation, CategoryInfo } from '../../shared/types/api.js';

/**
 * Maps a Prisma LaunchPointWithRelations to a LaunchPoint
 */
export function toLaunchPointDto(lp: LaunchPointWithRelations): LaunchPoint 
{
  return {
    id: lp.id,
    name: lp.point.name,
    latitude: lp.point.latitude,
    longitude: lp.point.longitude,
    is_official: lp.isOfficial,
    hints: lp.hints,
    opening_hours: lp.openingHours,
    parking_options: lp.parkingOptions,
    nearby_waters: lp.nearbyWaters,
    food_supply: lp.foodSupply,
    created_by: lp.createdById,
    creator_username: lp.createdBy.username,
    created_at: lp.createdAt.toISOString(),
    categories: lp.categories.map((c) => c.category.name_de),
    category_ids: lp.categories.map((c) => c.categoryId),
    public_transport_stations: lp.stations.map(toPublicTransportStationDto)
  };
}

/**
 * Maps a Prisma station to a PublicTransportStation
 */
export function toPublicTransportStationDto(station: { id: number; name: string; distanceMeters: number }): PublicTransportStation 
{
  return {
    id: station.id,
    name: station.name,
    distance_meters: station.distanceMeters
  };
}

/**
 * Maps a Prisma category to a CategoryInfo
 */
export function toCategoryDto(category: { id: number; name_en: string; name_de: string }): CategoryInfo 
{
  return {
    id: category.id,
    name_en: category.name_en,
    name_de: category.name_de
  };
}

/**
 * Maps multiple LaunchPointWithRelations to LaunchPoint[]
 */
export function toLaunchPointDtoList(launchPoints: LaunchPointWithRelations[]): LaunchPoint[] 
{
  return launchPoints.map(toLaunchPointDto);
}
