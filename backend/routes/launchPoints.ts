import { Router, Response } from 'express';
import prisma from '../prisma.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import type { Prisma } from '@prisma/client';
import type {
  PointData,
  CategoryData,
  StationData,
  LaunchPointWithRelations,
  LaunchPointCreateData,
  LaunchPointDelegate
} from '../types/point.js';

const router = Router();

type LaunchPointWhereInput = Prisma.LaunchPointWhereInput;

type PublicTransportStationInput = {
  name: string;
  distance_meters: number;
};

type TransactionClient = Omit<Prisma.TransactionClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'> & {
  point: {
    update: (args: { where: { id: number }; data: { name: string; latitude: number; longitude: number } }) => Promise<PointData>;
  };
  launchPoint: LaunchPointDelegate;
};

// Get all launch points with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => 
{
  try 
  {
    const { filter, username, categories } = req.query;
    
    // Build where clause
    const where: LaunchPointWhereInput = {};

    if (filter === 'mine') 
    {
      where.createdById = req.user!.id;
    }
    else if (filter === 'official') 
    {
      where.isOfficial = true;
    }
    else if (filter === 'user' && username) 
    {
      where.createdBy = { username: username as string };
    }

    if (categories) 
    {
      const categoryIds = (categories as string).split(',').map(id => parseInt(id));
      where.categories = {
        some: {
          categoryId: { in: categoryIds }
        }
      };
    }

    const launchPoints: LaunchPointWithRelations[] = await prisma.launchPoint.findMany({
      where,
      include: {
        point: true,
        createdBy: {
          select: { username: true }
        },
        categories: {
          include: {
            category: {
              select: { id: true, name_en: true, name_de: true }
            }
          }
        },
        stations: {
          select: { id: true, name: true, distanceMeters: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform to expected format
    const result = launchPoints.map((lp) => ({
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
      public_transport_stations: lp.stations.map((s) => ({
        id: s.id,
        name: s.name,
        distance_meters: s.distanceMeters
      }))
    }));

    res.json(result);
  }
  catch (error) 
  {
    console.error('Get launch points error:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Einsetzpunkte.' });
  }
});

// Get all unique categories (must be before /:id route)
router.get('/categories', authenticateToken, async (req: AuthRequest, res: Response) => 
{
  try 
  {
    const categories = await prisma.category.findMany({
      orderBy: { name_de: 'asc' }
    });

    const categoryList = categories.map(c => ({
      id: c.id,
      name_en: c.name_en,
      name_de: c.name_de
    }));
    res.json(categoryList);
  }
  catch (error) 
  {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen der Kategorien.' });
  }
});

// Get single launch point
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => 
{
  try 
  {
    const id = parseInt(req.params.id);
    
    const launchPoint: LaunchPointWithRelations | null = await prisma.launchPoint.findUnique({
      where: { id },
      include: {
        point: true,
        createdBy: {
          select: { username: true }
        },
        categories: {
          include: {
            category: {
              select: { id: true, name_en: true, name_de: true }
            }
          }
        },
        stations: {
          select: { id: true, name: true, distanceMeters: true }
        }
      }
    });

    if (!launchPoint) 
    {
      return res.status(404).json({ error: 'Einsetzpunkt nicht gefunden.' });
    }

    res.json({
      id: launchPoint.id,
      name: launchPoint.point.name,
      latitude: launchPoint.point.latitude,
      longitude: launchPoint.point.longitude,
      is_official: launchPoint.isOfficial,
      hints: launchPoint.hints,
      opening_hours: launchPoint.openingHours,
      parking_options: launchPoint.parkingOptions,
      nearby_waters: launchPoint.nearbyWaters,
      food_supply: launchPoint.foodSupply,
      created_by: launchPoint.createdById,
      creator_username: launchPoint.createdBy.username,
      created_at: launchPoint.createdAt.toISOString(),
      categories: launchPoint.categories.map((c) => c.category.name_de),
      category_ids: launchPoint.categories.map((c) => c.categoryId),
      public_transport_stations: launchPoint.stations.map((s) => ({
        id: s.id,
        name: s.name,
        distance_meters: s.distanceMeters
      }))
    });
  }
  catch (error) 
  {
    console.error('Get launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Abrufen des Einsetzpunktes.' });
  }
});

// Create launch point
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => 
{
  try 
  {
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

    console.log('Create launch point request:', {
      name,
      latitude,
      longitude,
      categories,
      categoriesType: typeof categories,
      categoriesIsArray: Array.isArray(categories)
    });

    if (!name || latitude === undefined || longitude === undefined) 
    {
      return res.status(400).json({ error: 'Name und Koordinaten sind erforderlich.' });
    }

    if (!categories || categories.length === 0) 
    {
      return res.status(400).json({ error: 'Mindestens eine Kategorie ist erforderlich.' });
    }

    // Verify user exists before creating launch point
    const userId = req.user!.id;
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!userExists) 
    {
      console.error(`User with id ${userId} does not exist in database`);
      return res.status(400).json({ error: 'Benutzer nicht gefunden.' });
    }

    // Retry launch point creation to handle timeouts and foreign key constraints
    let launchPoint;
    let retries = 3;
    while (retries > 0)
    {
      try
      {
        // Re-check user exists right before creating (might have been deleted)
        const userCheck = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true }
        });
        
        if (!userCheck)
        {
          console.error(`User with id ${userId} does not exist in database (checked before create)`);
          return res.status(400).json({ error: 'Benutzer nicht gefunden.' });
        }
        
        // Validate category IDs exist
        const categoryIds = Array.isArray(categories) ? categories : [categories];
        
        // Filter out any invalid values and convert to numbers
        const validCategoryIds: number[] = [];
        for (const id of categoryIds) 
        {
          const parsed = typeof id === 'number' ? id : parseInt(String(id), 10);
          if (!isNaN(parsed) && parsed > 0) 
          {
            validCategoryIds.push(parsed);
          }
        }
        
        if (validCategoryIds.length === 0) 
        {
          console.error('No valid category IDs provided:', categoryIds);
          return res.status(400).json({ 
            error: 'Ungültige Kategorie-IDs. Bitte wähle mindestens eine gültige Kategorie.' 
          });
        }
        
        console.log('Validating category IDs:', validCategoryIds);
        
        const existingCategories = await prisma.category.findMany({
          where: { id: { in: validCategoryIds } }
        });

        console.log('Found categories:', existingCategories.map(c => ({ id: c.id, name: c.name_de })));

        if (existingCategories.length !== validCategoryIds.length) 
        {
          const missingIds = validCategoryIds.filter(id => !existingCategories.some(c => c.id === id));
          console.error('Invalid category IDs:', missingIds, 'Valid IDs in DB:', existingCategories.map(c => c.id));
          return res.status(400).json({ 
            error: 'Eine oder mehrere Kategorien sind ungültig.',
            details: `Fehlende Kategorie-IDs: ${missingIds.join(', ')}`
          });
        }

        // Create LaunchPoint with nested Point creation
        launchPoint = await prisma.launchPoint.create({
          data: {
            point: {
              create: {
                name,
                latitude,
                longitude
              }
            },
            hints: hints || null,
            openingHours: opening_hours || '24h',
            parkingOptions: parking_options || null,
            nearbyWaters: nearby_waters || null,
            foodSupply: food_supply || null,
            createdBy: {
              connect: { id: userId }
            },
            categories: {
              create: validCategoryIds.map((categoryId: number) => ({ categoryId }))
            },
            stations: {
              create: ((public_transport_stations as PublicTransportStationInput[]) || []).slice(0, 5).map((s) => ({
                name: s.name,
                distanceMeters: s.distance_meters
              }))
            }
          }
        });
        break; // Success, exit retry loop
      }
      catch (error: unknown)
      {
        retries--;
        const prismaError = error as { message?: string; code?: string };
        const isTimeout = prismaError?.message?.includes('timeout') || prismaError?.code === 'P1008';
        const isForeignKeyError = prismaError?.code === 'P2003' || prismaError?.message?.includes('Foreign key constraint');
        
        if (retries === 0 || (!isTimeout && !isForeignKeyError))
        {
          throw error; // Re-throw if not a retryable error or no retries left
        }
        
        // For foreign key errors, re-check user and potentially return early
        if (isForeignKeyError)
        {
          const userCheck = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
          });
          
          if (!userCheck)
          {
            console.error(`User with id ${userId} does not exist (foreign key constraint error)`);
            return res.status(400).json({ error: 'Benutzer nicht gefunden.' });
          }
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 200 * (4 - retries)));
      }
    }

    if (!launchPoint)
    {
      throw new Error('Failed to create launch point after retries');
    }

    res.status(201).json({ 
      message: 'Einsetzpunkt erstellt.',
      id: launchPoint.id
    });
  }
  catch (error) 
  {
    console.error('Create launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Erstellen des Einsetzpunktes.' });
  }
});

