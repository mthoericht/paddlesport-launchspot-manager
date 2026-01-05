import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ 
  adapter,
  log: ['query', 'info', 'warn', 'error']
});

const categories = [
  { name_en: 'kajak', name_de: 'Kajak' },
  { name_en: 'swimming', name_de: 'Schwimmen' },
  { name_en: 'sup', name_de: 'SUP' },
  { name_en: 'relax', name_de: 'Entspannen' }
];

async function main()
{
  console.log('Seeding categories...');

  // Check if Category table exists by trying to query it
  try
  {
    await prisma.$queryRaw`SELECT 1 FROM Category LIMIT 1`;
  }
  catch (error: any)
  {
    if (error.message?.includes('no such table') || error.message?.includes('Category'))
    {
      console.error('\n❌ Error: Category table does not exist!');
      console.error('Please run the following commands first:');
      console.error('  1. npm run db:generate  (generate Prisma client)');
      console.error('  2. npm run db:push      (push schema to database)');
      console.error('  3. npm run db:seed     (seed categories)');
      console.error('\nOr use the combined command:');
      console.error('  npm run db:setup\n');
      process.exit(1);
    }
    throw error;
  }

  for (const category of categories)
  {
    const existing = await prisma.category.findUnique({
      where: { name_en: category.name_en }
    });

    if (!existing)
    {
      await prisma.category.create({
        data: category
      });
      console.log(`✓ Created category: ${category.name_en} (${category.name_de})`);
    }
    else
    {
      console.log(`○ Category already exists: ${category.name_en} (${category.name_de})`);
    }
  }

  // Create imported user
  console.log('\nSeeding imported user...');
  const importedEmail = 'imported@test.de';
  const importedUsername = 'imported';
  
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: importedEmail },
        { username: importedUsername }
      ]
    }
  });

  if (!existingUser)
  {
    const hashedPassword = await bcrypt.hash('imported-seed-password', 10);
    await prisma.user.create({
      data: {
        email: importedEmail,
        username: importedUsername,
        password: hashedPassword,
        isAdmin: false
      }
    });
    console.log(`✓ Created user: ${importedUsername}`);
  }
  else
  {
    console.log(`○ User already exists: ${importedUsername}`);
  }

  console.log('\n✅ Seeding completed!');
}

main()
  .catch((e) =>
  {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () =>
  {
    await prisma.$disconnect();
  });

