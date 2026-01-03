import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all launch points with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { filter, username, categories } = req.query;
    
    // Build where clause
    const where: any = {};

    if (filter === 'mine') {
      where.createdById = req.user!.id;
    } else if (filter === 'official') {
      where.isOfficial = true;
    } else if (filter === 'user' && username) {
      where.createdBy = { username: username as string };
    }

    if (categories) {
      const categoryList = (categories as string).split(',');
      where.categories = {
        some: {
          category: { in: categoryList }
        }
      };
    }

    const launchPoints = await prisma.launchPoint.findMany({
      where,
      include: {
        createdBy: {
          select: { username: true }
        },
        categories: {
          select: { category: true }
        },
        stations: {
          select: { id: true, name: true, distanceMeters: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to expected format
    const result = launchPoints.map(lp => ({
      id: lp.id,
      name: lp.name,
      latitude: lp.latitude,
      longitude: lp.longitude,
      is_official: lp.isOfficial,
      hints: lp.hints,
      opening_hours: lp.openingHours,
      parking_options: lp.parkingOptions,
      nearby_waters: lp.nearbyWaters,
      food_supply: lp.foodSupply,
      created_by: lp.createdById,
      creator_username: lp.createdBy.username,
      created_at: lp.createdAt.toISOString(),
      categories: lp.categories.map(c => c.category),
      public_transport_stations: lp.stations.map(s => ({
        id: s.id,
        name: s.name,
        distance_meters: s.distanceMeters
      }))
    }));

    res.json(result);
  } catch (error) {
    console.error('Get launch points error:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Einsetzpunkte.' });
  }
});

// Get single launch point
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const launchPoint = await prisma.launchPoint.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { username: true }
        },
        categories: {
          select: { category: true }
        },
        stations: {
          select: { id: true, name: true, distanceMeters: true }
        }
      }
    });

    if (!launchPoint) {
      return res.status(404).json({ error: 'Einsetzpunkt nicht gefunden.' });
    }

    res.json({
      id: launchPoint.id,
      name: launchPoint.name,
      latitude: launchPoint.latitude,
      longitude: launchPoint.longitude,
      is_official: launchPoint.isOfficial,
      hints: launchPoint.hints,
      opening_hours: launchPoint.openingHours,
      parking_options: launchPoint.parkingOptions,
      nearby_waters: launchPoint.nearbyWaters,
      food_supply: launchPoint.foodSupply,
      created_by: launchPoint.createdById,
      creator_username: launchPoint.createdBy.username,
      created_at: launchPoint.createdAt.toISOString(),
      categories: launchPoint.categories.map(c => c.category),
      public_transport_stations: launchPoint.stations.map(s => ({
        id: s.id,
        name: s.name,
        distance_meters: s.distanceMeters
      }))
    });
  } catch (error) {
    console.error('Get launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Einsetzpunktes.' });
  }
});

// Create launch point
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      latitude,
      longitude,
      hints,
      opening_hours,
      parking_options,
      nearby_waters,
      food_supply,
      categories,
      public_transport_stations
    } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Name und Koordinaten sind erforderlich.' });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({ error: 'Mindestens eine Kategorie ist erforderlich.' });
    }

    const launchPoint = await prisma.launchPoint.create({
      data: {
        name,
        latitude,
        longitude,
        hints: hints || null,
        openingHours: opening_hours || '24h',
        parkingOptions: parking_options || null,
        nearbyWaters: nearby_waters || null,
        foodSupply: food_supply || null,
        createdById: req.user!.id,
        categories: {
          create: categories.map((cat: string) => ({ category: cat }))
        },
        stations: {
          create: (public_transport_stations || []).slice(0, 5).map((s: any) => ({
            name: s.name,
            distanceMeters: s.distance_meters
          }))
        }
      }
    });

    res.status(201).json({ 
      message: 'Einsetzpunkt erstellt.',
      id: launchPoint.id
    });
  } catch (error) {
    console.error('Create launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Erstellen des Einsetzpunktes.' });
  }
});

// Update launch point
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      latitude,
      longitude,
      hints,
      opening_hours,
      parking_options,
      nearby_waters,
      food_supply,
      categories,
      public_transport_stations
    } = req.body;

    // Check if launch point exists and user has permission
    const launchPoint = await prisma.launchPoint.findUnique({
      where: { id },
      select: { createdById: true }
    });
    
    if (!launchPoint) {
      return res.status(404).json({ error: 'Einsetzpunkt nicht gefunden.' });
    }

    if (launchPoint.createdById !== req.user!.id && !req.user!.is_admin) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten.' });
    }

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Update main data
      await tx.launchPoint.update({
        where: { id },
        data: {
          name,
          latitude,
          longitude,
          hints: hints || null,
          openingHours: opening_hours || '24h',
          parkingOptions: parking_options || null,
          nearbyWaters: nearby_waters || null,
          foodSupply: food_supply || null
        }
      });

      // Update categories
      if (categories) {
        await tx.launchPointCategory.deleteMany({ where: { launchPointId: id } });
        await tx.launchPointCategory.createMany({
          data: categories.map((cat: string) => ({ launchPointId: id, category: cat }))
        });
      }

      // Update stations
      if (public_transport_stations) {
        await tx.publicTransportStation.deleteMany({ where: { launchPointId: id } });
        await tx.publicTransportStation.createMany({
          data: public_transport_stations.slice(0, 5).map((s: any) => ({
            launchPointId: id,
            name: s.name,
            distanceMeters: s.distance_meters
          }))
        });
      }
    });

    res.json({ message: 'Einsetzpunkt aktualisiert.' });
  } catch (error) {
    console.error('Update launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren des Einsetzpunktes.' });
  }
});

// Delete launch point
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    // Check if launch point exists and user has permission
    const launchPoint = await prisma.launchPoint.findUnique({
      where: { id },
      select: { createdById: true }
    });
    
    if (!launchPoint) {
      return res.status(404).json({ error: 'Einsetzpunkt nicht gefunden.' });
    }

    if (launchPoint.createdById !== req.user!.id && !req.user!.is_admin) {
      return res.status(403).json({ error: 'Keine Berechtigung zum Löschen.' });
    }

    await prisma.launchPoint.delete({ where: { id } });

    res.json({ message: 'Einsetzpunkt gelöscht.' });
  } catch (error) {
    console.error('Delete launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen des Einsetzpunktes.' });
  }
});

export default router;
