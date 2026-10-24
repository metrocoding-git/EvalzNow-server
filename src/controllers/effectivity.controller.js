/**
 * Effectivity (new menu).
 *
 * Effectivity objects (Type / Gap / Segment / Context / Purpose) are entered per candidate and
 * PP ID. The 10 effectivity parameters are calculated from the PP's RRN / PRN / ARN that the
 * tabulation engine already produces (see utils/effectivity.js), so they always follow the
 * latest scores.
 */
const db = require("../models");
const { getPpCompetencyRatioMultipleCandidate } = require("./tabulationTable.controller");
const fx = require("../utils/effectivity");

const { EffectivityResponse, Unit, UnitRoster } = db;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/** Runs the tabulation controller in-process and returns its JSON (or null). */
async function tabulate(unitId, candidateIds, extraQuery = {}) {
  if (!candidateIds.length) return null;
  let payload = null;
  let status = 200;
  const req = { query: { unitId, candidate_id: candidateIds.join(","), ...extraQuery } };
  const res = {
    status(code) { status = code; return this; },
    json(data) { payload = data; return this; },
  };
  await getPpCompetencyRatioMultipleCandidate(req, res);
  return status === 200 ? payload : null;
}

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** -1, -2, -3 … then 1, 2, 3 … (same order as the other PP ID tables). */
const ppOrder = (a, b) => {
  if (a < 0 && b < 0) return b - a;
  if (a < 0) return -1;
  if (b < 0) return 1;
  return a - b;
};

const pickFields = (r) =>
  Object.fromEntries(fx.EFFECTIVITY_FIELDS.map((f) => [f, r ? r[f] ?? null : null]));

/** Critical reference date range, passed through to the tabulation engine. */
const dateQuery = (q = {}) => ({
  ...(q.criticalRefDateFrom ? { criticalRefDateFrom: q.criticalRefDateFrom } : {}),
  ...(q.criticalRefDateTo ? { criticalRefDateTo: q.criticalRefDateTo } : {}),
});

function rangeFilter({ ppIdFrom, ppIdTo }) {
  const from = toNum(ppIdFrom);
  const to = toNum(ppIdTo);
  return (pp) => (from === null || pp >= from) && (to === null || pp <= to);
}

/**
 * Builds the effectivity table of one candidate.
 * tab = tabulation payload containing the candidate, responses = this candidate's rows.
 */
function buildCandidateTable(candidateId, unitType, tab, responses, inRange = () => true) {
  const thresholds = fx.getThresholds(unitType);
  const results = (tab?.results || []).filter((r) => String(r.candidateId) === String(candidateId));
  const byPp = new Map();

  results.forEach((r) => {
    const pp = Number(r.ppId);
    if (!Number.isFinite(pp)) return;
    byPp.set(pp, {
      ppId: pp,
      totalDuration: toNum(r.totalDuration),
      criticalRefDate: r.criticalRefDate || r.latestCriticalRefDate || null,
      RRN: toNum(r.RRN),
      PRN: toNum(r.PRN),
      ARN: toNum(r.ARN),
    });
  });
  // Effectivity objects saved for a PP ID that has no scores (yet) are still listed.
  responses.forEach((r) => {
    if (!byPp.has(r.ppId)) {
      byPp.set(r.ppId, { ppId: r.ppId, totalDuration: null, criticalRefDate: null, RRN: null, PRN: null, ARN: null });
    }
  });

  const respByPp = new Map(responses.map((r) => [r.ppId, r]));
  const rows = [...byPp.values()]
    .filter((row) => inRange(row.ppId))
    .sort((a, b) => ppOrder(a.ppId, b.ppId))
    .map((row) => {
      const resp = respByPp.get(row.ppId);
      const parameters = fx.computeParameters(row.RRN, row.PRN, row.ARN, unitType);
      return {
        ...row,
        id: resp ? resp.id : null,
        ...pickFields(resp),
        parameters,
        pass: fx.passFlags(parameters, thresholds),
      };
    });

  // Average parameter = parameters of the candidate's average RRN / PRN / ARN.
  const avg = (tab?.averages || []).find((a) => String(a.candidateId) === String(candidateId)) || null;
  const averageParameters = avg ? fx.computeParameters(avg.RRN, avg.PRN, avg.ARN, unitType) : null;
  const average = {
    RRN: avg ? toNum(avg.RRN) : null,
    PRN: avg ? toNum(avg.PRN) : null,
    ARN: avg ? toNum(avg.ARN) : null,
    parameters: averageParameters,
    pass: fx.passFlags(averageParameters, thresholds),
  };

  const typeBreakdown = fx.typeBreakdown(rows.filter((r) => r.id));
  return { thresholds, rows, average, typeBreakdown };
}

