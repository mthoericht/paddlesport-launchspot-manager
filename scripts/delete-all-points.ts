import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

async function checkDatabaseExists(): Promise<boolean>
{
  if (!fs.existsSync(dbPath))
  {
    return false;
  }
  
  // Try to query a table to see if schema exists
  try
  {
    await prisma.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Point' LIMIT 1`;
    return true;
  }
  catch
  {
    return false;
  }
}

async function deleteAllPoints() 
{
  console.log('🗑️  Deleting all points from database...\n');
  console.log('   This will also delete all associated launch points and public transport stations due to cascade delete.\n');
  
  // Check if database exists and has tables
  const dbExists = await checkDatabaseExists();
  if (!dbExists)
  {
    console.error('❌ Error: Database tables do not exist.');
    console.error('   Please run the following commands first:');
    console.error('   1. npm run db:generate');
    console.error('   2. npm run db:push');
    console.error('');
    console.error('   Or run the setup command:');
    console.error('   npm run db:setup');
    process.exit(1);
  }
  
  // Count before deletion for summary
  let pointCount: number;
  let launchPointCount: number;
  let publicTransportPointCount: number;
  let publicTransportPointTypeCount: number;
  let launchPointCategoryCount: number;
  let publicTransportStationCount: number;
  
  try
  {
    pointCount = await prisma.point.count();
    launchPointCount = await prisma.launchPoint.count();
    publicTransportPointCount = await prisma.publicTransportPoint.count();
    publicTransportPointTypeCount = await prisma.publicTransportPointType.count();
    launchPointCategoryCount = await prisma.launchPointCategory.count();
    publicTransportStationCount = await prisma.publicTransportStation.count();
  }
  catch (error: unknown)
  {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error accessing database tables:', errorMessage);
    console.error('   This may indicate the database schema is not up to date.');
    console.error('   Please run: npm run db:push');
    process.exit(1);
  }
  
  console.log('📊 Current database state:');
  console.log(`   Points: ${pointCount}`);
  console.log(`   Launch Points: ${launchPointCount}`);
  console.log(`   Public Transport Points: ${publicTransportPointCount}`);
  console.log(`   Public Transport Point Types: ${publicTransportPointTypeCount}`);
  console.log(`   Launch Point Categories: ${launchPointCategoryCount}`);
  console.log(`   Public Transport Stations: ${publicTransportStationCount}`);
  console.log('');
  
  // Delete all Points - this will cascade delete:
  // - LaunchPoints (onDelete: Cascade)
  // - PublicTransportPoints (onDelete: Cascade)
  // Which in turn will cascade delete:
  // - LaunchPointCategories (onDelete: Cascade from LaunchPoint)
  // - PublicTransportStations (onDelete: Cascade from LaunchPoint)
  // - PublicTransportPointTypes (onDelete: Cascade from PublicTransportPoint)
  const deletedPoints = await prisma.point.deleteMany({});
  console.log(`  ✓ Deleted ${deletedPoints.count} points`);
  
  // Verify cascade deletions
  const remainingLaunchPoints = await prisma.launchPoint.count();
  const remainingPublicTransportPoints = await prisma.publicTransportPoint.count();
  const remainingPublicTransportPointTypes = await prisma.publicTransportPointType.count();
  const remainingLaunchPointCategories = await prisma.launchPointCategory.count();
  const remainingPublicTransportStations = await prisma.publicTransportStation.count();
  
  console.log('\n📊 Verification after deletion:');
  console.log(`   Points: ${await prisma.point.count()}`);
  console.log(`   Launch Points: ${remainingLaunchPoints} (should be 0)`);
  console.log(`   Public Transport Points: ${remainingPublicTransportPoints} (should be 0)`);
  console.log(`   Public Transport Point Types: ${remainingPublicTransportPointTypes} (should be 0)`);
  console.log(`   Launch Point Categories: ${remainingLaunchPointCategories} (should be 0)`);
  console.log(`   Public Transport Stations: ${remainingPublicTransportStations} (should be 0)`);
  
  if (remainingLaunchPoints === 0 && 
      remainingPublicTransportPoints === 0 && 
      remainingPublicTransportPointTypes === 0 &&
      remainingLaunchPointCategories === 0 &&
      remainingPublicTransportStations === 0)
  {
    console.log('\n✅ All points and associated data deleted successfully!');
  }
  else
  {
    console.log('\n⚠️  Warning: Some associated records were not deleted. This may indicate a schema issue.');
  }
}

deleteAllPoints()
  .catch((e: unknown) => 
  {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Error:', errorMessage);
    
    if (errorMessage.includes('no such table'))
    {
      console.error('');
      console.error('💡 The database tables do not exist. Please run:');
      console.error('   npm run db:push');
      console.error('');
      console.error('   Or run the full setup:');
      console.error('   npm run db:setup');
    }
    
    process.exit(1);
  })
  .finally(async () => 
  {
    await prisma.$disconnect();
  });

