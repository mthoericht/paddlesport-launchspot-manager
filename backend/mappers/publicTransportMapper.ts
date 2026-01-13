/**
 * Mapper functions for transforming Prisma PublicTransportPoint models to API DTOs
 */

import type { PublicTransportPointWithRelations, PublicTransportPointTypeRelation } from '../types/point.js';
import type { PublicTransportPoint } from '../../shared/types/api.js';

/**
 * Maps a Prisma PublicTransportPointWithRelations to a PublicTransportPoint
 */
export function toPublicTransportPointDto(ptp: PublicTransportPointWithRelations): PublicTransportPoint 
{
  return {
    id: ptp.id,
    name: ptp.point.name,
    latitude: ptp.point.latitude,
    longitude: ptp.point.longitude,
    lines: ptp.lines || '',
    types: ptp.types.map((t: PublicTransportPointTypeRelation) => t.type)
  };
}

/**
 * Maps multiple PublicTransportPointWithRelations to PublicTransportPoint[]
 */
export function toPublicTransportPointDtoList(points: PublicTransportPointWithRelations[]): PublicTransportPoint[] 
{
  return points.map(toPublicTransportPointDto);
}