/** Pass fraction (3 decimals) per parameter across candidates' average parameters. */
function passFractions(averages) {
  return Array.from({ length: fx.PARAMETER_COUNT }, (_, i) => {
    const flags = averages.map((a) => a.pass?.[i]).filter((v) => v === true || v === false);
    return flags.length ? Number((flags.filter(Boolean).length / flags.length).toFixed(3)) : null;
  });
}

async function unitSummary(unit, candidateIds, filters = {}) {
  const [tab, responses] = await Promise.all([
    tabulate(unit.id, candidateIds, dateQuery(filters)),
    candidateIds.length
      ? EffectivityResponse.findAll({ where: { unitId: unit.id, candidateId: candidateIds }, raw: true })
      : [],
  ]);
  const inRange = rangeFilter(filters);
  const candidates = candidateIds.map((cid) => ({
    candidateId: Number(cid),
    ...buildCandidateTable(cid, unit.unitType, tab, responses.filter((r) => String(r.candidateId) === String(cid)), inRange),
  }));
  return {
    unitType: unit.unitType,
    thresholds: fx.getThresholds(unit.unitType),
    candidates,
    passFractions: passFractions(candidates.map((c) => c.average)),
    typeBreakdown: fx.typeBreakdown(candidates.flatMap((c) => c.rows.filter((r) => r.id))),
  };
}

async function rosterCandidateIds(unitId) {
  const rows = await UnitRoster.findAll({ where: { unitId }, attributes: ["candidateId"], raw: true });
  return [...new Set(rows.map((r) => r.candidateId))];
}

// ---------------------------------------------------------------------------
// endpoints
// ---------------------------------------------------------------------------

/** GET /effectivity/options – drop-down options and fixed thresholds. */
exports.getOptions = (req, res) => {
  res.status(200).json({
    options: fx.EFFECTIVITY_OPTIONS,
    thresholds: {
      "Communicative I/O": fx.getThresholds("Communicative I/O"),
      "Theory & Practice": fx.getThresholds("Theory & Practice"),
      "Third Parameter": fx.getThresholds("Third Parameter"),
    },
    cap: fx.PARAMETER_CAP,
  });
};

/** GET /effectivity/candidate/:unitId/:candidateId?ppIdFrom=&ppIdTo= */
exports.getCandidateEffectivity = async (req, res) => {
  try {
    const { unitId, candidateId } = req.params;
    const unit = await Unit.findByPk(unitId, { attributes: ["id", "unitType", "signatureProfile"], raw: true });
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const [tab, responses] = await Promise.all([
      tabulate(unit.id, [candidateId], dateQuery(req.query)),
      EffectivityResponse.findAll({ where: { unitId: unit.id, candidateId }, raw: true }),
    ]);
    const table = buildCandidateTable(candidateId, unit.unitType, tab, responses, rangeFilter(req.query));
    return res.status(200).json({ unitType: unit.unitType, candidateId: Number(candidateId), ...table });
  } catch (error) {
    console.error("getCandidateEffectivity error:", error);
    return res.status(500).json({ message: "Error loading effectivity data" });
  }
};

