/**
 * Capsule (Capacity Accounting) API.
 *
 * Keeps all capsule data the Capsule screens use: capsules (+ staff, benchmarks, thresholds), roster,
 * assessment blocks, Insert Scores for Capacity Accounting, clinical marker names, projection sessions,
 * effectivity objects and Auxiliary Resultants records.
 * The capacity metrics (PC1/PC2/PC3, growth, effectivity parameters …) are calculated from this data by
 * the web app, exactly as in the UI phase, so every response keeps the UI-phase shape.
 *
 * Tenant isolation: every capsule belongs to one client. Admin / staff users can only reach capsules
 * (and rows of capsules) of their own client; candidates must belong to the capsule's client and be on
 * its roster before scores / blocks / effectivity / projections / auxiliary rows can be saved for them.
 */
const db = require('../models');
const { owns } = require('../middlewares/tenant.middleware');

const {
  sequelize, Capsule, CapsuleStaff, CapsuleBenchmark, CapsuleRoster, CapsuleBlock, CapsuleScore,
  CapsuleMarkerName, CapsuleProjection, CapsuleEffectivity, CapsuleAuxRecord, Candidate, Staff,
} = db;

// ---------------------------------------------------------------------------
// Constants (same lists as the web capsule config)
// ---------------------------------------------------------------------------
const CAPSULE_TYPES = ['Capacity - Combined', 'Capacity - Isolated'];
const CAPSULE_OUTCOMES = ['Ongoing', 'Pass', 'Fail', 'Under Observation', 'Under Exploration', 'In Trial'];
const MANAGE_TYPES = ['Direct', 'Indirect'];
const AUX_KINDS = ['candidateMarks', 'needAssessments', 'improvements', 'chains', 'leaderMarks'];
const AUX_KINDS_WITH_CANDIDATE = new Set(['candidateMarks', 'needAssessments', 'chains']);
const FIRST_CUSTOM_MARKER = 89;
const LAST_MARKER = 100;
const MARKER_NAME_MAX = 30;

const EFFECTIVITY_FIELDS = ['effectivityType', 'effectivityGap', 'effectivitySegment', 'effectivityContext', 'effectivityPurpose'];
// Same drop-down values as utils/effectivity.js (unit effectivity)
const { EFFECTIVITY_OPTIONS } = require('../utils/effectivity');

const CAPSULE_CORE = ['capsuleName', 'capsuleId', 'capsuleStartDate', 'capsuleEndDate', 'capsuleDirector', 'capsuleType',
  'signatureProfile', 'environment', 'frameworkAge'];
const BLOCK_CORE = ['manageType', 'periodType', 'shortDescription', 'delivery'];
const SCORE_CORE = ['capacity', 'criticalRefDate', 'durationDays', 'attainedScore', 'maxScore'];
const ROSTER_FIELDS = ['capsuleOutcome', 'ageRange', 'presentCount', 'excusedAbsences', 'unexcusedAbsences', 'excusedTardies', 'unexcusedTardies'];
// Never stored in the JSON part of a row (keys / relations / timestamps)
const RESERVED = new Set(['id', 'createdAt', 'updatedAt', 'clientId', 'capsuleId', 'unitId', 'candidateId', 'candidate_id',
  'blockId', 'ppId', 'staffLookup', 'staffAssignments', 'benchmarks', 'kind', 'data', 'settings', 'unit', 'capsule', 'candidate']);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const bad = (m) => new HttpError(400, m);
const notFound = (m) => new HttpError(404, m);
const forbidden = () => new HttpError(403, 'Access denied: this record belongs to another organisation');

const handle = (fn) => async (req, res) => {
  try {
    const out = await fn(req, res);
    if (!res.headersSent) res.status(out && out.__status ? out.__status : 200).json(out && out.__status ? out.body : out);
  } catch (e) {
    if (e instanceof HttpError) return res.status(e.status).json({ message: e.message });
    if (e && e.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'This record already exists' });
    if (e && (e.name === 'SequelizeValidationError' || e.name === 'SequelizeDatabaseError')) {
      return res.status(400).json({ message: 'Invalid data' });
    }
    console.error('[capsule]', e);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
const created = (body) => ({ __status: 201, body });

const toId = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const toInt = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};
const toNum = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toDate = (v) => {
  if (v === undefined || v === null || v === '') return null;
  const s = String(v).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};
const str = (v, max) => (v === undefined || v === null ? null : String(v).slice(0, max));

