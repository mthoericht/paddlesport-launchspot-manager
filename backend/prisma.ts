import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';
import type { TypedPrismaClient } from './types/point.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');

const adapter = new PrismaLibSql({
  url: `file:${dbPath}`
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
