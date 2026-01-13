import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

// Default path: launchpoints-import-data.json in external-data-preset directory
// (matches the output from parse:tables-launchpoints-export when using default input)
const args = process.argv.slice(2);
const jsonPath = args.length > 0
  ? (path.isAbsolute(args[0]) ? args[0] : path.join(__dirname, '..', args[0]))
  : path.join(__dirname, 'external-data-preset', 'launchpoints-import-data.json');

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

/**
 * Launch point data structure for import
 */
interface LaunchPointData {
  name: string;
  latitude: number;
  longitude: number;
  isOfficial: boolean;
  hints: string | null;
  openingHours: string;
  parkingOptions: string | null;
  nearbyWaters: string | null;
  foodSupply: string | null;
  address: {
    street: string | null;
    postalCode: string | null;
    city: string | null;
    country: string;
  };
  originalData: {
    betreiber: string;
    anleger: string | null;
    gewaesser: string;
    km: string | null;
    gastliegeplaetze: string;
  };
}

async function main()
{
  console.log('Importing launch points...\n');

  if (args.length === 0)
  {
    console.log('ℹ️  Using default input file: scripts/external-data-preset/launchpoints-import-data.json');
    console.log('💡 Tip: You can specify a custom input file:');
    console.log('   npm run import:external-launchpoints <input.json>');
    console.log('');
  }

  // Check if JSON file exists
  if (!fs.existsSync(jsonPath))
  {
    console.error(`❌ Error: JSON file not found at ${jsonPath}`);
    if (args.length === 0)
    {
      console.error('Using default path: scripts/external-data-preset/launchpoints-import-data.json');
      console.error('Please run the parse:tables-launchpoints-export script first to generate the JSON file.');
      console.error('💡 Tip: You can specify a custom input file:');
      console.error('   npm run import:external-launchpoints <input.json>');
    }
    else
    {
      console.error('Please ensure the specified file exists.');
    }
    process.exit(1);
  }

  // Read JSON file
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as LaunchPointData[];

  // Get imported user
  const importedUser = await prisma.user.findUnique({
    where: { username: 'imported' }
  });

  if (!importedUser)
  {
    console.error('❌ Error: imported user not found!');
    console.error('Please run the seed script first: npm run db:seed');
    process.exit(1);
  }

  console.log(`✓ Found user: ${importedUser.username} (ID: ${importedUser.id})`);

  // Get category IDs for kajak and sup
  const kajakCategory = await prisma.category.findUnique({
    where: { name_en: 'kajak' }
  });

  const supCategory = await prisma.category.findUnique({
    where: { name_en: 'sup' }
  });

  if (!kajakCategory || !supCategory)
  {
    console.error('❌ Error: Categories not found!');
    console.error('Please run the seed script first: npm run db:seed');
    process.exit(1);
  }

  console.log(`✓ Found categories: kajak (ID: ${kajakCategory.id}), sup (ID: ${supCategory.id})\n`);

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Get all existing imported launch points to check for duplicates
  const existingImportedPoints = await prisma.launchPoint.findMany({
    where: {
      createdById: importedUser.id
    },
    include: {
      point: true
    }
  });

  // Transform to format expected by isDuplicate function
  const existingPointsForCheck = existingImportedPoints.map(lp => ({
    id: lp.id,
    name: lp.point.name,
    latitude: lp.point.latitude,
    longitude: lp.point.longitude
  }));

  console.log(`Found ${existingImportedPoints.length} existing imported launch points in database\n`);

  // Helper function to calculate distance between two coordinates (Haversine formula)
  function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number
  {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Helper function to check if entry is a duplicate
  function isDuplicate(entry: LaunchPointData, existingPoints: Array<{ name: string; latitude: number; longitude: number }>): { isDuplicate: boolean; reason?: string; existingName?: string }
  {
    for (const existing of existingPoints)
    {
      // Check exact match (name and coordinates)
      if (existing.name === entry.name &&
          Math.abs(existing.latitude - entry.latitude) < 0.0001 &&
          Math.abs(existing.longitude - entry.longitude) < 0.0001)
      {
        return { isDuplicate: true, reason: 'exact match', existingName: existing.name };
      }

      // Check nearby coordinates (within 100 meters)
      const distance = distanceInMeters(
        existing.latitude,
        existing.longitude,
        entry.latitude,
        entry.longitude
      );

      if (distance < 100) // 100 meters threshold
      {
        return { isDuplicate: true, reason: `nearby location (${Math.round(distance)}m away)`, existingName: existing.name };
      }

      // Check same name with similar coordinates (within 500 meters)
      if (existing.name === entry.name && distance < 500)
      {
        return { isDuplicate: true, reason: `same name, nearby (${Math.round(distance)}m away)`, existingName: existing.name };
      }
    }

    return { isDuplicate: false };
  }

  for (let i = 0; i < jsonData.length; i++)
  {
    const entry = jsonData[i];
    
    try
    {
      // Check for duplicates
      const duplicateCheck = isDuplicate(entry, existingPointsForCheck);

      if (duplicateCheck.isDuplicate)
      {
        console.log(`[${i + 1}/${jsonData.length}] ○ Skipped (${duplicateCheck.reason}): ${entry.name}`);
        if (duplicateCheck.existingName && duplicateCheck.existingName !== entry.name)
        {
          console.log(`    → Matches existing: ${duplicateCheck.existingName}`);
        }
        skippedCount++;
        continue;
      }

      // Create Point first, then LaunchPoint
      const point = await prisma.point.create({
        data: {
          name: entry.name,
          latitude: entry.latitude,
          longitude: entry.longitude
        }
      });

      const launchPoint = await prisma.launchPoint.create({
        data: {
          pointId: point.id,
          isOfficial: true, // All imported points are official
          hints: entry.hints,
          openingHours: entry.openingHours,
          parkingOptions: entry.parkingOptions,
          nearbyWaters: entry.nearbyWaters,
          foodSupply: entry.foodSupply,
          createdById: importedUser.id,
          categories: {
            create: [
              { categoryId: kajakCategory.id },
              { categoryId: supCategory.id }
            ]
          }
        },
        include: {
          point: true
        }
      });

      // Add to existing points list to check against future entries in this import
      existingPointsForCheck.push({
        id: launchPoint.id,
        name: launchPoint.point.name,
        latitude: launchPoint.point.latitude,
        longitude: launchPoint.point.longitude
      });

      console.log(`[${i + 1}/${jsonData.length}] ✓ Imported: ${entry.name} (ID: ${launchPoint.id})`);
      importedCount++;
    }
    catch (error: any)
    {
      console.error(`[${i + 1}/${jsonData.length}] ✗ Error importing ${entry.name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Import Summary:');
  console.log(`  ✓ Imported: ${importedCount}`);
  console.log(`  ○ Skipped (already exists): ${skippedCount}`);
  console.log(`  ✗ Errors: ${errorCount}`);
  console.log(`  📝 Total processed: ${jsonData.length}`);
  console.log('\n✅ Import completed!');
}

main()
  .catch((e) => 
  {
    console.error('Error importing launch points:', e);
    process.exit(1);
  })
  .finally(async () => 
  {
    await prisma.$disconnect();
  });