/** Fields of `payload` that are not core columns → JSON part of the row. */
function extras(payload, core) {
  const skip = new Set(core);
  const out = {};
  Object.entries(payload || {}).forEach(([k, v]) => {
    if (skip.has(k) || RESERVED.has(k) || typeof v === 'function') return;
    out[k] = v;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Ownership
// ---------------------------------------------------------------------------
async function canClient(user, clientId) {
  if (!user) return false;
  if (user.isSuperAdmin) return true;
  return Number(user.clientId) === Number(clientId);
}

/** The capsule (plain) when the caller may use it; throws 404 / 403 otherwise. */
async function ownedCapsule(req, rawId) {
  const id = toId(rawId);
  if (!id) throw notFound('Capsule not found');
  const capsule = await Capsule.findByPk(id);
  if (!capsule) throw notFound('Capsule not found');
  if (!(await canClient(req.user, capsule.clientId))) throw forbidden();
  return capsule;
}

/** A row of a capsule child table when the caller may use its capsule. */
async function ownedRow(req, Model, rawId, label) {
  const id = toId(rawId);
  const row = id ? await Model.findByPk(id) : null;
  if (!row) throw notFound(`${label} not found`);
  const capsule = await ownedCapsule(req, row.capsuleId);
  return { row, capsule };
}

/** Candidate must exist in the capsule's client (and the caller must own it). */
async function candidateOfClient(req, rawId, clientId) {
  const id = toId(rawId);
  if (!id) throw bad('A valid candidate is required');
  if (!(await owns(req.user, 'Candidate', id))) throw forbidden();
  const cand = await Candidate.findByPk(id, { attributes: ['id', 'clientId'] });
  if (!cand) throw bad('Candidate not found');
  if (Number(cand.clientId) !== Number(clientId)) throw bad('The candidate does not belong to this capsule\'s organisation');
  return id;
}

/** Candidate must be on the capsule roster. */
async function rosterCandidate(capsule, rawId) {
  const id = toId(rawId);
  if (!id) throw bad('A valid candidate is required');
  const onRoster = await CapsuleRoster.findOne({ where: { capsuleId: capsule.id, candidateId: id }, attributes: ['id'] });
  if (!onRoster) throw bad('The candidate is not on this capsule roster');
  return id;
}

// ---------------------------------------------------------------------------
// Serializers (UI-phase shapes)
// ---------------------------------------------------------------------------
const plain = (r) => (r && typeof r.get === 'function' ? r.get({ plain: true }) : r);

function capsuleOut(c) {
  const p = plain(c);
  const out = { ...(c.settings || {}) };
  ['id', 'clientId', ...CAPSULE_CORE, 'createdAt', 'updatedAt'].forEach((k) => { out[k] = p[k] ?? (k === 'capsuleDirector' ? '' : p[k]); });
  out.staffAssignments = (p.staffAssignments || []).map((s) => ({
    id: s.id, roleType: s.roleType, staffId: s.staffId, staff: s.staff ? { ...s.staff, id: s.staffId } : { id: s.staffId },
  }));
  out.benchmarks = (p.benchmarks || [])
    .sort((a, b) => a.id - b.id)
    .map((b) => ({ id: b.id, benchmarkId: b.benchmarkId, benchmarkType: b.benchmarkType || '', benchmarkRef: b.benchmarkRef || '', benchmarkDescription: b.benchmarkDescription || '' }));
  return out;
}

const STAFF_ATTRS = ['id', 'firstName', 'lastName', 'staffId', 'emailAddress'];
const capsuleIncludes = () => [
  { model: CapsuleStaff, as: 'staffAssignments', include: [{ model: Staff, as: 'staff', attributes: STAFF_ATTRS, required: false }] },
  { model: CapsuleBenchmark, as: 'benchmarks' },
];

const CANDIDATE_ATTRS = { exclude: ['password'] };
const rosterOut = (r) => {
  const p = plain(r);
  return { ...p, candidate: p.candidate || null };
};
const blockOut = (b) => {
  const p = plain(b);
  return { ...(b.data || {}), id: p.id, capsuleId: p.capsuleId, candidate_id: p.candidate_id, manageType: p.manageType,
    ppId: p.ppId, periodType: p.periodType, shortDescription: p.shortDescription, delivery: p.delivery,
    createdAt: p.createdAt, updatedAt: p.updatedAt };
};
const scoreOut = (s) => {
  const p = plain(s);
  return { ...(s.data || {}), id: p.id, capsuleId: p.capsuleId, candidate_id: p.candidate_id, blockId: p.blockId, ppId: p.ppId,
    capacity: p.capacity, criticalRefDate: p.criticalRefDate, durationDays: p.durationDays, attainedScore: p.attainedScore,
    maxScore: p.maxScore, candidate: p.candidate || (s.data || {}).candidate || null, createdAt: p.createdAt, updatedAt: p.updatedAt };
};
// Candidate of a score (same small record the UI-phase scores carried)
const scoreInclude = () => [{ model: Candidate, as: 'candidate', attributes: ['id', 'firstName', 'lastName', 'candidateId', 'startDate'] }];
const projectionOut = (s) => {
  const p = plain(s);
  return { id: p.id, capsuleId: p.capsuleId, candidateId: p.candidateId, points: Array.isArray(s.points) ? s.points : [], createdAt: p.createdAt };
};
const effectivityOut = (e) => plain(e);
const auxOut = (a) => {
  const p = plain(a);
  return { ...(a.data || {}), id: p.id, unitId: p.capsuleId, capsuleId: p.capsuleId, candidateId: p.candidateId,
    createdAt: p.createdAt, updatedAt: p.updatedAt };
};

/** -1, -2, … (indirect) first, then 1, 2, …; same PP ID → date, then id. */
function sortScores(rows) {
  return [...rows].sort((a, b) => {
    const pa = Number(a.ppId), pb = Number(b.ppId);
    if ((pa < 0) !== (pb < 0)) return pa < 0 ? -1 : 1;
    if (pa !== pb) return Math.abs(pa) - Math.abs(pb);
    return String(a.criticalRefDate).localeCompare(String(b.criticalRefDate)) || a.id - b.id;
  });
}

// ---------------------------------------------------------------------------
// Capsules
// ---------------------------------------------------------------------------
function capsuleCore(body, existing = {}) {
  const out = {};
  const pick = (k, fn) => { if (body[k] !== undefined) out[k] = fn(body[k]); };
  pick('capsuleName', (v) => str(v, 150));
  pick('capsuleId', (v) => str(v, 60));
  pick('capsuleStartDate', toDate);
  pick('capsuleEndDate', toDate);
  pick('capsuleDirector', (v) => str(v, 150));
  pick('capsuleType', (v) => str(v, 40));
  pick('signatureProfile', (v) => str(v, 80));
  pick('environment', (v) => str(v, 80));
  pick('frameworkAge', (v) => str(v, 40));
  const merged = { ...existing, ...out };
  if (!merged.capsuleName || !String(merged.capsuleName).trim()) throw bad('Capsule Name is required');
  if (!merged.capsuleId || !String(merged.capsuleId).trim()) throw bad('Capsule ID is required');
  if (!CAPSULE_TYPES.includes(merged.capsuleType)) throw bad('Capsule Type must be "Capacity - Combined" or "Capacity - Isolated"');
  if (!merged.frameworkAge) throw bad('Framework Age is required');
  return out;
}

async function assertUniqueCode(clientId, code, ignoreId = null) {
  const rows = await Capsule.findAll({ where: { clientId }, attributes: ['id', 'capsuleId'] });
  const clash = rows.find((r) => String(r.capsuleId).toLowerCase() === String(code).toLowerCase() && r.id !== ignoreId);
  if (clash) throw new HttpError(409, `A capsule with ID "${code}" already exists.`);
}

async function staffOfClient(staffLookup, clientId) {
  const list = (Array.isArray(staffLookup) ? staffLookup : [])
    .map((s) => ({ staffId: toId(s && (s.staffId ?? s.staff?.id)), roleType: str(s && s.roleType, 30) }))
    .filter((s) => s.staffId && s.roleType);
  if (!list.length) return list;
  const ids = [...new Set(list.map((s) => s.staffId))];
  const found = await Staff.findAll({ where: { id: ids }, attributes: ['id', 'clientId'] });
  if (found.length !== ids.length || found.some((s) => Number(s.clientId) !== Number(clientId))) {
    throw bad('Leaders / assessors must be staff of the same organisation');
  }
  return list;
}

const benchmarkRows = (benchmarks) => (Array.isArray(benchmarks) ? benchmarks : []).map((b, i) => ({
  benchmarkId: str(b.benchmarkId ?? i + 1, 20),
  benchmarkType: str(b.benchmarkType || '', 80),
  benchmarkRef: str(b.benchmarkRef || '', 80),
  benchmarkDescription: b.benchmarkDescription ? String(b.benchmarkDescription).slice(0, 5000) : '',
}));

async function loadCapsuleFull(id, transaction) {
  return Capsule.findByPk(id, { include: capsuleIncludes(), transaction });
}

exports.getCapsulesByClient = handle(async (req) => {
  const clientId = toId(req.params.clientId);
  if (!clientId) throw bad('clientId is required');
  if (!(await canClient(req.user, clientId))) throw forbidden();
  const rows = await Capsule.findAll({ where: { clientId }, include: capsuleIncludes(), order: [['id', 'ASC']] });
  return rows.map(capsuleOut);
});

exports.getCapsuleById = handle(async (req) => {
  const c = await ownedCapsule(req, req.params.id);
  return capsuleOut(await loadCapsuleFull(c.id));
});

exports.createCapsule = handle(async (req) => {
  const body = req.body || {};
  const clientId = req.user.isSuperAdmin ? toId(body.clientId) : toId(req.user.clientId);
  if (!clientId) throw bad('clientId is required');
  if (!(await canClient(req.user, clientId))) throw forbidden();
  const core = capsuleCore(body);
  await assertUniqueCode(clientId, core.capsuleId);
  const staff = await staffOfClient(body.staffLookup, clientId);
  const id = await sequelize.transaction(async (t) => {
    const c = await Capsule.create({ ...core, clientId, settings: extras(body, CAPSULE_CORE) }, { transaction: t });
    if (staff.length) await CapsuleStaff.bulkCreate(staff.map((s) => ({ ...s, capsuleId: c.id })), { transaction: t });
    const bms = benchmarkRows(body.benchmarks);
    if (bms.length) await CapsuleBenchmark.bulkCreate(bms.map((b) => ({ ...b, capsuleId: c.id })), { transaction: t });
    return c.id;
  });
  return created(capsuleOut(await loadCapsuleFull(id)));
});

exports.updateCapsule = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const body = req.body || {};
  const core = capsuleCore(body, plain(capsule));
  if (core.capsuleId) await assertUniqueCode(capsule.clientId, core.capsuleId, capsule.id);
  const staff = Array.isArray(body.staffLookup) ? await staffOfClient(body.staffLookup, capsule.clientId) : null;
  await sequelize.transaction(async (t) => {
    const settings = { ...(capsule.settings || {}), ...extras(body, CAPSULE_CORE) };
    await capsule.update({ ...core, settings }, { transaction: t });
    if (staff) {
      await CapsuleStaff.destroy({ where: { capsuleId: capsule.id }, transaction: t });
      if (staff.length) await CapsuleStaff.bulkCreate(staff.map((s) => ({ ...s, capsuleId: capsule.id })), { transaction: t });
    }
    if (Array.isArray(body.benchmarks)) {
      await CapsuleBenchmark.destroy({ where: { capsuleId: capsule.id }, transaction: t });
      const bms = benchmarkRows(body.benchmarks);
      if (bms.length) await CapsuleBenchmark.bulkCreate(bms.map((b) => ({ ...b, capsuleId: capsule.id })), { transaction: t });
    }
  });
  return capsuleOut(await loadCapsuleFull(capsule.id));
});

/** Removes the capsule and everything recorded for it. */
exports.deleteCapsule = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  await sequelize.transaction(async (t) => {
    const where = { capsuleId: capsule.id };
    for (const M of [CapsuleScore, CapsuleBlock, CapsuleAuxRecord, CapsuleEffectivity, CapsuleProjection,
      CapsuleMarkerName, CapsuleRoster, CapsuleBenchmark, CapsuleStaff]) {
      await M.destroy({ where, transaction: t });
    }
    await capsule.destroy({ transaction: t });
  });
  return { message: 'Capsule deleted' };
});

