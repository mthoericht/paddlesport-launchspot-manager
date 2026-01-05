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
    // Backup all tables
    const users = await prisma.user.findMany();
    const launchPoints = await prisma.launchPoint.findMany({
      include: {
        categories: {
          include: { category: true }
        },
        stations: true
      }
    });
    const categories = await prisma.category.findMany();

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
      const { categories: lpCategories, stations, ...lpData } = lp;
      const created = await prisma.launchPoint.create({
        data: {
          ...lpData,
          categories: {
            create: lpCategories.map(lpc => ({
              categoryId: lpc.categoryId
            }))
          },
          stations: {
            create: stations.map(s => ({
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

