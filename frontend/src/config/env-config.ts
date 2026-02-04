/**
 * Frontend Environment Configuration
 * Validates required environment variables on app startup
 */

interface EnvConfig {
  API_URL: string;
  IS_DEV: boolean;
}

// Required environment variables
const REQUIRED_VARS = ['VITE_API_URL'] as const;

/**
 * Validate and load environment configuration
 */
function loadEnv(): EnvConfig {
  const missingVars: string[] = [];

  // Check for required variables
  for (const varName of REQUIRED_VARS) {
    const value = import.meta.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    }
  }

  // In development, show warnings but don't crash
  if (missingVars.length > 0) {
    const isDev = import.meta.env.DEV;
    const message = `Missing environment variables: ${missingVars.join(', ')}`;

    if (isDev) {
      console.warn(`⚠️ ${message}. Using default values.`);
    } else {
      console.error(`❌ ${message}`);
      // In production, we might want to show an error UI instead of crashing
    }
  }

  return {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    IS_DEV: import.meta.env.DEV === true,
  };
}

// Load and validate on module import
export const envConfig = loadEnv();

// Log config in development
if (envConfig.IS_DEV) {
  console.log('🔧 Environment Config:', {
    API_URL: envConfig.API_URL,
    IS_DEV: envConfig.IS_DEV,
  });
}
