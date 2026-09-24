/**
 * Environment configuration loader and validator.
 * Validates all required variables on startup and fails fast with clear error messages.
 */

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

const requiredEnvs = ['MONGODB_URI', 'JWT_SECRET'];

const missing = [];
for (const envVar of requiredEnvs) {
  if (!process.env[envVar]) {
    missing.push(envVar);
  }
}

if (missing.length > 0) {
  throw new Error(`[Config Error] Missing required environment variables: ${missing.join(', ')}`);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  throw new Error('[Config Error] JWT_SECRET must be at least 32 characters long for secure HS256 signing.');
}

const nodeEnv = process.env.NODE_ENV || 'development';
const port = parseInt(process.env.PORT || '4000', 10);
const mongodbUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || (nodeEnv === 'test' ? 'marketlink_test' : 'marketlink');
const jwtSecret = process.env.JWT_SECRET;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
const trustProxy = process.env.TRUST_PROXY === 'true' ? true : false;
const logSlowMs = parseInt(process.env.LOG_SLOW_MS || '150', 10);

export const env = {
  NODE_ENV: nodeEnv,
  PORT: port,
  MONGODB_URI: mongodbUri,
  DB_NAME: dbName,
  JWT_SECRET: jwtSecret,
  CORS_ORIGINS: corsOrigins,
  APP_BASE_URL: appBaseUrl,
  RATE_LIMIT_DISABLED: rateLimitDisabled,
  TRUST_PROXY: trustProxy,
  LOG_SLOW_MS: logSlowMs,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  isDevelopment: nodeEnv === 'development',
};
