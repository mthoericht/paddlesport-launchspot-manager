import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TypedPrismaClient } from './types/point.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultDbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const defaultTestDbPath = path.join(__dirname, '..', 'data', 'database.test.sqlite');
const defaultDbUrl = `file:${defaultDbPath}`;
const defaultTestDbUrl = `file:${defaultTestDbPath}`;
const isTestEnv = process.env.NODE_ENV === 'test';
const databaseUrl = process.env.DATABASE_URL || (isTestEnv ? defaultTestDbUrl : defaultDbUrl);

if (isTestEnv && databaseUrl === defaultDbUrl)
{
  throw new Error('Unsafe test database configuration: tests must not use data/database.sqlite.');
}

const adapter = new PrismaLibSql({
  url: databaseUrl
});

const prismaClient = new PrismaClient({ 
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
});

// Handle graceful shutdown
process.on('beforeExit', async () => 
{
  await prismaClient.$disconnect();
});

/**
 * Creates a typed Prisma client that includes publicTransportPoint
 * Note: Type assertion is necessary because Prisma Client with adapter doesn't expose
 * all model delegates in TypeScript types, even though they exist at runtime.
 * This is a known limitation when using Prisma with custom adapters.
 */
function createTypedPrismaClient(): TypedPrismaClient
{
  return prismaClient as TypedPrismaClient;
}

// Export typed Prisma client that includes publicTransportPoint
const prisma: TypedPrismaClient = createTypedPrismaClient();

export default prisma;
