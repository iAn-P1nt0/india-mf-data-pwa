import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(0).default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  MFAPI_BASE_URL: z.string().url().default('https://api.mfapi.in/mf'),
  REDIS_URL: z.string().url().optional(),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  APP_VERSION: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables', parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
