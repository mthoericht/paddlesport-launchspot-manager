import prisma from '../../prisma.js';

/**
 * Retry helper for database operations
 * Handles SQLite locks and timeouts with exponential backoff
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 10,
  delay: number = 300
): Promise<T>
{
  let lastError: Error | unknown;
  
  for (let i = 0; i < maxRetries; i++)
  {
    try
    {
      return await operation();
    }
    catch (error)
    {
      lastError = error;
      
      // Check for timeout, lock, or Prisma errors that should be retried
      const isRetryableError = error instanceof Error && (
        error.message.includes('timeout') ||
        error.message.includes('locked') ||
        error.message.includes('Operation has timed out') ||
        error.message.includes('P1008') || // Prisma timeout error code
        error.message.includes('P2003') || // Foreign key constraint (might be temporary)
        error.message.includes('SocketTimeout') ||
        error.message.includes('Transaction already closed') ||
        (error as any)?.code === 'P1008' ||
        (error as any)?.code === 'P2003'
      );
      
      const shouldRetry = i < maxRetries - 1 && isRetryableError;
      
      if (shouldRetry)
      {
        // Exponential backoff with jitter (longer delays for SQLite)
        const backoffDelay = Math.min(
          delay * Math.pow(2, i) + Math.random() * 200,
          5000 // Max 5 seconds between retries
        );
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
      
      // If it's not a retryable error or we've exhausted retries, throw
      throw error;
    }
  }
  
  throw lastError;
}

/**
 * Cleanup helper: Deletes ONLY test data with TEST_ prefix
 * IMPORTANT: This function ONLY deletes data that starts with 'TEST_'
 * It will NEVER delete existing production data or data without the TEST_ prefix
 * Always runs cleanup, even if previous cleanup failed
 * Uses retries to handle SQLite locks
 */
