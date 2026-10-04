const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASS, {
  host: env.DB_HOST,
  dialect: 'mysql',
  logging: false,
  // Connection pool: the default (max 5) made concurrent report requests queue up.
  pool: {
    max: env.DB_POOL_MAX,
    min: 2,
    acquire: 60000,
    idle: 10000,
    evict: 10000,
  },
  dialectOptions: {
    connectTimeout: 20000,
  },
  benchmark: false,
});

module.exports = sequelize;
