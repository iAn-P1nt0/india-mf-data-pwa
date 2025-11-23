import { Router } from 'express';

import prisma from '../lib/prisma';
import { env } from '../config/env';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION ?? 'dev',
      dependencies: {
        database: 'ok'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: env.APP_VERSION ?? 'dev',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