/** GET /effectivity/unit/:unitId?candidateIds=1,2,3&ppIdFrom=&ppIdTo= (default: whole roster) */
exports.getUnitEffectivity = async (req, res) => {
  try {
    const { unitId } = req.params;
    const unit = await Unit.findByPk(unitId, { attributes: ["id", "unitType", "signatureProfile"], raw: true });
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const roster = await rosterCandidateIds(unit.id);
    let candidateIds = roster;
    if (req.query.candidateIds) {
      const wanted = new Set(String(req.query.candidateIds).split(",").map((s) => Number(s.trim())));
      candidateIds = roster.filter((id) => wanted.has(Number(id)));
    }
    const summary = await unitSummary(unit, candidateIds, req.query);
    return res.status(200).json(summary);
  } catch (error) {
    console.error("getUnitEffectivity error:", error);
    return res.status(500).json({ message: "Error loading unit effectivity data" });
  }
};

/** GET /effectivity/client/:clientId – global % passed per parameter and Effectivity Type %. */
exports.getClientEffectivity = async (req, res) => {
  try {
    const { clientId } = req.params;
    const units = await Unit.findAll({ where: { clientId }, attributes: ["id", "unitType"], raw: true });
    const allAverages = [];
    const allRows = [];
    for (const unit of units) {
      const ids = await rosterCandidateIds(unit.id);
      if (!ids.length) continue;
      const summary = await unitSummary(unit, ids);
      summary.candidates.forEach((c) => {
        allAverages.push(c.average);
        allRows.push(...c.rows.filter((r) => r.id));
      });
    }
    return res.status(200).json({
      unitCount: units.length,
      candidateCount: allAverages.length,
      passFractions: passFractions(allAverages),
      typeBreakdown: fx.typeBreakdown(allRows),
    });
  } catch (error) {
    console.error("getClientEffectivity error:", error);
    return res.status(500).json({ message: "Error loading global effectivity data" });
  }
};

/** POST /effectivity – create or update the effectivity object of a candidate's PP ID. */
exports.saveEffectivity = async (req, res) => {
  try {
    const unitId = toNum(req.body.unitId);
    const candidateId = toNum(req.body.candidateId);
    const ppId = toNum(req.body.ppId);
    if (!unitId || !candidateId || ppId === null || !Number.isInteger(ppId)) {
      return res.status(400).json({ message: "unitId, candidateId and ppId are required" });
    }

    const onRoster = await UnitRoster.findOne({ where: { unitId, candidateId }, attributes: ["id"], raw: true });
    if (!onRoster) return res.status(400).json({ message: "Candidate is not on this unit's roster" });

    const fields = fx.sanitizeFields(req.body);
    const [row, created] = await EffectivityResponse.findOrCreate({
      where: { unitId, candidateId, ppId },
      defaults: { unitId, candidateId, ppId, ...fields },
    });
    if (!created) await row.update(fields);
    return res.status(created ? 201 : 200).json(row);
  } catch (error) {
    console.error("saveEffectivity error:", error);
    return res.status(500).json({ message: "Error saving effectivity object" });
  }
};

/** PUT /effectivity/:id */
exports.updateEffectivity = async (req, res) => {
  try {
    const row = await EffectivityResponse.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: "Effectivity object not found" });
    await row.update(fx.sanitizeFields(req.body));
    return res.status(200).json(row);
  } catch (error) {
    console.error("updateEffectivity error:", error);
    return res.status(500).json({ message: "Error updating effectivity object" });
  }
};

/** DELETE /effectivity/:id */
exports.deleteEffectivity = async (req, res) => {
  try {
    const n = await EffectivityResponse.destroy({ where: { id: req.params.id } });
    if (!n) return res.status(404).json({ message: "Effectivity object not found" });
    return res.status(200).json({ message: "Effectivity object deleted" });
  } catch (error) {
    console.error("deleteEffectivity error:", error);
    return res.status(500).json({ message: "Error deleting effectivity object" });
  }
};

// Shared with data reports / extractions.
exports._internal = { tabulate, buildCandidateTable, unitSummary, rosterCandidateIds };
