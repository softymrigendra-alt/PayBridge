import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { captureRawBody } from './middleware/webhookRaw';
import { errorHandler, notFound } from './middleware/errorHandler';
import authRoutes from './api/auth';
import syncRoutes from './api/sync';
import opportunityRoutes from './api/opportunities';
import webhookRoutes from './api/webhooks';
import auditRoutes from './api/audit';
import cronRoutes from './api/cron';
import { demoMiddleware } from './middleware/demo';
import logger from './utils/logger';

const DEMO_MODE = process.env['DEMO_MODE'] === 'true';

const app = express();

// ─── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Rate limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ─── Stripe webhook — raw body BEFORE express.json() ─────────────────────────
app.use('/api/webhooks/stripe', captureRawBody);

// ─── Body parsing (skip for webhook route — body already captured as raw) ─────
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/stripe') return next();
  express.json({ limit: '1mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/stripe') return next();
  express.urlencoded({ extended: true })(req, res, next);
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV, demo: DEMO_MODE });
});

// ─── Demo mode — intercepts all routes with mock responses ────────────────────
if (DEMO_MODE) {
  logger.info('🎭 Demo mode enabled — all API calls return mock data');
  app.use(demoMiddleware);
}

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/cron', cronRoutes);

// ─── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
