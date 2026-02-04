import 'dotenv-flow/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().regex(/^\d+$/).transform(Number),
  FRONTEND_URL: z.string().url(),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  JWT_SECRET: z.string().min(32),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_PHONE_NUMBER: z.string().min(1),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().min(1),
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
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',
    EMAIL_USER: process.env.EMAIL_USER || '',
    EMAIL_PASS: process.env.EMAIL_PASS || '',
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