// ---------------------------------------------------------------------------
// Roster
// ---------------------------------------------------------------------------
const rosterInclude = () => [{ model: Candidate, as: 'candidate', attributes: CANDIDATE_ATTRS }];

function rosterFields(body, partial) {
  const out = {};
  if (body.capsuleOutcome !== undefined || !partial) {
    const v = body.capsuleOutcome ?? 'Ongoing';
    if (!CAPSULE_OUTCOMES.includes(v)) throw bad('Unknown Capsule Outcome');
    out.capsuleOutcome = v;
  }
  if (body.ageRange !== undefined || !partial) out.ageRange = str(body.ageRange ?? 'Unknown', 40);
  ['presentCount', 'excusedAbsences', 'unexcusedAbsences', 'excusedTardies', 'unexcusedTardies'].forEach((k) => {
    if (body[k] === undefined && partial) return;
    const n = toInt(body[k] ?? 0);
    if (n === null || n < 0) throw bad(`${k} must be a whole number ≥ 0`);
    out[k] = n;
  });
  return out;
}

exports.getRosterByClient = handle(async (req) => {
  const clientId = toId(req.params.clientId);
  if (!clientId) throw bad('clientId is required');
  if (!(await canClient(req.user, clientId))) throw forbidden();
  const rows = await CapsuleRoster.findAll({
    include: [...rosterInclude(), { model: Capsule, as: 'capsule', attributes: [], where: { clientId } }],
    order: [['id', 'ASC']],
  });
  return rows.map(rosterOut);
});

