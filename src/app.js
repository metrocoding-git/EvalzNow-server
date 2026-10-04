const express = require('express');
const cors = require('cors');
const compression = require('compression');
const env = require('./config/env');
const routes = require('./routes');
const errorMiddleware = require('./middlewares/error.middleware');
const { securityHeaders, apiLimiter, hideErrorDetails } = require('./middlewares/security.middleware');

const app = express();

app.disable('x-powered-by');          // do not advertise the framework
app.set('trust proxy', env.TRUST_PROXY);
app.set('etag', 'strong');            // lets browsers reuse unchanged responses (304)

// Security headers
app.use(securityHeaders);

// CORS: only the EvalzNow front-end(s) may call the API from a browser
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header (server-to-server, curl, health checks)
    // are allowed; they still need a valid token for every protected route.
    if (!origin) return callback(null, true);
    if (env.CORS_ORIGINS.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600, // cache pre-flight for 10 min -> fewer OPTIONS round-trips
}));

// gzip compression: analytics/report JSON shrinks by 85-98% on the wire.
// (COMPRESSION=off disables it, e.g. if nginx already compresses responses.)
if (process.env.COMPRESSION !== 'off') app.use(compression({ threshold: 4096 })); // tiny responses are not worth compressing

// Body parsing with an explicit size cap (stops memory-exhaustion payloads)
app.use(express.json({ limit: '2mb' }));

app.use(hideErrorDetails);
app.use('/api/v1', apiLimiter, routes);

// Simple health check (no data)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Unknown routes
app.use((req, res) => res.status(404).json({ success: false, message: 'Not found' }));

app.use(errorMiddleware);

module.exports = app;
