import { Router } from 'express';
import prisma from '../prisma.js';
import type {
  PublicTransportPointWithRelations,
  PublicTransportPointTypeRelation
} from '../types/point.js';

const router = Router();

/**
 * GET /api/public-transport
 * Get all public transport points
 */
router.get('/', async (req, res) => 
{
  try
  {
    const publicTransportPoints: PublicTransportPointWithRelations[] = await prisma.publicTransportPoint.findMany({
      include: {
        point: true,
        types: true
      }
    });

    // Transform to API format (flatten point data)
    const result = publicTransportPoints.map(ptp => ({
      id: ptp.id,
      name: ptp.point.name,
      latitude: ptp.point.latitude,
      longitude: ptp.point.longitude,
      lines: ptp.lines || '',
      types: ptp.types.map((t: PublicTransportPointTypeRelation) => t.type)
    }));

    res.json(result);
  }
  catch (error: unknown)
  {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching public transport points:', errorMessage);
    res.status(500).json({ error: 'Failed to fetch public transport points' });
  }
});

export default router;
