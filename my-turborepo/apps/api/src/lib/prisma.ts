import { PrismaClient } from '@prisma/client';

import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient;
};

const prisma = globalForPrisma.__prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.__prisma = prisma;
}

export default prisma;