// Update launch point
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => 
{
  try 
  {
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
    
    if (!launchPoint) 
    {
      return res.status(404).json({ error: 'Einsetzpunkt nicht gefunden.' });
    }

    if (launchPoint.createdById !== req.user!.id && !req.user!.is_admin) 
    {
      return res.status(403).json({ error: 'Keine Berechtigung zum Bearbeiten.' });
    }

    // Get the launch point to access its point relation
    const existingLaunchPoint: LaunchPointWithRelations | null = await prisma.launchPoint.findUnique({
      where: { id },
      include: { point: true }
    });

    if (!existingLaunchPoint) 
    {
      return res.status(404).json({ error: 'Einsetzpunkt nicht gefunden.' });
    }

    // Update in transaction with timeout
    await prisma.$transaction(async (tx) => 
    {
      // Update Point data
      await (tx as TransactionClient).point.update({
        where: { id: existingLaunchPoint.point.id },
        data: {
          name,
          latitude,
          longitude
        }
      });

      // Update LaunchPoint data
      await tx.launchPoint.update({
        where: { id },
        data: {
          hints: hints || null,
          openingHours: opening_hours || '24h',
          parkingOptions: parking_options || null,
          nearbyWaters: nearby_waters || null,
          foodSupply: food_supply || null
        }
      });

      // Update categories
      if (categories) 
      {
        const categoryIds = Array.isArray(categories) ? categories : [categories];
        const validCategoryIds = categoryIds.map((id: string | number) => typeof id === 'number' ? id : parseInt(String(id), 10));
        
        // Validate category IDs exist
        const existingCategories = await tx.category.findMany({
          where: { id: { in: validCategoryIds } }
        });

        if (existingCategories.length !== validCategoryIds.length) 
        {
          throw new Error('Eine oder mehrere Kategorien sind ungültig.');
        }

        await tx.launchPointCategory.deleteMany({ where: { launchPointId: id } });
        await tx.launchPointCategory.createMany({
          data: validCategoryIds.map((categoryId: number) => ({ launchPointId: id, categoryId }))
        });
      }

      // Update stations
      if (public_transport_stations) 
      {
        await tx.publicTransportStation.deleteMany({ where: { launchPointId: id } });
        await tx.publicTransportStation.createMany({
          data: (public_transport_stations as PublicTransportStationInput[]).slice(0, 5).map((s) => ({
            launchPointId: id,
            name: s.name,
            distanceMeters: s.distance_meters
          }))
        });
      }
    });

    res.json({ message: 'Einsetzpunkt aktualisiert.' });
  }
  catch (error) 
  {
    console.error('Update launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Aktualisieren des Einsetzpunktes.' });
  }
});