exports.getRosterByCapsule = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const rows = await CapsuleRoster.findAll({ where: { capsuleId: capsule.id }, include: rosterInclude(), order: [['id', 'ASC']] });
  return rows.map(rosterOut);
});

/** Connected capsules of a candidate (Candidate tab → Review). */
exports.getCapsulesByCandidate = handle(async (req) => {
  const candidateId = toId(req.params.candidateId);
  if (!candidateId) throw bad('candidateId is required');
  const rows = await CapsuleRoster.findAll({
    where: { candidateId },
    include: [{ model: Capsule, as: 'capsule', attributes: ['id', 'capsuleId', 'capsuleName', 'clientId'] }],
    order: [['id', 'ASC']],
  });
  const out = [];
  for (const r of rows) {
    if (!r.capsule || !(await canClient(req.user, r.capsule.clientId))) continue;
    out.push({ id: r.capsule.id, capsuleId: r.capsule.capsuleId, capsuleName: r.capsule.capsuleName, status: r.capsuleOutcome || 'Ongoing' });
  }
  return out;
});

exports.createRoster = handle(async (req) => {
  const body = req.body || {};
  const capsule = await ownedCapsule(req, body.capsuleId);
  const candidateId = await candidateOfClient(req, body.candidateId, capsule.clientId);
  const exists = await CapsuleRoster.findOne({ where: { capsuleId: capsule.id, candidateId } });
  if (exists) throw new HttpError(409, 'The candidate is already on this capsule roster');
  const row = await CapsuleRoster.create({ capsuleId: capsule.id, candidateId, ...rosterFields(body, false) });
  return created(rosterOut(await CapsuleRoster.findByPk(row.id, { include: rosterInclude() })));
});

exports.updateRoster = handle(async (req) => {
  const { row } = await ownedRow(req, CapsuleRoster, req.params.rowId, 'Roster entry');
  await row.update(rosterFields(req.body || {}, true));
  return rosterOut(await CapsuleRoster.findByPk(row.id, { include: rosterInclude() }));
});

