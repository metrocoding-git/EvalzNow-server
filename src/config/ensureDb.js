/**
 * Startup database housekeeping (safe + idempotent):
 *  1. Creates the small `auth_revocations` table if it does not exist.
 *  2. Adds composite indexes that match how the analytics/report queries filter
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
  if (env.AUTO_DB_INDEXES) await ensureIndexes();
}

module.exports = { ensureDb, ensureIndexes };
