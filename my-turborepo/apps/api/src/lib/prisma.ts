import { PrismaClient } from '@prisma/client';

import { env } from '../config/env';

declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var __prisma?: PrismaClient;
}

const prisma = globalThis.__prisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
