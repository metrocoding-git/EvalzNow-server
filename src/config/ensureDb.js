/**
 * Startup database housekeeping (safe + idempotent):
 *  1. Creates the small `auth_revocations` table if it does not exist.
 *  2. Adds new nullable columns that newer releases need (e.g. Unit.frameworkAge) and
 *     creates new tables (e.g. effectivity_responses) when they are missing.
 *  3. Adds composite indexes that match how the analytics/report queries filter
 *     (unitId + candidate + ppId ...). Existing tables/columns/data are never changed;
 *     an index is only created when no index with the same leading columns exists.
 *
 * Disable with AUTO_DB_INDEXES=false (e.g. if you prefer to run DDL manually).
 */
const db = require('../models');
const env = require('./env');

// [Model, [columns...]]
const INDEXES = [
  ['InsertScore', ['unitId', 'candidate_id', 'ppId', 'criticalRefDate']],
  ['InsertScore', ['assessmentBlockId']],
  ['AssessmentBlockManager', ['unitId', 'candidate_id', 'ppId']],
  ['UnitRoster', ['unitId', 'candidateId']],
  ['CandidateMarks', ['unitId', 'candidateId']],
  ['CandidateNeedAssessment', ['unitId', 'candidateId']],
  ['LeaderMarks', ['unitId']],
  ['UnitImprovement', ['unitId']],
  ['AssessmentChain', ['unitId', 'candidateId']],
  ['NeuroScienceSession', ['unitId', 'candidateId']],
  ['ProjectionSession', ['unitId', 'candidateId']],
  ['ScoringCriteria', ['unitId']],
  ['Benchmark', ['unitId']],
  ['StaffLookup', ['unitId']],
  ['Unit', ['clientId']],
  ['Candidate', ['clientId']],
  ['Staff', ['clientId']],
  ['Staff', ['emailAddress']],   // used on every login / token check
  ['Client', ['emailAddress']],  // used on every login / token check
  ['Ethinicity', ['clientId']],
  ['Income', ['clientId']],
];

// [Model, attribute] – nullable columns added in later releases. Added only when missing.
const NEW_COLUMNS = [
  ['Unit', 'frameworkAge'],
];

// Models whose tables are created (CREATE TABLE IF NOT EXISTS) when missing.
// Capsule tables: parents first (foreign keys).
const NEW_TABLES = ['EffectivityResponse', ...require('../models/capsule.models').TABLE_ORDER];

async function ensureColumns() {
  const qi = db.sequelize.getQueryInterface();
  for (const [modelName, attr] of NEW_COLUMNS) {
    const M = db[modelName];
    if (!M || !M.rawAttributes[attr]) continue;
    const tableName = M.getTableName();
    try {
      const desc = await qi.describeTable(tableName);
      const field = M.rawAttributes[attr].field || attr;
      if (desc[field]) continue;
      const { type } = M.rawAttributes[attr];
      await qi.addColumn(tableName, field, { type, allowNull: true });
      console.log(`[db] added column ${field} to ${typeof tableName === 'string' ? tableName : tableName.tableName}`);
    } catch (e) {
      console.warn(`[db] column ${modelName}.${attr} skipped: ${e.message}`);
    }
  }
}

async function ensureTables() {
  for (const modelName of NEW_TABLES) {
    const M = db[modelName];
    if (!M) continue;
    try {
      await M.sync(); // CREATE TABLE IF NOT EXISTS only – never alters/drops
    } catch (e) {
      console.warn(`[db] table for ${modelName} skipped: ${e.message}`);
    }
  }
}

async function existingIndexLeads(table) {
  const [rows] = await db.sequelize.query(`SHOW INDEX FROM \`${table}\``);
  const byName = {};
  rows.forEach((r) => {
    (byName[r.Key_name] = byName[r.Key_name] || [])[r.Seq_in_index - 1] = r.Column_name;
  });
  return Object.values(byName);
}

async function ensureIndexes() {
  let created = 0;
  for (const [modelName, cols] of INDEXES) {
    const M = db[modelName];
    if (!M) continue;
    const tableName = M.getTableName();
    const table = typeof tableName === 'string' ? tableName : tableName.tableName;
    try {
      const attrs = M.rawAttributes;
      const fields = cols.map((c) => (attrs[c] && attrs[c].field) || c);
      const existing = await existingIndexLeads(table);
      const covered = existing.some((idx) => fields.every((f, i) => idx[i] === f));
      if (covered) continue;
      const name = `idx_evz_${fields.join('_')}`.slice(0, 64);
      await db.sequelize.query(`CREATE INDEX \`${name}\` ON \`${table}\` (${fields.map((f) => `\`${f}\``).join(', ')})`);
      created++;
      console.log(`[db] created index ${name} on ${table}`);
    } catch (e) {
      // Table may not exist in this installation, or user lacks INDEX privilege - never fatal.
      console.warn(`[db] index on ${table}(${cols.join(',')}) skipped: ${e.message}`);
    }
  }
  return created;
}

async function ensureDb() {
  try {
    await db.AuthRevocation.sync(); // CREATE TABLE IF NOT EXISTS only
  } catch (e) {
    console.error('[db] could not create auth_revocations table:', e.message);
  }
  await ensureColumns();
  await ensureTables();
  if (env.AUTO_DB_INDEXES) await ensureIndexes();
}

module.exports = { ensureDb, ensureIndexes };