/** Removing a candidate from the roster removes everything recorded for that candidate in the capsule. */
exports.deleteRoster = handle(async (req) => {
  const { row } = await ownedRow(req, CapsuleRoster, req.params.rowId, 'Roster entry');
  await sequelize.transaction(async (t) => {
    const cap = row.capsuleId;
    const cand = row.candidateId;
    await CapsuleScore.destroy({ where: { capsuleId: cap, candidate_id: cand }, transaction: t });
    await CapsuleBlock.destroy({ where: { capsuleId: cap, candidate_id: cand }, transaction: t });
    await CapsuleAuxRecord.destroy({ where: { capsuleId: cap, candidateId: cand }, transaction: t });
    await CapsuleEffectivity.destroy({ where: { capsuleId: cap, candidateId: cand }, transaction: t });
    await CapsuleProjection.destroy({ where: { capsuleId: cap, candidateId: cand }, transaction: t });
    await row.destroy({ transaction: t });
  });
  return { message: 'Roster entry deleted' };
});

// ---------------------------------------------------------------------------
// Assessment blocks (Indirect -1, -2, … / Direct 1, 2, …)
// ---------------------------------------------------------------------------
exports.getBlocks = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const candidateId = toId(req.params.candidateId);
  const rows = await CapsuleBlock.findAll({ where: { capsuleId: capsule.id, candidate_id: candidateId }, order: [['id', 'ASC']] });
  return rows.map(blockOut);
});

exports.createBlock = handle(async (req) => {
  const body = req.body || {};
  const capsule = await ownedCapsule(req, body.capsuleId);
  const candidateId = await rosterCandidate(capsule, body.candidate_id ?? body.candidateId);
  if (!MANAGE_TYPES.includes(body.manageType)) throw bad('manageType must be "Direct" or "Indirect"');
  const id = await sequelize.transaction(async (t) => {
    const count = await CapsuleBlock.count({ where: { capsuleId: capsule.id, candidate_id: candidateId, manageType: body.manageType }, transaction: t });
    const ppId = body.manageType === 'Indirect' ? -(count + 1) : count + 1;
    const b = await CapsuleBlock.create({
      capsuleId: capsule.id, candidate_id: candidateId, manageType: body.manageType, ppId,
      periodType: str(body.periodType, 60), shortDescription: str(body.shortDescription, 255), delivery: str(body.delivery, 120),
      data: extras(body, BLOCK_CORE),
    }, { transaction: t });
    return b.id;
  });
  return created(blockOut(await CapsuleBlock.findByPk(id)));
});

/** Edit / Move Up-Down (the swap sends the new PP ID). Scores of the block follow its PP ID. */
exports.updateBlock = handle(async (req) => {
  const { row } = await ownedRow(req, CapsuleBlock, req.params.rowId, 'Assessment block');
  const body = req.body || {};
  const patch = {};
  if (body.periodType !== undefined) patch.periodType = str(body.periodType, 60);
  if (body.shortDescription !== undefined) patch.shortDescription = str(body.shortDescription, 255);
  if (body.delivery !== undefined) patch.delivery = str(body.delivery, 120);
  if (body.ppId !== undefined) {
    const pp = toInt(body.ppId);
    if (pp === null || pp === 0 || (row.manageType === 'Indirect') !== (pp < 0)) throw bad('Invalid PP ID for this block');
    patch.ppId = pp;
  }
  const more = extras(body, BLOCK_CORE);
  if (Object.keys(more).length) patch.data = { ...(row.data || {}), ...more };
  await sequelize.transaction(async (t) => {
    await row.update(patch, { transaction: t });
    if (patch.ppId !== undefined) await CapsuleScore.update({ ppId: patch.ppId }, { where: { blockId: row.id }, transaction: t });
  });
  return blockOut(await CapsuleBlock.findByPk(row.id));
});

/** Delete + renumber the remaining PP IDs of that candidate / tab (no gaps), scores follow. */
exports.deleteBlock = handle(async (req) => {
  const { row } = await ownedRow(req, CapsuleBlock, req.params.rowId, 'Assessment block');
  await sequelize.transaction(async (t) => {
    await CapsuleScore.destroy({ where: { blockId: row.id }, transaction: t });
    await row.destroy({ transaction: t });
    const sign = row.manageType === 'Indirect' ? -1 : 1;
    const rest = await CapsuleBlock.findAll({
      where: { capsuleId: row.capsuleId, candidate_id: row.candidate_id, manageType: row.manageType }, transaction: t,
    });
    rest.sort((a, b) => Math.abs(a.ppId) - Math.abs(b.ppId));
    for (let i = 0; i < rest.length; i++) {
      const pp = sign * (i + 1);
      if (rest[i].ppId !== pp) {
        await rest[i].update({ ppId: pp }, { transaction: t });
        await CapsuleScore.update({ ppId: pp }, { where: { blockId: rest[i].id }, transaction: t });
      }
    }
  });
  return { message: 'Assessment block deleted' };
});