export async function cleanupTestData(): Promise<void>
{
  // Wrap in try-catch to ensure we always attempt cleanup
  try
  {
    // Small delay to let any active transactions/operations complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Step 1: Find ONLY TEST_ users (with retry)
    // Safety: We explicitly filter by TEST_ prefix to ensure we never touch existing data
    const testUsers = await retryOperation(async () => 
    {
      return await prisma.user.findMany({
        where: {
          OR: [
            { email: { startsWith: 'TEST_' } },
            { username: { startsWith: 'TEST_' } }
          ]
        },
        select: { id: true, email: true, username: true }
      });
    });
    
    // Additional safety check: Verify all found users actually have TEST_ prefix
    const verifiedTestUsers = testUsers.filter(user => 
      (user.email && user.email.startsWith('TEST_')) ||
      (user.username && user.username.startsWith('TEST_'))
    );
    
    if (verifiedTestUsers.length !== testUsers.length)
    {
      console.warn('Warning: Some users found did not match TEST_ prefix filter. Skipping cleanup for safety.');
      return;
    }

    const userIds = verifiedTestUsers.map(u => u.id);

    if (userIds.length > 0)
    {
      // Step 2: Find all launch points created by TEST_ users
      const testLaunchPoints = await retryOperation(async () => 
      {
        return await prisma.launchPoint.findMany({
          where: {
            createdById: {
              in: userIds
            }
          },
          select: { id: true }
        });
      });

      const launchPointIds = testLaunchPoints.map(lp => lp.id);

      // Step 3: Delete related data (stations and categories) - sequential to avoid locks
      if (launchPointIds.length > 0)
      {
        await retryOperation(async () => 
        {
          await prisma.publicTransportStation.deleteMany({
            where: {
              launchPointId: {
                in: launchPointIds
              }
            }
          });
        });
        
        // Small delay between operations to reduce lock contention
        await new Promise(resolve => setTimeout(resolve, 50));
        
        await retryOperation(async () => 
        {
          await prisma.launchPointCategory.deleteMany({
            where: {
              launchPointId: {
                in: launchPointIds
              }
            }
          });
        });
        
        // Small delay before deleting launch points
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Step 4: Delete launch points
      if (launchPointIds.length > 0)
      {
        await retryOperation(async () => 
        {
          await prisma.launchPoint.deleteMany({
            where: {
              id: {
                in: launchPointIds
              }
            }
          });
        });
        
        // Small delay before deleting users
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Step 5: Delete users
      if (userIds.length > 0)
      {
        await retryOperation(async () => 
        {
          await prisma.user.deleteMany({
            where: {
              id: {
                in: userIds
              }
            }
          });
        });
      }
    }

    // Step 6: Also clean up any orphaned TEST_ launch points (safety net)
    // Safety: Only delete launch points with TEST_ prefix in point name
    const orphanedPoints = await retryOperation(async () => 
    {
      return await prisma.launchPoint.findMany({
        where: {
          point: {
            name: {
              startsWith: 'TEST_'
            }
          }
        },
        include: {
          point: {
            select: { id: true, name: true }
          }
        }
      });
    });
    
    // Additional safety check: Verify all found points actually have TEST_ prefix
    const verifiedOrphanedPoints = orphanedPoints.filter(lp => 
      lp.point && lp.point.name && lp.point.name.startsWith('TEST_')
    );
    
    if (verifiedOrphanedPoints.length !== orphanedPoints.length)
    {
      console.warn('Warning: Some launch points found did not match TEST_ prefix filter. Skipping cleanup for safety.');
      // Continue with public transport cleanup instead of returning
    }

    if (verifiedOrphanedPoints.length > 0)
    {
      const orphanedIds = verifiedOrphanedPoints.map(lp => lp.id);
      
      await retryOperation(async () => 
      {
        await prisma.publicTransportStation.deleteMany({
          where: {
            launchPointId: {
              in: orphanedIds
            }
          }
        });
      });
      
      // Small delay between operations to reduce lock contention
      await new Promise(resolve => setTimeout(resolve, 50));
      
      await retryOperation(async () => 
      {
        await prisma.launchPointCategory.deleteMany({
          where: {
            launchPointId: {
              in: orphanedIds
            }
          }
        });
      });
      
      // Small delay before deleting launch points
      await new Promise(resolve => setTimeout(resolve, 50));

      await retryOperation(async () => 
      {
        await prisma.launchPoint.deleteMany({
          where: {
            id: {
              in: orphanedIds
            }
          }
        });
      });
    }

    // Step 7: Clean up TEST_ public transport points
    const testPublicTransportPoints = await retryOperation(async () => 
    {
      return await prisma.publicTransportPoint.findMany({
        where: {
          point: {
            name: {
              startsWith: 'TEST_'
            }
          }
        },
        include: {
          point: {
            select: { id: true, name: true }
          }
        }
      });
    });

    // Additional safety check: Verify all found points actually have TEST_ prefix
    const verifiedTestPTPs = testPublicTransportPoints.filter(ptp => 
      ptp.point && ptp.point.name && ptp.point.name.startsWith('TEST_')
    );

    if (verifiedTestPTPs.length !== testPublicTransportPoints.length)
    {
      console.warn('Warning: Some public transport points found did not match TEST_ prefix filter. Skipping cleanup for safety.');
      return;
    }

    if (verifiedTestPTPs.length > 0)
    {
      const ptpIds = verifiedTestPTPs.map(ptp => ptp.id);
      const pointIds = verifiedTestPTPs.map(ptp => ptp.pointId);

      // Delete types first
      await retryOperation(async () => 
      {
        await prisma.publicTransportPointType.deleteMany({
          where: {
            publicTransportPointId: {
              in: ptpIds
            }
          }
        });
      });

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 50));

      // Delete public transport points
      await retryOperation(async () => 
      {
        await prisma.publicTransportPoint.deleteMany({
          where: {
            id: {
              in: ptpIds
            }
          }
        });
      });

      // Small delay before deleting points
      await new Promise(resolve => setTimeout(resolve, 50));

      // Delete associated points
      await retryOperation(async () => 
      {
        await prisma.point.deleteMany({
          where: {
            id: {
              in: pointIds
            }
          }
        });
      });
    }
  }
  catch (error)
  {
    // Log but don't throw - we want tests to continue
    // Only log if it's not a timeout (those are expected during parallel operations)
    if (!(error instanceof Error && error.message.includes('timeout')))
    {
      console.warn('Test cleanup warning (usually safe to ignore):', error instanceof Error ? error.message : error);
    }
  }
}

