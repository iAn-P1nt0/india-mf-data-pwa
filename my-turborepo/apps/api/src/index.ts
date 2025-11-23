import { createServer } from 'http';

import { createApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.log(`🚀 API server running on http://localhost:${env.PORT}`);
  });

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start API server', error);
  process.exit(1);
});
