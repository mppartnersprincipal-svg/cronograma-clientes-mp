import path from 'path';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// Resolve o caminho absoluto para o dev.db a partir da raiz do projeto
function createPrismaClient(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db';
  // "file:./dev.db" → "./dev.db" → absoluto
  const dbPath = path.resolve(
    process.cwd(),
    dbUrl.replace(/^file:/, '')
  );
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  return new PrismaClient({ adapter });
}

// Singleton para evitar múltiplas conexões durante hot reload em desenvolvimento
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
