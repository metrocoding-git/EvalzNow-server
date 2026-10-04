/**
 * Creates one row of any model, filling required columns with dummy values.
 * Used by the security tests to place one record of every type inside a tenant.
 */
const db = require('../../src/models');

function dummyFor(attr) {
  const t = attr.type && attr.type.key;
  switch (t) {
    case 'INTEGER': case 'BIGINT': case 'SMALLINT': case 'TINYINT': case 'FLOAT': case 'DOUBLE': case 'DECIMAL': case 'REAL':
      return 1;
    case 'BOOLEAN': return false;
    case 'DATE': return new Date();
    case 'DATEONLY': return '2025-01-01';
    case 'ENUM': return attr.values[0];
    case 'JSON': return {};
    case 'TEXT': case 'STRING': case 'CHAR': default:
      return 'x';
  }
}

async function makeRow(modelName, values = {}) {
  const M = db[modelName];
  const data = { ...values };
  for (const [name, attr] of Object.entries(M.rawAttributes)) {
    if (attr.primaryKey && attr.autoIncrement) continue;
    if (name in data) continue;
    if (attr.allowNull === false && attr.defaultValue === undefined) data[name] = dummyFor(attr);
  }
  // dummy foreign keys (e.g. staffLookupId=1) may not exist - relax FK checks for this insert only
  return db.sequelize.transaction(async (transaction) => {
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });
    const row = await M.create(data, { validate: false, hooks: false, transaction });
    await db.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    return row;
  });
}

module.exports = { makeRow };
