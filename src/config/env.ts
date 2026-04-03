import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const isDemo = process.env['DEMO_MODE'] === 'true';

// In demo mode all external service credentials are optional placeholders.
const optional = (schema: z.ZodString) => (isDemo ? schema.optional().default('demo_placeholder') : schema);
const optionalUrl = (fallback: string) =>
  isDemo ? z.string().optional().default(fallback) : z.string().url();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  API_BASE_URL: z.string().url().default('http://localhost:3001'),
  DEMO_MODE: z.string().optional().default('false'),

  DATABASE_URL: isDemo
    ? z.string().optional().default('postgresql://demo:demo@localhost:5432/demo')
    : z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters')
    .default(isDemo ? 'demo-secret-key-minimum-32-characters-ok' : ''),

  JWT_EXPIRES_IN: z.string().default('24h'),

  SALESFORCE_CLIENT_ID: optional(z.string().min(1)),
  SALESFORCE_CLIENT_SECRET: optional(z.string().min(1)),
  SALESFORCE_REDIRECT_URI: optionalUrl('http://localhost:3001/callback'),
  SALESFORCE_INSTANCE_URL: optionalUrl('https://demo.salesforce.com'),
  SALESFORCE_USERNAME: z.string().optional(),
  SALESFORCE_PASSWORD: z.string().optional(),
  SALESFORCE_SECURITY_TOKEN: z.string().optional(),

  NETSUITE_ACCOUNT_ID: optional(z.string().min(1)),
  NETSUITE_CONSUMER_KEY: optional(z.string().min(1)),
  NETSUITE_CONSUMER_SECRET: optional(z.string().min(1)),
  NETSUITE_TOKEN_KEY: optional(z.string().min(1)),
  NETSUITE_TOKEN_SECRET: optional(z.string().min(1)),
  NETSUITE_BASE_URL: optionalUrl('https://demo.netsuite.com'),

  STRIPE_SECRET_KEY: isDemo
    ? z.string().optional().default('sk_test_demo_placeholder')
    : z.string().startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_'),
  STRIPE_PUBLISHABLE_KEY: isDemo
    ? z.string().optional().default('pk_test_demo_placeholder')
    : z.string().startsWith('pk_', 'STRIPE_PUBLISHABLE_KEY must start with pk_'),
  STRIPE_WEBHOOK_SECRET: isDemo
    ? z.string().optional().default('whsec_demo_placeholder')
    : z.string().startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),

  SENDGRID_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@paybridge.com'),
  EMAIL_FROM_NAME: z.string().default('PayBridge'),

  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`❌ Environment validation failed:\n${errors}`);
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();
export type Env = typeof env;
