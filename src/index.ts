import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './db/client';
import { startJobs, stopJobs } from './jobs';
import logger from './utils/logger';

const DEMO_MODE = process.env['DEMO_MODE'] === 'true';

async function main() {
  // In demo mode skip real DB and job connections
  if (!DEMO_MODE) {
    await connectDB();
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`, {
      env: env.NODE_ENV,
      url: `http://localhost:${env.PORT}`,
    });
  });

  // Start background jobs
  startJobs();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(async () => {
      if (!DEMO_MODE) {
        await stopJobs();
        await disconnectDB();
      }
      logger.info('Server closed');
      process.exit(0);
    });

    // Force shutdown after 30s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
