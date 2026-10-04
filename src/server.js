const app = require('./app');
const db = require('./models');
const { PORT } = require('./config/env');
const { ensureDb } = require('./config/ensureDb');
const { startRevocationCleanup } = require('./utils/authTokens');

db.sequelize.authenticate()
  .then(async () => {
    console.log('✅ Database connected');
    await ensureDb();
    startRevocationCleanup();
  })
  .catch(err => console.error('❌ DB connection failed:', err.message));

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Keep-alive slightly above typical proxy timeouts so connections are reused
server.keepAliveTimeout = 65 * 1000;
server.headersTimeout = 66 * 1000;
// Large report requests can take a while; protect against slow-loris style clients
server.requestTimeout = 5 * 60 * 1000;

// Graceful shutdown
const shutdown = () => {
  server.close(() => db.sequelize.close().finally(() => process.exit(0)));
  setTimeout(() => process.exit(0), 10000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