// ---------------------------------------------------------------------------
// Insert Scores for Capacity Accounting
// ---------------------------------------------------------------------------
exports.getScoresByCapsule = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  return sortScores((await CapsuleScore.findAll({ where: { capsuleId: capsule.id }, include: scoreInclude() })).map(scoreOut));
});

exports.getScoresByCandidate = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const candidateId = toId(req.params.candidateId);
  return sortScores((await CapsuleScore.findAll({ where: { capsuleId: capsule.id, candidate_id: candidateId }, include: scoreInclude() })).map(scoreOut));
});

/**
 * Allowed Critical Reference Date range for a PP ID: not before the latest date of the previous PP ID,
 * not after the earliest date of the next PP ID (same side).
 */
async function criticalRange(capsuleId, candidateId, ppId, ignoreScoreId) {
  const rows = await CapsuleScore.findAll({ where: { capsuleId, candidate_id: candidateId }, attributes: ['id', 'ppId', 'criticalRefDate'] });
  const id = Number(ppId);
  const sameSide = rows.filter((x) => String(x.id) !== String(ignoreScoreId) && Math.sign(Number(x.ppId)) === Math.sign(id) && x.criticalRefDate);
  const prev = sameSide.filter((x) => Math.abs(Number(x.ppId)) < Math.abs(id)).map((x) => x.criticalRefDate).sort();
  const next = sameSide.filter((x) => Math.abs(Number(x.ppId)) > Math.abs(id)).map((x) => x.criticalRefDate).sort();
  return { ppId: id, startDate: prev.length ? prev[prev.length - 1] : null, endDate: next.length ? next[0] : null };
}

exports.getCriticalRange = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const ppId = toInt(req.query.ppId);
  if (ppId === null) throw bad('ppId is required');
  return criticalRange(capsule.id, toId(req.params.candidateId), ppId, req.query.ignoreScoreId);
});

function scoreFields(body, partial) {
  const out = {};
  if (body.capacity !== undefined || !partial) {
    if (!body.capacity || !String(body.capacity).trim()) throw bad('Capacity is required');
    out.capacity = str(body.capacity, 80);
  }
  if (body.criticalRefDate !== undefined || !partial) {
    const d = toDate(body.criticalRefDate);
    if (!d) throw bad('Critical Reference Date is required (YYYY-MM-DD)');
    out.criticalRefDate = d;
  }
  ['durationDays', 'attainedScore', 'maxScore'].forEach((k) => {
    if (body[k] === undefined && partial) return;
    const n = toNum(body[k]);
    if (n === null || n < 0) throw bad(`${k} must be a number ≥ 0`);
    if (n === 0 && k !== 'attainedScore') throw bad(k === 'durationDays' ? 'Duration cannot be 0' : 'Maximum score must be greater than 0');
    out[k] = n;
  });
  const a = out.attainedScore;
  const m = out.maxScore;
  if (a !== undefined && m !== undefined && a > m) throw bad('Attained score cannot be above the maximum score');
  return out;
}

function checkRange(range, date) {
  if (!date) return;
  if (range.startDate && date < range.startDate) throw bad(`Critical Reference Date must be on or after ${range.startDate} for PP ID ${range.ppId}`);
  if (range.endDate && date > range.endDate) throw bad(`Critical Reference Date must be on or before ${range.endDate} for PP ID ${range.ppId}`);
}

exports.createScore = handle(async (req) => {
  const body = req.body || {};
  const capsule = await ownedCapsule(req, body.capsuleId);
  const candidateId = await rosterCandidate(capsule, body.candidate_id ?? body.candidateId);
  const block = await CapsuleBlock.findByPk(toId(body.blockId));
  if (!block || block.capsuleId !== capsule.id || block.candidate_id !== candidateId) throw bad('Assessment block not found');
  const fields = scoreFields(body, false);
  checkRange(await criticalRange(capsule.id, candidateId, block.ppId, null), fields.criticalRefDate);
  const row = await CapsuleScore.create({
    capsuleId: capsule.id, candidate_id: candidateId, blockId: block.id, ppId: block.ppId, ...fields,
    data: extras(body, SCORE_CORE),
  });
  return created(scoreOut(await CapsuleScore.findByPk(row.id, { include: scoreInclude() })));
});

/** Edit, or Move Up / Down (row takes the neighbour's block and date). */
exports.updateScore = handle(async (req) => {
  const { row, capsule } = await ownedRow(req, CapsuleScore, req.params.rowId, 'Score');
  const body = req.body || {};
  const patch = scoreFields(body, true);
  const merged = { attainedScore: row.attainedScore, maxScore: row.maxScore, ...patch };
  if (merged.attainedScore !== null && merged.maxScore !== null && merged.attainedScore > merged.maxScore) {
    throw bad('Attained score cannot be above the maximum score');
  }
  let ppId = row.ppId;
  if (body.blockId !== undefined && toId(body.blockId) !== row.blockId) {
    const block = await CapsuleBlock.findByPk(toId(body.blockId));
    if (!block || block.capsuleId !== capsule.id || block.candidate_id !== row.candidate_id) throw bad('Assessment block not found');
    patch.blockId = block.id;
    patch.ppId = block.ppId;
    ppId = block.ppId;
  }
  if (patch.criticalRefDate !== undefined || patch.blockId !== undefined) {
    checkRange(await criticalRange(capsule.id, row.candidate_id, ppId, row.id), patch.criticalRefDate ?? row.criticalRefDate);
  }
  const more = extras(body, SCORE_CORE);
  if (Object.keys(more).length) patch.data = { ...(row.data || {}), ...more };
  await row.update(patch);
  return scoreOut(await CapsuleScore.findByPk(row.id, { include: scoreInclude() }));
});

