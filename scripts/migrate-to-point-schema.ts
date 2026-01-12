import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

async function migrateToPointSchema()
{
  console.log('🔄 Migrating database to Point-based schema...\n');
  
  try
  {
    // Check if Point table exists
    const tables = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name='Point'
    `;
    
    if (tables.length > 0)
    {
      console.log('ℹ️  Point table already exists. Migration may have already been run.');
      console.log('   If you need to re-run, please reset the database first: npm run db:reset');
      return;
    }
    
    // Check if LaunchPoint table has old structure (with name, latitude, longitude columns)
    const launchPointColumns = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM pragma_table_info('LaunchPoint')
    `;
    
    const hasOldColumns = launchPointColumns.some(col => 
      ['name', 'latitude', 'longitude'].includes(col.name)
    );
    
    if (!hasOldColumns)
    {
      console.log('ℹ️  LaunchPoint table does not have old columns (name, latitude, longitude).');
      console.log('   The schema may already be migrated or the database is empty.');
      console.log('   You can proceed with: npm run db:push');
      return;
    }
    
    console.log('📊 Current database state:');
    const launchPointCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM LaunchPoint
    `;
    console.log(`   LaunchPoints: ${launchPointCount[0].count}`);
    
    if (launchPointCount[0].count === 0n)
    {
      console.log('\n✅ No data to migrate. You can proceed with: npm run db:push');
      return;
    }
    
    console.log('\n⚠️  This migration will:');
    console.log('   1. Create Point records for each existing LaunchPoint');
    console.log('   2. Update LaunchPoint records to reference the new Point records');
    console.log('   3. Remove old columns (name, latitude, longitude) from LaunchPoint');
    console.log('\n   Note: This requires manual SQL execution as Prisma cannot migrate');
    console.log('   from a schema that doesn\'t match the current database structure.\n');
    
    console.log('💡 Recommended approach:');
    console.log('   1. Backup your data: npm run db:reset (this backs up before reset)');
    console.log('   2. Or use: npm run db:push --force-reset (⚠️  this will DELETE all data)');
    console.log('   3. Then re-import your data using the import scripts\n');
    
    console.log('   If you have important data, use db:reset which will:');
    console.log('   - Backup all data');
    console.log('   - Reset the database');
    console.log('   - Restore the data in the new schema format');
    
    process.exit(0);
  }
  catch (error: unknown)
  {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error checking database:', errorMessage);
    
    if (errorMessage.includes('no such table'))
    {
      console.error('\n💡 The database tables do not exist yet.');
      console.error('   You can proceed with: npm run db:push');
    }
    
    process.exit(1);
  }
}

migrateToPointSchema()
  .catch((e: unknown) => 
  {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Error:', errorMessage);
    process.exit(1);
  })
  .finally(async () => 
  {
    await prisma.$disconnect();
  });
