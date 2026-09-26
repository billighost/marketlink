/**
 * Environment configuration loader and validator.
 * Validates all required variables on startup and fails fast with clear error messages.
 */

import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

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
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const isDevelopment = nodeEnv === 'development';

const testDbName = process.env.TEST_DB_NAME || 'marketlink_test';
const dbName = isTest ? testDbName : (process.env.DB_NAME || 'marketlink');

// ── Storage Driver Configuration ──
const hasCloudinaryCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let storageDriver = process.env.STORAGE_DRIVER;
if (isTest) {
  storageDriver = process.env.TEST_STORAGE_DRIVER || 'memory';
} else if (!storageDriver) {
  if (hasCloudinaryCreds) {
    storageDriver = 'cloudinary';
  } else {
    storageDriver = 'local';
  }
}

const validDrivers = ['cloudinary', 'local', 'memory'];
if (!validDrivers.includes(storageDriver)) {
  throw new Error(`[Config Error] Invalid STORAGE_DRIVER "${storageDriver}". Must be one of: ${validDrivers.join(', ')}`);
}

if (isProduction && storageDriver !== 'cloudinary') {
  throw new Error("[Config Error] In production, STORAGE_DRIVER must be 'cloudinary' and all Cloudinary credentials must be set.");
}

if (storageDriver === 'cloudinary') {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !/^[a-z0-9_-]+$/i.test(process.env.CLOUDINARY_CLOUD_NAME)) {
    throw new Error('[Config Error] CLOUDINARY_CLOUD_NAME must be set and match [a-z0-9_-]+');
  }
  if (!process.env.CLOUDINARY_API_KEY || !/^\d+$/.test(process.env.CLOUDINARY_API_KEY)) {
    throw new Error('[Config Error] CLOUDINARY_API_KEY must be set and contain digits only');
  }
  if (!process.env.CLOUDINARY_API_SECRET) {
    throw new Error('[Config Error] CLOUDINARY_API_SECRET must be set');
  }
}

const cloudinaryFolder = process.env.CLOUDINARY_FOLDER || 'marketlink';
const port = parseInt(process.env.PORT || '4000', 10);
const mongodbUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
const rateLimitDisabled = process.env.RATE_LIMIT_DISABLED === 'true';
const trustProxy = process.env.TRUST_PROXY === 'true';
const logSlowMs = parseInt(process.env.LOG_SLOW_MS || '150', 10);
const latencyAllowanceMs = parseInt(process.env.LATENCY_ALLOWANCE_MS || '0', 10);

const uploadDir =
  process.env.UPLOAD_DIR ||
  (fs.existsSync(path.resolve(process.cwd(), 'backend'))
    ? path.resolve(process.cwd(), 'backend/uploads')
    : path.resolve(process.cwd(), 'uploads'));

if (storageDriver === 'local') {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch {
    // directory already exists or creation deferred
  }
}

// ── Gemini Assistant Configuration ──
const assistantEnabled = process.env.ASSISTANT_ENABLED !== 'false';
const geminiApiKeysRaw = process.env.GEMINI_API_KEYS || '';
const geminiApiKeys = geminiApiKeysRaw
  .split(',')
  .map((k) => k.trim())
  .filter(Boolean);

if (assistantEnabled && isProduction && geminiApiKeys.length === 0) {
  throw new Error('[Config Error] GEMINI_API_KEYS must contain at least one API key when ASSISTANT_ENABLED is true.');
}

for (const key of geminiApiKeys) {
  if (key.length < 20) {
    throw new Error('[Config Error] Each key in GEMINI_API_KEYS must be at least 20 characters.');
  }
}

const geminiModel = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const geminiFallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-flash-lite-latest';
const geminiRpmPerKey = parseInt(process.env.GEMINI_RPM_PER_KEY || '10', 10);
const geminiTimeoutMs = parseInt(process.env.GEMINI_TIMEOUT_MS || '12000', 10);
const assistantMaxTokens = parseInt(process.env.ASSISTANT_MAX_TOKENS || '400', 10);

export const env = {
  NODE_ENV: nodeEnv,
  PORT: port,
  MONGODB_URI: mongodbUri,
  DB_NAME: dbName,
  TEST_DB_NAME: testDbName,
  JWT_SECRET: jwtSecret,
  CORS_ORIGINS: corsOrigins,
  APP_BASE_URL: appBaseUrl,
  RATE_LIMIT_DISABLED: rateLimitDisabled,
  TRUST_PROXY: trustProxy,
  LOG_SLOW_MS: logSlowMs,
  LATENCY_ALLOWANCE_MS: latencyAllowanceMs,
  STORAGE_DRIVER: storageDriver,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_FOLDER: cloudinaryFolder,
  UPLOAD_DIR: uploadDir,
  ASSISTANT_ENABLED: assistantEnabled,
  GEMINI_API_KEYS: geminiApiKeys,
  GEMINI_MODEL: geminiModel,
  GEMINI_FALLBACK_MODEL: geminiFallbackModel,
  GEMINI_RPM_PER_KEY: geminiRpmPerKey,
  GEMINI_TIMEOUT_MS: geminiTimeoutMs,
  ASSISTANT_MAX_TOKENS: assistantMaxTokens,
  GMAIL_USER: process.env.GMAIL_USER || '',
  GMAIL_APP_PASSWORD: (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, ''),
  EMAIL_FROM: process.env.EMAIL_FROM || (process.env.GMAIL_USER ? `MarketLink <${process.env.GMAIL_USER}>` : 'MarketLink <noreply@marketlink.test>'),
  GMAIL_DAILY_LIMIT: parseInt(process.env.GMAIL_DAILY_LIMIT || '450', 10),
  isProduction,
  isTest,
  isDevelopment,
};