exports.deleteScore = handle(async (req) => {
  const { row } = await ownedRow(req, CapsuleScore, req.params.rowId, 'Score');
  await row.destroy();
  return { message: 'Score deleted' };
});

// ---------------------------------------------------------------------------
// Clinical marker names (CM89–CM100 custom criteria)
// ---------------------------------------------------------------------------
async function markerMap(capsuleId) {
  const rows = await CapsuleMarkerName.findAll({ where: { capsuleId } });
  return Object.fromEntries(rows.map((r) => [r.markerIndex, r.name]));
}

exports.getMarkerNames = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  return markerMap(capsule.id);
});

exports.updateMarkerName = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const index = toInt(req.params.index);
  if (index === null || index < FIRST_CUSTOM_MARKER || index > LAST_MARKER) {
    throw bad(`Only CM${FIRST_CUSTOM_MARKER}–CM${LAST_MARKER} can be renamed`);
  }
  const name = String((req.body || {}).name ?? '').slice(0, MARKER_NAME_MAX);
  const existing = await CapsuleMarkerName.findOne({ where: { capsuleId: capsule.id, markerIndex: index } });
  if (existing) await existing.update({ name });
  else await CapsuleMarkerName.create({ capsuleId: capsule.id, markerIndex: index, name });
  return markerMap(capsule.id);
});

// ---------------------------------------------------------------------------
// Projection Table sessions (Growth Metrics)
// ---------------------------------------------------------------------------
const MAX_POINTS = 500;
function cleanPoints(points) {
  if (!Array.isArray(points)) return [];
  if (points.length > MAX_POINTS) throw bad('Too many projection points');
  return points.filter((p) => p && typeof p === 'object' && !Array.isArray(p));
}

exports.getProjections = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const rows = await CapsuleProjection.findAll({
    where: { capsuleId: capsule.id, candidateId: toId(req.params.candidateId) }, order: [['id', 'DESC']],
  });
  return rows.map(projectionOut);
});

exports.createProjection = handle(async (req) => {
  const body = req.body || {};
  const capsule = await ownedCapsule(req, body.capsuleId ?? body.unitId);
  const candidateId = await rosterCandidate(capsule, body.candidateId);
  const row = await CapsuleProjection.create({ capsuleId: capsule.id, candidateId, points: cleanPoints(body.points) });
  return created({ session: projectionOut(row) });
});

exports.updateProjection = handle(async (req) => {
  const { row } = await ownedRow(req, CapsuleProjection, req.params.rowId, 'Projection session');
  await row.update({ points: cleanPoints((req.body || {}).points) });
  return { session: projectionOut(row) };
});

// ---------------------------------------------------------------------------
// Effectivity objects
// ---------------------------------------------------------------------------
function effectivityFields(body) {
  const out = {};
  EFFECTIVITY_FIELDS.forEach((f) => {
    if (body[f] === undefined) return; // partial save (inline drop-downs send one field)
    const v = body[f];
    out[f] = v && Array.isArray(EFFECTIVITY_OPTIONS[f]) && EFFECTIVITY_OPTIONS[f].includes(v) ? v : null;
  });
  return out;
}

exports.getEffectivity = handle(async (req) => {
  const capsule = await ownedCapsule(req, req.params.id);
  const where = { capsuleId: capsule.id };
  const ids = String(req.query.candidateIds || '').split(',').map(toId).filter(Boolean);
  if (ids.length) where.candidateId = ids;
  return (await CapsuleEffectivity.findAll({ where, order: [['id', 'ASC']] })).map(effectivityOut);
});

/** Create or update the effectivity object of a candidate's PP ID (payload.unitId = capsule id). */
exports.saveEffectivity = handle(async (req) => {
  const body = req.body || {};
  const capsule = await ownedCapsule(req, body.capsuleId ?? body.unitId);
  const candidateId = await rosterCandidate(capsule, body.candidateId);
  const ppId = toInt(body.ppId);
  if (ppId === null || ppId === 0) throw bad('ppId is required');
  const fields = effectivityFields(body);
  const existing = await CapsuleEffectivity.findOne({ where: { capsuleId: capsule.id, candidateId, ppId } });
  if (existing) {
    await existing.update(fields);
    return effectivityOut(existing);
  }
  return created(effectivityOut(await CapsuleEffectivity.create({ capsuleId: capsule.id, candidateId, ppId, ...fields })));
});

exports.deleteEffectivity = handle(async (req) => {
  const { row } = await ownedRow(req, CapsuleEffectivity, req.params.rowId, 'Effectivity object');
  await row.destroy();
  return { message: 'Effectivity object deleted' };
});

