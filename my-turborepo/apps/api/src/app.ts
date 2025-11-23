import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import healthRouter from './routes/health';
import fundsRouter from './routes/funds';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: env.NODE_ENV === 'development' ? ['http://localhost:5173', 'http://localhost:4173'] : undefined
  }));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/funds', fundsRouter);
  app.use('/api', healthRouter);

  app.get('/', (_req, res) => {
    res.json({
      name: 'India MF Data API',
      version: env.APP_VERSION ?? 'dev',
      documentation: 'https://github.com/iAn-P1nt0/india-mf-data-pwa'
    });
  });

  return app;
}

export type AppInstance = ReturnType<typeof createApp>;
