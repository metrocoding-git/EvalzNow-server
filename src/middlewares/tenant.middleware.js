/**
 * Tenant isolation.
 *
 * Every client (company/school) must only ever see its own data. Before this
 * guard, any user could read or change another client's units, candidates,
 * scores, etc. just by changing an ID in the URL.
 *
 * Rules
 *  - super admin: unrestricted (platform owner; can switch between clients).
 *  - admin / staff: every clientId / unitId / candidateId / record id that
 *    appears in the URL, query string or request body must belong to their client.
 *
 * Only ownership is checked here - no controller logic or calculation is changed.
 */
const db = require('../models');
const { TTLCache } = require('../utils/authTokens');

// Ownership never changes for a given row, so it is safe to cache it.
const ownerCache = new TTLCache(10 * 60 * 1000, 20000);

// How to find the owning clientId for each model.
const VIA_SELF = new Set(['Client']);
const VIA_CLIENT_ID = new Set(['Unit', 'Candidate', 'Staff', 'Ethinicity', 'Income']);
const VIA_UNIT_ID = new Set([
  'AssessmentBlockManager', 'InsertScore', 'ScoringCriteria', 'Benchmark', 'UnitRoster',
  'CandidateMarks', 'CandidateNeedAssessment', 'UnitImprovement', 'LeaderMarks',
  'AssessmentChain', 'NeuroScienceSession', 'ProjectionSession', 'StaffLookup',
]);
const VIA_CANDIDATE_ID = new Set(['Irregularity']);

const toId = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** Returns the owning clientId, or undefined when the row does not exist. */
async function clientIdOf(model, rawId) {
  const id = toId(rawId);
  if (!id) return undefined;
  if (VIA_SELF.has(model)) return id;

  const key = `${model}:${id}`;
  const hit = ownerCache.get(key);
  if (hit !== undefined) return hit === null ? undefined : hit;

  let owner;
  const M = db[model];
  if (!M) return undefined;

  if (VIA_CLIENT_ID.has(model)) {
    const row = await M.findByPk(id, { attributes: ['clientId'], raw: true });
    owner = row ? row.clientId : undefined;
  } else if (VIA_UNIT_ID.has(model)) {
    const row = await M.findByPk(id, { attributes: ['unitId'], raw: true });
    owner = row ? await clientIdOf('Unit', row.unitId) : undefined;
  } else if (VIA_CANDIDATE_ID.has(model)) {
    const row = await M.findByPk(id, { attributes: ['candidateId'], raw: true });
    owner = row ? await clientIdOf('Candidate', row.candidateId) : undefined;
  }

  ownerCache.set(key, owner === undefined ? null : owner);
  return owner;
}

function deny(res) {
  return res.status(403).json({ message: 'Access denied: this record belongs to another organisation' });
}

/** Throws-free check used by all guards. Returns true when access is allowed. */
async function owns(user, model, rawIds) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  if (!user.clientId) return false;

  const ids = String(rawIds).split(',').map((s) => s.trim()).filter(Boolean);
  for (const id of ids) {
    if (model === 'Client') {
      if (toId(id) !== Number(user.clientId)) return false;
      continue;
    }
    const owner = await clientIdOf(model, id);
    // Unknown id: nothing to leak - let the controller answer (usually 404 / empty).
    if (owner !== undefined && Number(owner) !== Number(user.clientId)) return false;
  }
  return true;
}

/** Middleware: check req.params[param] belongs to the caller's client. */
const ownsParam = (param, model) => async (req, res, next) => {
  try {
    const v = req.params[param];
    if (v === undefined) return next();
    return (await owns(req.user, model, v)) ? next() : deny(res);
  } catch (e) { return next(e); }
};

/**
 * Register param guards on a router.
 * idModel = which model ":id" refers to in this router, or a function(req) => model name.
 */
function guardRouter(router, { idModel, sessionModel } = {}) {
  const reg = (name, model) => router.param(name, async (req, res, next, value) => {
    try { return (await owns(req.user, model, value)) ? next() : deny(res); } catch (e) { return next(e); }
  });
  reg('clientId', 'Client');
  reg('unitId', 'Unit');
  reg('candidateId', 'Candidate');
  reg('candidate_id', 'Candidate');
  reg('blockId', 'AssessmentBlockManager');
  // ":id" - strip a body.id that tries to change the primary key, then check ownership.
  router.param('id', async (req, res, next, value) => {
    try {
      const b = req.body;
      if ((req.method === 'PUT' || req.method === 'PATCH') && b && typeof b === 'object' && !Array.isArray(b)
          && 'id' in b && String(b.id) !== String(value)) {
        delete b.id;
      }
      const model = typeof idModel === 'function' ? idModel(req) : idModel;
      if (!model) return next();
      return (await owns(req.user, model, value)) ? next() : deny(res);
    } catch (e) { return next(e); }
  });
  if (sessionModel) reg('sessionId', sessionModel);
  return router;
}

// Keys in query strings / bodies that identify tenant-owned records.
const FIELD_MODELS = {
  clientId: 'Client',
  unitId: 'Unit',
  candidateId: 'Candidate',
  candidate_id: 'Candidate',
  assessmentBlockId: 'AssessmentBlockManager',
  staffId: null, // Staff.staffId is a text code in this schema; checked via Staff rows instead
};

async function checkObject(user, obj, ignore) {
  if (!obj || typeof obj !== 'object') return true;
  for (const [field, model] of Object.entries(FIELD_MODELS)) {
    if (!model || ignore.has(field)) continue;
    const v = obj[field];
    if (v === undefined || v === null || v === '' || typeof v === 'object') continue;
    if (!(await owns(user, model, v))) return false;
  }
  return true;
}

/**
 * Middleware factory: check ids passed in ?query and JSON body (objects or arrays).
 * `ignoreBody` lists body fields that are NOT foreign keys on that router
 * (e.g. Unit.unitId and Candidate.candidateId are human-readable codes).
 */
const tenantQueryBodyGuard = (ignoreBody = []) => async (req, res, next) => {
  const ignore = new Set(ignoreBody);
  const none = new Set();
  try {
    const user = req.user;
    if (!user || user.isSuperAdmin) return next();

    if (!(await checkObject(user, req.query, none))) return deny(res);

    const body = req.body;
    const items = Array.isArray(body) ? body : [body];
    for (const item of items.slice(0, 5000)) {
      if (!(await checkObject(user, item, ignore))) return deny(res);
    }

    // Bulk payloads that wrap records, e.g. { candidatePpList: [{ candidateId }] }
    if (body && Array.isArray(body.candidatePpList)) {
      for (const item of body.candidatePpList.slice(0, 5000)) {
        if (!(await checkObject(user, item, none))) return deny(res);
      }
    }
    return next();
  } catch (e) { return next(e); }
};

/** For list endpoints that return every tenant's rows: super admin only. */
function superAdminOnly(req, res, next) {
  if (req.user && req.user.isSuperAdmin) return next();
  return res.status(403).json({ message: 'You do not have permission for this action' });
}

function clearOwnerCache() { ownerCache.clear(); }

module.exports = { guardRouter, ownsParam, owns, clientIdOf, tenantQueryBodyGuard, superAdminOnly, clearOwnerCache };
