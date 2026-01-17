import * as dotenv from 'dotenv';
import path from 'path';

// Ensure .env is loaded
dotenv.config({ path: path.join(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4001', 10),
  API_URL: process.env.API_URL || 'http://127.0.0.1:4001',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://127.0.0.1:3000',

  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://qrstudios:qrstudios_password@127.0.0.1:5432/qrstudios',

  JWT_SECRET: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'your-secret-key-change-me-in-production';
  })(),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET is required in production');
    }
    return 'your-refresh-secret-key-change-me-in-production';
  })(),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXTAUTH_SECRET is required in production');
    }
    return 'default-nextauth-secret';
  })(),
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000',

  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || '',
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET || '',

  ADMIN_DISCORD_IDS: process.env.ADMIN_DISCORD_IDS
    ? process.env.ADMIN_DISCORD_IDS.split(',').map(id => id.trim())
    : [], // No hardcoded IDs - must be set in environment

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',

  REDIS_URL: process.env.REDIS_URL,

  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@qrstudio.com',

  SENTRY_DSN: process.env.SENTRY_DSN,

  STORAGE_PATH: process.env.STORAGE_PATH || 'storage/downloads',

  ALLOWED_ADMIN_IPS: process.env.ALLOWED_ADMIN_IPS ? process.env.ALLOWED_ADMIN_IPS.split(',') : [],

  // Cloudflare R2
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || '',
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || '',
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || '',
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'qr-studios',
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || '',
} as const;

export default env;
