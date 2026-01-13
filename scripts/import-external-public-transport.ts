import { PrismaClient, PublicTransportType } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

// Default path: berlin-public-transport.json in external-data-preset directory
const args = process.argv.slice(2);
const jsonPath = args.length > 0
  ? (path.isAbsolute(args[0]) ? args[0] : path.join(__dirname, '..', args[0]))
  : path.join(__dirname, 'external-data-preset', 'berlin-public-transport.json');

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

/**
 * Public transport station data structure for import
 */
interface PublicTransportStationData {
  name: string;
  latitude: number;
  longitude: number;
  types: string[];
  lines: string[];
}

async function main()
{
  console.log('Importing public transport stations...\n');

  if (args.length === 0)
  {
    console.log('ℹ️  Using default input file: scripts/external-data-preset/berlin-public-transport.json');
    console.log('💡 Tip: You can specify a custom input file:');
    console.log('   npm run import:publictransportStations <input.json>');
    console.log('');
  }

  // Check if JSON file exists
  if (!fs.existsSync(jsonPath))
  {
    console.error(`❌ Error: JSON file not found at ${jsonPath}`);
    if (args.length === 0)
    {
      console.error('Using default path: scripts/external-data-preset/berlin-public-transport.json');
      console.error('Please run the parse:tables-public-transport-export script first to generate the JSON file.');
      console.error('💡 Tip: You can specify a custom input file:');
      console.error('   npm run import:publictransportStations <input.json>');
    }
    else
    {
      console.error('Please ensure the specified file exists.');
    }
    process.exit(1);
  }

  // Read JSON file
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as PublicTransportStationData[];

  // Validate data
  if (!Array.isArray(jsonData) || jsonData.length === 0)
  {
    console.error('❌ Error: JSON file is empty or invalid');
    process.exit(1);
  }

  console.log(`✓ Found ${jsonData.length} stations to import\n`);

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Get all existing public transport points to check for duplicates
  const existingPoints = await prisma.publicTransportPoint.findMany({
    include: {
      point: true
    }
  });

  // Transform to format expected by isDuplicate function
  const existingPointsForCheck = existingPoints.map(ptp => ({
    id: ptp.id,
    name: ptp.point.name,
    latitude: ptp.point.latitude,
    longitude: ptp.point.longitude
  }));

  console.log(`Found ${existingPoints.length} existing public transport points in database\n`);

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
  function isDuplicate(entry: PublicTransportStationData, existingPoints: Array<{ name: string; latitude: number; longitude: number }>): { isDuplicate: boolean; reason?: string; existingName?: string }
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

      // Check nearby coordinates (within 50 meters for stations)
      const distance = distanceInMeters(
        existing.latitude,
        existing.longitude,
        entry.latitude,
        entry.longitude
      );

      if (distance < 50) // 50 meters threshold for stations
      {
        return { isDuplicate: true, reason: `nearby location (${Math.round(distance)}m away)`, existingName: existing.name };
      }

      // Check same name with similar coordinates (within 200 meters)
      if (existing.name === entry.name && distance < 200)
      {
        return { isDuplicate: true, reason: `same name, nearby (${Math.round(distance)}m away)`, existingName: existing.name };
      }
    }

    return { isDuplicate: false };
  }

  // Map string types to enum values
  function mapTypeToEnum(type: string): PublicTransportType | null
  {
    const typeMap: Record<string, PublicTransportType> = {
      'train': PublicTransportType.train,
      'tram': PublicTransportType.tram,
      'sbahn': PublicTransportType.sbahn,
      'ubahn': PublicTransportType.ubahn
    };
    return typeMap[type.toLowerCase()] || null;
  }

  for (let i = 0; i < jsonData.length; i++)
  {
    const entry = jsonData[i];
    
    try
    {
      // Validate entry
      if (!entry.name || isNaN(entry.latitude) || isNaN(entry.longitude))
      {
        console.log(`[${i + 1}/${jsonData.length}] ✗ Skipped: Invalid data for ${entry.name || 'unknown'}`);
        errorCount++;
        continue;
      }

      // Validate types
      if (!entry.types || entry.types.length === 0)
      {
        console.log(`[${i + 1}/${jsonData.length}] ✗ Skipped: No valid types for ${entry.name}`);
        errorCount++;
        continue;
      }

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

      // Create Point first
      const point = await prisma.point.create({
        data: {
          name: entry.name,
          latitude: entry.latitude,
          longitude: entry.longitude
        }
      });

      // Create PublicTransportPoint
      const publicTransportPoint = await prisma.publicTransportPoint.create({
        data: {
          pointId: point.id,
          lines: entry.lines && entry.lines.length > 0 ? entry.lines.join(',') : null,
          types: {
            create: entry.types
              .map(type => mapTypeToEnum(type))
              .filter((type): type is PublicTransportType => type !== null)
              .map(type => ({ type }))
          }
        },
        include: {
          point: true,
          types: true
        }
      });

      // Add to existing points list to check against future entries in this import
      existingPointsForCheck.push({
        id: publicTransportPoint.id,
        name: publicTransportPoint.point.name,
        latitude: publicTransportPoint.point.latitude,
        longitude: publicTransportPoint.point.longitude
      });

      const typesStr = publicTransportPoint.types.map(t => t.type).join(', ');
      const linesStr = entry.lines && entry.lines.length > 0 ? entry.lines.join(', ') : 'none';
      console.log(`[${i + 1}/${jsonData.length}] ✓ Imported: ${entry.name} (ID: ${publicTransportPoint.id})`);
      console.log(`    Types: ${typesStr}, Lines: ${linesStr}`);
      importedCount++;
    }
    catch (error: unknown)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[${i + 1}/${jsonData.length}] ✗ Error importing ${entry.name}:`, errorMessage);
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
    console.error('Error importing public transport stations:', e);
    process.exit(1);
  })
  .finally(async () => 
  {
    await prisma.$disconnect();
  });