// ---------------------------------------------------------------------------
// Auxiliary Resultants records
// ---------------------------------------------------------------------------
function auxKind(raw) {
  if (!AUX_KINDS.includes(raw)) throw bad(`Unknown record kind (${AUX_KINDS.join(', ')})`);
  return raw;
}

// Auxiliary records keep all their own fields (ppId, selection1–5, staffLookupId …); only the keys are columns.
const AUX_RESERVED = new Set(['id', 'createdAt', 'updatedAt', 'unitId', 'capsuleId', 'candidateId', 'kind', 'data']);
function auxData(body) {
  const data = {};
  Object.entries(body || {}).forEach(([k, v]) => { if (!AUX_RESERVED.has(k) && typeof v !== 'function') data[k] = v; });
  if (JSON.stringify(data).length > 200000) throw bad('Record is too large');
  return data;
}

exports.getAuxRecords = handle(async (req) => {
  const kind = auxKind(req.params.kind);
  const capsule = await ownedCapsule(req, req.params.id);
  const where = { capsuleId: capsule.id, kind };
  if (req.query.candidateId !== undefined) where.candidateId = toId(req.query.candidateId);
  return (await CapsuleAuxRecord.findAll({ where, order: [['id', 'ASC']] })).map(auxOut);
});

exports.createAuxRecord = handle(async (req) => {
  const kind = auxKind(req.params.kind);
  const body = req.body || {};
  const capsule = await ownedCapsule(req, body.capsuleId ?? body.unitId);
  let candidateId = null;
  if (AUX_KINDS_WITH_CANDIDATE.has(kind) || (body.candidateId !== undefined && body.candidateId !== null)) {
    candidateId = await rosterCandidate(capsule, body.candidateId);
  }
  const row = await CapsuleAuxRecord.create({ kind, capsuleId: capsule.id, candidateId, data: auxData(body) });
  return created(auxOut(row));
});

exports.updateAuxRecord = handle(async (req) => {
  const kind = auxKind(req.params.kind);
  const { row, capsule } = await ownedRow(req, CapsuleAuxRecord, req.params.rowId, 'Record');
  if (row.kind !== kind) throw notFound('Record not found');
  const body = req.body || {};
  const patch = { data: { ...(row.data || {}), ...auxData(body) } };
  if (body.candidateId !== undefined && toId(body.candidateId) !== row.candidateId) {
    patch.candidateId = await rosterCandidate(capsule, body.candidateId);
  }
  await row.update(patch);
  return auxOut(row);
});

exports.deleteAuxRecord = handle(async (req) => {
  const kind = auxKind(req.params.kind);
  const { row } = await ownedRow(req, CapsuleAuxRecord, req.params.rowId, 'Record');
  if (row.kind !== kind) throw notFound('Record not found');
  await row.destroy();
  return { message: 'Record deleted' };
});

// ---------------------------------------------------------------------------
// Snapshot – all capsule data of a client in one response (same layout as the UI-phase browser store).
// Used by the cross-capsule screens (Clinical Analytics, Data Extractions, Data Reports, Audit Status)
// and the Auxiliary Resultants logic.
// ---------------------------------------------------------------------------
exports.getStore = handle(async (req) => {
  const clientId = toId(req.params.clientId);
  if (!clientId) throw bad('clientId is required');
  if (!(await canClient(req.user, clientId))) throw forbidden();
  const capsules = await Capsule.findAll({ where: { clientId }, include: capsuleIncludes(), order: [['id', 'ASC']] });
  const ids = capsules.map((c) => c.id);
  const where = { capsuleId: ids };
  const none = !ids.length;
  const all = async (M, opts = {}) => (none ? [] : M.findAll({ where, order: [['id', 'ASC']], ...opts }));
  const [rosters, blocks, scores, markers, projections, effectivity, aux] = await Promise.all([
    all(CapsuleRoster, { include: rosterInclude() }), all(CapsuleBlock), all(CapsuleScore, { include: scoreInclude() }), all(CapsuleMarkerName),
    all(CapsuleProjection), all(CapsuleEffectivity), all(CapsuleAuxRecord),
  ]);
  const markerNames = {};
  markers.forEach((m) => { (markerNames[m.capsuleId] = markerNames[m.capsuleId] || {})[m.markerIndex] = m.name; });
  const auxOf = (kind) => aux.filter((a) => a.kind === kind).map(auxOut);
  return {
    capsules: capsules.map(capsuleOut),
    rosters: rosters.map(rosterOut),
    blocks: blocks.map(blockOut),
    scores: sortScores(scores.map(scoreOut)),
    markerNames,
    projections: projections.map(projectionOut),
    effectivity: effectivity.map(effectivityOut),
    auxCandidateMarks: auxOf('candidateMarks'),
    auxNeedAssessments: auxOf('needAssessments'),
    auxImprovements: auxOf('improvements'),
    auxChains: auxOf('chains'),
    auxLeaderMarks: auxOf('leaderMarks'),
  };
});

exports._internal = { sortScores, criticalRange, AUX_KINDS };
