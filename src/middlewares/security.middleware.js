const helmet = require('helmet');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const env = require('../config/env');

/** Standard security headers for a JSON API. */
exports.securityHeaders = helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: env.IS_PROD ? { maxAge: 31536000, includeSubDomains: true } : false,
  referrerPolicy: { policy: 'no-referrer' },
});

/** Authenticated API responses must never be cached by browsers or proxies. */
exports.noStore = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  next();
};

const limitMessage = (msg) => ({ message: msg });

/** Brute-force protection for login: per IP + username. */
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_MAX_ATTEMPTS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only failed attempts count
  keyGenerator: (req) => `${ipKeyGenerator(req.ip || '')}|${String(req.body?.username || '').toLowerCase().slice(0, 100)}`,
  message: limitMessage('Too many failed login attempts. Please try again in 15 minutes.'),
});

/** Password recovery / reset: stops email flooding and token guessing. */
exports.recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: limitMessage('Too many requests. Please try again later.'),
});

/**
 * General API ceiling per IP (very generous; analytics pages make many calls).
 * A tiny fixed-window counter: same protection as a full rate-limit library but with
 * almost zero per-request cost, because it runs on every API call.
 */
exports.apiLimiter = (() => {
  const WINDOW = 60 * 1000;
  let windowStart = Date.now();
  let counts = new Map();
  return (req, res, next) => {
    const now = Date.now();
    if (now - windowStart >= WINDOW) { windowStart = now; counts = new Map(); }
    const key = req.ip || 'unknown';
    const n = (counts.get(key) || 0) + 1;
    counts.set(key, n);
    if (n > env.API_MAX_PER_MINUTE) {
      res.setHeader('Retry-After', Math.ceil((WINDOW - (now - windowStart)) / 1000));
      return res.status(429).json({ message: 'Too many requests. Please slow down.' });
    }
    return next();
  };
})();

/**
 * Hide internal error details (SQL text, stack messages) from API responses.
 * Controllers return `{ message, error: error.message }` on 500s; the UI only
 * uses `message`, so `error` is removed unless EXPOSE_ERRORS=true.
 */
exports.hideErrorDetails = (req, res, next) => {
  if (env.EXPOSE_ERRORS) return next();
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 500 && body && typeof body === 'object' && !Array.isArray(body)) {
      const { error, stack, sql, suggestion, ...safe } = body;
      if (!safe.message) safe.message = 'Internal Server Error';
      return json(safe);
    }
    return json(body);
  };
  next();
};
