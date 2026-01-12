import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

async function main() 
{
  console.log('💾 Backing up existing data...\n');

  try 
  {
    // Check if Point table exists (new schema) or if LaunchPoint has old columns
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Point'
    `;
    
    const hasPointTable = tables.length > 0;
    
    // Check LaunchPoint columns
    const launchPointColumns = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM pragma_table_info('LaunchPoint')
    `;
    
    const hasOldSchema = launchPointColumns.some(col => 
      ['name', 'latitude', 'longitude'].includes(col.name)
    );
    
    // Backup all tables
    const users = await prisma.user.findMany();
    const categories = await prisma.category.findMany();
    
    type LaunchPointBackup = {
      id: number;
      isOfficial: boolean;
      hints: string | null;
      openingHours: string;
      parkingOptions: string | null;
      nearbyWaters: string | null;
      foodSupply: string | null;
      createdAt: Date;
      createdById: number;
      point: {
        name: string;
        latitude: number;
        longitude: number;
      };
      categories: Array<{
        categoryId: number;
        category?: { id: number; name_en: string; name_de: string };
      }>;
      stations: Array<{
        name: string;
        distanceMeters: number;
      }>;
    };
    
    let launchPoints: LaunchPointBackup[];
    
    if (hasPointTable)
    {
      // New schema - use relations
      launchPoints = await prisma.launchPoint.findMany({
        include: {
          point: true,
          categories: {
            include: { category: true }
          },
          stations: true
        }
      });
    }
    else if (hasOldSchema)
    {
      // Old schema - read directly from LaunchPoint columns
      console.log('  ℹ️  Detected old schema (LaunchPoint with name/latitude/longitude)');
      console.log('     Will migrate to new Point-based schema during restore\n');
      
      launchPoints = await prisma.$queryRaw<Array<{
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        isOfficial: boolean;
        hints: string | null;
        openingHours: string;
        parkingOptions: string | null;
        nearbyWaters: string | null;
        foodSupply: string | null;
        createdAt: Date;
        createdById: number;
      }>>`
        SELECT id, name, latitude, longitude, isOfficial, hints, openingHours, 
               parkingOptions, nearbyWaters, foodSupply, createdAt, createdById
        FROM LaunchPoint
      `;
      
      // Get categories and stations separately
      const categoriesData = await prisma.$queryRaw<Array<{
        launchPointId: number;
        categoryId: number;
      }>>`
        SELECT launchPointId, categoryId FROM LaunchPointCategory
      `;
      
      const stationsData = await prisma.$queryRaw<Array<{
        launchPointId: number;
        name: string;
        distanceMeters: number;
      }>>`
        SELECT launchPointId, name, distanceMeters FROM PublicTransportStation
      `;
      
      // Attach categories and stations to launch points
      launchPoints = launchPoints.map(lp => ({
        ...lp,
        point: {
          name: lp.name,
          latitude: lp.latitude,
          longitude: lp.longitude
        },
        categories: categoriesData
          .filter(c => c.launchPointId === lp.id)
          .map(c => ({ categoryId: c.categoryId })),
        stations: stationsData
          .filter(s => s.launchPointId === lp.id)
          .map(s => ({ name: s.name, distanceMeters: s.distanceMeters }))
      }));
    }
    else
    {
      // No LaunchPoint table or empty
      launchPoints = [];
    }

    console.log(`  ✓ Backed up ${users.length} users`);
    console.log(`  ✓ Backed up ${launchPoints.length} launch points`);
    console.log(`  ✓ Backed up ${categories.length} categories`);

    console.log('\n🔄 Resetting database...');
    // Close connection before reset
    await prisma.$disconnect();

    // Run prisma db push with force reset
    const { execSync } = await import('child_process');
    execSync('npx prisma db push --force-reset --accept-data-loss', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });

    console.log('\n📥 Restoring data...');

    // Restore categories first
    for (const cat of categories) 
    {
      await prisma.category.create({ data: cat });
    }
    console.log(`  ✓ Restored ${categories.length} categories`);

    // Restore users
    for (const user of users) 
    {
      await prisma.user.create({ data: user });
    }
    console.log(`  ✓ Restored ${users.length} users`);

    // Restore launch points with relationships
    for (const lp of launchPoints) 
    {
      const { categories: lpCategories, stations, point, ...lpData } = lp;
      
      // Create Point first
      const createdPoint = await prisma.point.create({
        data: {
          name: point.name,
          latitude: point.latitude,
          longitude: point.longitude
        }
      });
      
      // Extract only the fields that exist in the new schema
      const { id, name, latitude, longitude, ...launchPointFields } = lpData;
      
      // Then create LaunchPoint
      await prisma.launchPoint.create({
        data: {
          ...launchPointFields,
          pointId: createdPoint.id,
          categories: {
            create: (lpCategories || []).map((lpc: any) => ({
              categoryId: lpc.categoryId || lpc.category?.id || lpc.categoryId
            }))
          },
          stations: {
            create: (stations || []).map((s: any) => ({
              name: s.name,
              distanceMeters: s.distanceMeters
            }))
          }
        }
      });
    }
    console.log(`  ✓ Restored ${launchPoints.length} launch points with relationships`);

    console.log('\n✅ Database reset and restore complete!\n');

  }
  catch (error: any) 
  {
    console.error('\n❌ Error during backup/restore:', error.message);
    throw error;
  }
}

main()
  .catch((e) => 
  {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => 
  {
    await prisma.$disconnect();
  });

