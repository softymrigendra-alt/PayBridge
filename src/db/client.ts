import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

  client.$on('query' as never, (e: { query: string; duration: number }) => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('DB Query', { query: e.query, duration: `${e.duration}ms` });
    }
  });

  return client;
}

// Prevent multiple Prisma Client instances in development (hot reload)
export const prisma = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export async function connectDB() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (error) {
    logger.error('Database connection failed', { error });
    process.exit(1);
  }
}

export async function disconnectDB() {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
