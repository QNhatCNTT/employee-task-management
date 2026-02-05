import path from 'node:path';
import dotenvFlow from 'dotenv-flow';
import { z } from 'zod';

// Configure dotenv-flow to look at root directory before loading
dotenvFlow.config({
  path: path.resolve(process.cwd(), '../'),
  node_env: process.env.NODE_ENV || 'development',
});

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/).transform(Number),
  FRONTEND_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  JWT_SECRET: z.string().min(32),
  // Provider selection
  SMS_PROVIDER: z.enum(['twilio', 'http', 'console']).default('console'),
  EMAIL_PROVIDER: z.enum(['nodemailer', 'console']).default('console'),
  // Twilio config (optional if using console provider)
  TWILIO_ACCOUNT_SID: z.string().optional().default(''),
  TWILIO_AUTH_TOKEN: z.string().optional().default(''),
  TWILIO_PHONE_NUMBER: z.string().optional().default(''),
  // Email config (optional if using console provider)
  EMAIL_USER: z.string().optional().default(''),
  EMAIL_PASS: z.string().optional().default(''),
  // HTTP SMS Provider config (for generic SMS APIs)
  HTTP_SMS_URL: z.string().optional().default(''),
  HTTP_SMS_METHOD: z.string().optional().default('POST'),
  HTTP_SMS_BODY: z.string().optional().default(''),
  HTTP_SMS_HEADERS: z.string().optional().default('{}'),
  HTTP_SMS_FROM: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

export function loadEnv(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const env = {
    PORT: process.env.PORT || '3001',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    SMS_PROVIDER: process.env.SMS_PROVIDER || 'console',
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'console',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
    HTTP_SMS_URL: process.env.HTTP_SMS_URL || '',
    HTTP_SMS_METHOD: process.env.HTTP_SMS_METHOD || 'POST',
    HTTP_SMS_BODY: process.env.HTTP_SMS_BODY || '',
    HTTP_SMS_HEADERS: process.env.HTTP_SMS_HEADERS || '{}',
    HTTP_SMS_FROM: process.env.HTTP_SMS_FROM || '',
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    console.error('\n\x1b[31m✖\x1b[0m \x1b[1mEnvironment Validation Failed\x1b[0m\n');
    console.error('\x1b[31mInvalid environment variables:\x1b[0m\n');

    for (const issue of result.error.issues) {
      const field = issue.path.join('.');
      console.error(`  \x1b[31m✖\x1b[0m ${field}: ${issue.message}`);
    }

    console.error('\n\x1b[33mPlease fix the .env file in the project root.\x1b[0m\n');
    process.exit(1);
  }

  // Process newlines in private key
  const config = result.data;
  cachedConfig = {
    ...config,
    FIREBASE_PRIVATE_KEY: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };

  return cachedConfig;
}

export const envConfig = loadEnv();
