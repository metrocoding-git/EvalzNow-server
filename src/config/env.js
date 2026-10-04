const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config({ quiet: true });

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// ---------------------------------------------------------------------------
// JWT secret
// The old code fell back to the public string "your_secret_key", which let
// anyone forge a super-admin token. We never allow that any more.
// ---------------------------------------------------------------------------
const WEAK_SECRETS = new Set(['', 'your_secret_key', 'secret', 'changeme', 'jwt_secret']);
let JWT_SECRET = process.env.JWT_SECRET || '';

if (WEAK_SECRETS.has(JWT_SECRET) || JWT_SECRET.length < 32) {
  if (IS_PROD) {
    // Fail fast: running production with a weak/missing secret is unsafe.
    throw new Error(
      'JWT_SECRET is missing or too weak (min 32 chars). Set a strong JWT_SECRET in .env before starting in production.'
    );
  }
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn(
    '[security] JWT_SECRET missing/weak - using a random per-process secret. ' +
    'All sessions will end when the server restarts. Set JWT_SECRET in .env.'
  );
}

const DEFAULT_ORIGINS = ['http://localhost:3000', 'https://evalz.metrocoding.com'];
const CORS_ORIGINS = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

module.exports = {
  NODE_ENV,
  IS_PROD,
  PORT: process.env.PORT || 3000,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASSWORD || process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME,

  JWT_SECRET,
  // Session lifetime. Was 30 days; a stolen token is now useful for hours, not a month.
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',

  CORS_ORIGINS: CORS_ORIGINS.length ? CORS_ORIGINS : DEFAULT_ORIGINS,

  // Express "trust proxy". 'loopback' = trust X-Forwarded-For only from a reverse
  // proxy on the same machine (nginx/Apache). Needed for correct per-IP rate limits.
  TRUST_PROXY: process.env.TRUST_PROXY || 'loopback',

  // Show raw DB/stack error text in API responses (debug only).
  EXPOSE_ERRORS: process.env.EXPOSE_ERRORS === 'true',

  // Create recommended DB indexes on startup (safe, idempotent, non-destructive).
  AUTO_DB_INDEXES: process.env.AUTO_DB_INDEXES !== 'false',

  // Rate limits
  LOGIN_MAX_ATTEMPTS: Number(process.env.LOGIN_MAX_ATTEMPTS || 10), // per 15 min per IP+username
  API_MAX_PER_MINUTE: Number(process.env.API_MAX_PER_MINUTE || 1500), // per IP

  DB_POOL_MAX: Number(process.env.DB_POOL_MAX || 10),
};
