import cors from 'cors';
import express from 'express';

import { env } from './config/env';
import { createOriginMatchers } from './lib/cors';
import healthRouter from './routes/health';
import fundsRouter from './routes/funds';

export function createApp() {
  const app = express();

  const devOrigins = ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000'];
  const configuredOrigins = env.CORS_ALLOWED_ORIGINS
    ? env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : [];

  const rawAllowedOrigins = env.NODE_ENV === 'development' ? [...devOrigins, ...configuredOrigins] : configuredOrigins;
  const originMatchers = createOriginMatchers(rawAllowedOrigins);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || !originMatchers.length) {
        callback(null, true);
        return;
      }
      if (originMatchers.some((match) => match(origin))) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true
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