/**
 * Creates a test user with TEST_ prefix
 */
export async function createTestUser(data?: {
  email?: string;
  username?: string;
  password?: string;
  isAdmin?: boolean;
})
{
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const email = data?.email || `TEST_${timestamp}_${random}@test.com`;
  const username = data?.username || `TEST_user_${timestamp}_${random}`;
  const password = data?.password || 'TEST_password123';

  // Hash password
  const bcrypt = await import('bcryptjs');
  const hashedPassword = await bcrypt.default.hash(password, 10);

  // Use retry for user creation to handle potential locks
  return await retryOperation(async () => 
  {
    return await prisma.user.create({
      data: {
        email: email.startsWith('TEST_') ? email : `TEST_${email}`,
        username: username.startsWith('TEST_') ? username : `TEST_${username}`,
        password: hashedPassword,
        isAdmin: data?.isAdmin || false
      }
    });
  });
}

/**
 * Creates a test launch point with TEST_ prefix
 */
export async function createTestLaunchPoint(data: {
  createdById: number;
  name?: string;
  latitude?: number;
  longitude?: number;
  categories?: (number | string)[];
})
{
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const name = data.name?.startsWith('TEST_') 
    ? data.name 
    : `TEST_${data.name || `Point_${timestamp}_${random}`}`;

  // Convert category names to IDs if needed
  let categoryIds: number[] = [];
  
  if (!data.categories || data.categories.length === 0) 
  {
    // Get default category ID (kajak) if no categories provided
    const defaultCategory = await prisma.category.findFirst({
      where: { name_en: 'kajak' }
    });
    categoryIds = defaultCategory ? [defaultCategory.id] : [];
  }
  else 
  {
    // Convert category names/IDs to IDs
    for (const cat of data.categories) 
    {
      if (typeof cat === 'number') 
      {
        categoryIds.push(cat);
      }
      else if (typeof cat === 'string') 
      {
        // Look up category by German name
        const category = await prisma.category.findFirst({
          where: { name_de: cat }
        });
        if (category) 
        {
          categoryIds.push(category.id);
        }
        else 
        {
          console.warn(`Category "${cat}" not found, skipping`);
        }
      }
    }
  }

  if (categoryIds.length === 0) 
  {
    throw new Error('No valid categories found. Make sure categories are seeded.');
  }

  // Use retry for launch point creation to handle potential locks
  const launchPoint = await retryOperation(async () => 
  {
    // Create Point first
    const point = await prisma.point.create({
      data: {
        name,
        latitude: data.latitude || 52.5200,
        longitude: data.longitude || 13.4050
      }
    });

    return await prisma.launchPoint.create({
      data: {
        pointId: point.id,
        createdById: data.createdById,
        categories: {
          create: categoryIds.map(categoryId => ({
            categoryId
          }))
        }
      },
      include: {
        point: true,
        categories: {
          include: {
            category: true
          }
        },
        createdBy: true
      }
    });
  });

  return launchPoint;
}

/**
 * Creates a test public transport point with TEST_ prefix
 */
export async function createTestPublicTransportPoint(data: {
  name?: string;
  latitude?: number;
  longitude?: number;
  types?: Array<'train' | 'tram' | 'sbahn' | 'ubahn'>;
  lines?: string;
})
{
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const name = data.name?.startsWith('TEST_') 
    ? data.name 
    : `TEST_${data.name || `Station_${timestamp}_${random}`}`;

  const types = data.types || ['sbahn'];
  const lines = data.lines ?? 'S1,S2';

  // Use retry for public transport point creation to handle potential locks
  const publicTransportPoint = await retryOperation(async () => 
  {
    // Create Point first
    const point = await prisma.point.create({
      data: {
        name,
        latitude: data.latitude || 52.5200,
        longitude: data.longitude || 13.4050
      }
    });

    // Create PublicTransportPoint
    const ptp = await prisma.publicTransportPoint.create({
      data: {
        pointId: point.id,
        lines,
        types: {
          create: types.map(type => ({
            type
          }))
        }
      },
      include: {
        point: true,
        types: true
      }
    });

    return ptp;
  });

  return publicTransportPoint;
}
