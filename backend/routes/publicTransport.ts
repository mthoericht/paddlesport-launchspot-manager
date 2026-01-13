import { Router } from 'express';
import prisma from '../prisma.js';
import type { PublicTransportPointWithRelations } from '../types/point.js';
import { toPublicTransportPointDtoList } from '../mappers/index.js';

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

    // Transform to DTO format using mapper
    res.json(toPublicTransportPointDtoList(publicTransportPoints));
  }
  catch (error: unknown)
  {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error fetching public transport points:', errorMessage);
    res.status(500).json({ error: 'Failed to fetch public transport points' });
  }
});

export default router;