// Delete launch point
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => 
{
  try 
  {
    const id = parseInt(req.params.id);

    // Check if launch point exists and user has permission
    const launchPoint = await prisma.launchPoint.findUnique({
      where: { id },
      select: { createdById: true }
    });
    
    if (!launchPoint) 
    {
      return res.status(404).json({ error: 'Einsetzpunkt nicht gefunden.' });
    }

    if (launchPoint.createdById !== req.user!.id && !req.user!.is_admin) 
    {
      return res.status(403).json({ error: 'Keine Berechtigung zum Löschen.' });
    }

    // Get point relation before deleting
    const launchPointWithPoint: LaunchPointWithRelations | null = await prisma.launchPoint.findUnique({
      where: { id },
      include: { point: true }
    });

    // Delete launch point (this will cascade delete related categories and stations)
    await prisma.launchPoint.delete({ where: { id } });

    // Delete the associated point if it exists
    if (launchPointWithPoint?.point) 
    {
      await prisma.point.delete({ where: { id: launchPointWithPoint.point.id } })
        .catch(() =>
        {
          // Point might already be deleted or not exist, ignore error
        });
    }

    res.json({ message: 'Einsetzpunkt gelöscht.' });
  }
  catch (error) 
  {
    console.error('Delete launch point error:', error);
    res.status(500).json({ error: 'Serverfehler beim Löschen des Einsetzpunktes.' });
  }
});

export default router;
