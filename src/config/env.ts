import dotenv from 'dotenv';
import path from 'path';

// Load .env file - resolve from project root to work in all contexts (dev, test, docker)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also try cwd-relative as fallback
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULTS = {
  PORT: '3000',
  NODE_ENV: 'development',
  DATABASE_URL: 'postgresql://taskflow:taskflow123@127.0.0.1:5434/taskflow_db?schema=public',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  REDIS_PASSWORD: '',
  JWT_SECRET: 'super-secret-access-token-key-taskflow-2026',
  JWT_REFRESH_SECRET: 'super-secret-refresh-token-key-taskflow-2026',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  RATE_LIMIT_WINDOW_MS: '60000',
  RATE_LIMIT_MAX_REQUESTS: '10',
} as const;

// Read directly from process.env with hardcoded fallbacks — never undefined
export const env = {
  PORT: process.env.PORT || DEFAULTS.PORT,
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || DEFAULTS.NODE_ENV as 'development',
  DATABASE_URL: process.env.DATABASE_URL || DEFAULTS.DATABASE_URL,
  REDIS_HOST: process.env.REDIS_HOST || DEFAULTS.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT || DEFAULTS.REDIS_PORT,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || DEFAULTS.REDIS_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET || DEFAULTS.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || DEFAULTS.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || DEFAULTS.JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || DEFAULTS.JWT_REFRESH_EXPIRES_IN,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || DEFAULTS.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || DEFAULTS.RATE_LIMIT_MAX_REQUESTS,
};
