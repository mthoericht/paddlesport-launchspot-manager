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

async function deleteAllLaunchPoints() 
{
  console.log('🗑️  Deleting all launch points from database...\n');
  
  // Delete in correct order due to foreign key constraints
  const deletedStations = await prisma.publicTransportStation.deleteMany({});
  console.log(`  ✓ Deleted ${deletedStations.count} public transport stations`);
  
  const deletedCategories = await prisma.launchPointCategory.deleteMany({});
  console.log(`  ✓ Deleted ${deletedCategories.count} launch point categories`);
  
  const deletedLaunchPoints = await prisma.launchPoint.deleteMany({});
  console.log(`  ✓ Deleted ${deletedLaunchPoints.count} launch points`);
  
  console.log('\n✅ All launch points deleted successfully!\n');
}

deleteAllLaunchPoints()
  .catch((e) => 
  {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => 
  {
    await prisma.$disconnect();
  });

