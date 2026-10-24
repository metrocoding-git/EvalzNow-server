const db = require('../models');
const { mapLimit, REPORT_CONCURRENCY } = require("../utils/concurrency");
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;
const needAssessment = db.CandidateNeedAssessment;
const UnitRoster = db.UnitRoster;
const LeaderMarks = db.LeaderMarks
const CandidateMarks = db.CandidateMarks;
const UnitImprovement = db.UnitImprovement;
const Client = db.Client
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { toIdArray } = require('../utils/jsonIds');
const effectivityFx = require('../utils/effectivity');
const { _internal: effectivityInternal } = require('./effectivity.controller');

// Effectivity table of one candidate, built from competency data already computed
// for the report (no second tabulation run).
async function candidateEffectivity(unitId, candidateId, unitType, competencyData) {
  const responses = await db.EffectivityResponse.findAll({ where: { unitId, candidateId }, raw: true });
  return effectivityInternal.buildCandidateTable(candidateId, unitType, competencyData, responses);
}

const FRAMEWORK_AGES = ["< 1 year", "1-2 years", "3-5 years", "6-10 years", "> 10 years"];
const { getNeuroScienceRmsValues } = require('./neuroScience.controller');
const { getAssessmentChainData, getNeedAssessmentStatusSummary, getEffortBu } = require('./auxiliaryResultant.controller');
const { getUnitSuccessRatesByThreshold, getGlobalAnalyticsDataByUnit } = require('./globalAnalytics.controller');

/// <param name="xArray">array data - covers the range of Performance Point IDs (+PP ID only)</param>
/// <param name="yArray">array data - represents the RMS for each +PP ID.</param>
function cognitiveNS(xArray, yArray) {
  var areasub = 0;

  for (var i = 0; i < xArray.length; i++) {
    if (i <= xArray.length - 2 && yArray[i] != 0 && yArray[i + 1] != 0) {
      areasub +=
        (yArray[i] + yArray[i + 1]) / 2;
    } else {
      continue;
    }
  }

  return (parseFloat(areasub) / 100).toFixed(3);
}


function calculateCognitiveLoadPerLobe(neuroRmsData) {
  const lobeMap = {};
  const sortedData = [...neuroRmsData].sort((a, b) => a.ppId - b.ppId);

  // Build cumulative RMS arrays per lobe
  sortedData.forEach(({ ppId, lobes }) => {
    Object.entries(lobes).forEach(([lobeName, values]) => {
      if (!lobeMap[lobeName]) {
        lobeMap[lobeName] = {
          ppIds: [],
          rms: [],
          deltaRms: []
        };
      }

      lobeMap[lobeName].ppIds.push(ppId);
      lobeMap[lobeName].rms.push(values.RMS);
      lobeMap[lobeName].deltaRms.push(values.deltaRMS);
    });
  });

  const result = {};

  Object.entries(lobeMap).forEach(([lobeName, arrays]) => {
    result[lobeName] = {
      proficiency: [],
      growth: []
    };

    //  Compute cognitive load PER PP (cumulative)
    for (let i = 0; i < arrays.ppIds.length; i++) {
      const xSlice = arrays.ppIds.slice(0, i + 1);
      const rmsSlice = arrays.rms.slice(0, i + 1);
      const deltaSlice = arrays.deltaRms.slice(0, i + 1);

      result[lobeName].proficiency.push({
        ppId: arrays.ppIds[i],
        value: xSlice.length < 2 ? "0.000" : cognitiveNS(xSlice, rmsSlice)
      });

      result[lobeName].growth.push({
        ppId: arrays.ppIds[i],
        value: xSlice.length < 2 ? "0.000" : cognitiveNS(xSlice, deltaSlice)
      });
    }
  });

  return result;
}

const calculateRosterPercentages = (roster) => {
  const {
    presentCount = 0,
    excusedAbsences = 0,
    unexcusedAbsences = 0,
    excusedTardies = 0,
    unexcusedTardies = 0
  } = roster;

  const total =
    presentCount +
    excusedAbsences +
    unexcusedAbsences +
    excusedTardies +
    unexcusedTardies;

  if (!total) {
    return {
      present: 0,
      excusedAbsences: 0,
      unexcusedAbsences: 0,
      excusedTardies: 0,
      unexcusedTardies: 0
    };
  }

  return {
    present: +(presentCount / total).toFixed(3),
    excusedAbsences: +(excusedAbsences / total).toFixed(3),
    unexcusedAbsences: +(unexcusedAbsences / total).toFixed(3),
    excusedTardies: +(excusedTardies / total).toFixed(3),
    unexcusedTardies: +(unexcusedTardies / total).toFixed(3)
  };
};

const calculateEngageLevelPercentages = (scores) => {
  const levels = ["High", "Medium", "Low", "N/A"];
  const total = scores.length;

  const counts = {
    High: 0,
    Medium: 0,
    Low: 0,
    "N/A": 0
  };

  scores.forEach(s => {
    const level = s.engageLevel ?? "N/A";
    if (counts[level] !== undefined) {
      counts[level]++;
    } else {
      counts["N/A"]++;
    }
  });

  const percentages = {};
  levels.forEach(level => {
    percentages[level] = total
      ? +(counts[level] / total).toFixed(3)
      : 0;
  });

  return {
    total,
    counts,
    percentages
  };
};

const calculateUnitTabulationAverages = (candidates, unitType, signatureProfile) => {
  const bucket = {};

  const EXCLUDE_KEYS = new Set([
    "candidateId",
    "ppId",
    "IC",
    "STAP",
    "STAG"
  ]);

  // 1️⃣ Collect all numeric values from candidate competencyAverages
  candidates.forEach(candidate => {
    const avgRow = candidate.competencyAverages?.[0];
    if (!avgRow) return;

    Object.entries(avgRow).forEach(([key, value]) => {
      if (EXCLUDE_KEYS.has(key)) return;
      if (value === null || typeof value !== "number") return;

      if (!bucket[key]) bucket[key] = [];
      bucket[key].push(value);
    });
  });

  // 2️⃣ Compute averages for each metric
  const averages = Object.entries(bucket).map(([metric, values]) => ({
    metric,
    value: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(3),
    candidatesCount: values.length
  }));

  // 3️⃣ Derived indicators: STAP and STAG
  const stapStatus = calculateAverageSTAP(averages, unitType);
  const stagStatus = calculateAverageSTAG(averages, unitType);
  const count = averages[0]?.candidatesCount ?? 0;

  averages.push(
    {
      metric: "STAP",
      value: stapStatus,
      candidatesCount: count
    },
    {
      metric: "STAG",
      value: stagStatus,
      candidatesCount: count
    }
  );

  // 4️⃣ Compute average IC and add it to tabulationAverages
  const getMetricValue = (name) => averages.find(a => a.metric === name)?.value ?? 0;
  const avgRR = getMetricValue("RRN");
  const avgPR = getMetricValue("PRN");
  const avgAR = getMetricValue("ARN");

  const avgIC = calculateInteractionClass(avgRR, avgPR, avgAR, unitType, signatureProfile);

  averages.push({
    metric: "IC",
    value: avgIC,
    candidatesCount: count
  });

  return averages;
};



// Case 1
function GetInteractionClassForCase1(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2));
  return GetInteractionClassAreaCase1(eqn);
}

// Case 2
function GetInteractionClassForCase2(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 3));
  return GetInteractionClassAreaCase2(eqn);
}

// Case 3a
function GetInteractionClassForCase3a(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 2));
  return GetInteractionClassAreaCase3a(eqn);
}

// Case 3b
function GetInteractionClassForCase3b(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 3));
  return GetInteractionClassAreaCase3b(eqn);
}

// Third Parameter (3D)
function GetInteractionClassForThird(rr, pr, ar) {
  const eqn = Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2) + Math.pow(ar, 2));
  return GetInteractionClassAreaThird(eqn);
}

// --- Area lookup tables ---

function GetInteractionClassAreaCase1(eqn) {
  if (eqn < 0.6) return "0R0P";
  else if (eqn < 0.7) return "1R1P";
  else if (eqn < 0.8) return "2R2P";
  else if (eqn < 0.9) return "3R3P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

function GetInteractionClassAreaCase2(eqn) {
  if (eqn < 0.71138) return "0R0P";
  else if (eqn < 0.78837) return "1R1P";
  else if (eqn < 0.86177) return "2R2P";
  else if (eqn < 0.93217) return "3R3P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

function GetInteractionClassAreaCase3a(eqn) {
  if (eqn < 0.6) return "0R0P";
  else if (eqn < 0.7) return "0R1P";
  else if (eqn < 0.711379) return "0R2P";
  else if (eqn < 0.788374) return "1R2P";
  else if (eqn < 0.8) return "2R2P";
  else if (eqn < 0.86177) return "2R3P";
  else if (eqn < 0.9) return "3R3P";
  else if (eqn < 0.93217) return "3R4P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

function GetInteractionClassAreaCase3b(eqn) {
  if (eqn < 0.6) return "0R0P";
  else if (eqn < 0.7) return "1R0P";
  else if (eqn < 0.711379) return "2R0P";
  else if (eqn < 0.788374) return "2R1P";
  else if (eqn < 0.8) return "2R2P";
  else if (eqn < 0.86177) return "3R2P";
  else if (eqn < 0.9) return "3R3P";
  else if (eqn < 0.93217) return "4R3P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

// function GetInteractionClassAreaThird(eqn) {
//   if (eqn < 0.6) return 0;
//   else if (eqn < 0.7) return 1;
//   else if (eqn < 0.8) return 2;
//   else if (eqn < 0.9) return 3;
//   else if (eqn < 1.0) return 4;
//   else return 5;
// }
function GetInteractionClassAreaThird(eqn) {
  if (eqn < 0.6) return '0R0P';
  else if (eqn >= 0.6 && eqn < 0.7) return '1R1P';
  else if (eqn >= 0.7 && eqn < 0.8) return '2R2P';
  else if (eqn >= 0.8 && eqn < 0.9) return '3R3P';
  else if (eqn >= 0.9 && eqn < 1.0) return '4R4P';
  else return '5R5P';
}

// --- Unified router function ---
function calculateInteractionClass(rr, pr, ar, unitType, signatureProfile) {
  const rrVal = rr ?? 0;
  const prVal = pr ?? 0;
  const arVal = ar ?? 0;

  if (unitType === "Third Parameter") {
    return GetInteractionClassForThird(rrVal, prVal, arVal);
  }

  if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
    switch (signatureProfile) {
      case "Case 1: Solid Balanced":
        return GetInteractionClassForCase1(rrVal, prVal);
      case "Case 2: Rigorous Balanced":
        return GetInteractionClassForCase2(rrVal, prVal);
      case "Case 3a: Productive-Weighted":
        return GetInteractionClassForCase3a(rrVal, prVal);
      case "Case 3b: Receptive-Weighted":
        return GetInteractionClassForCase3b(rrVal, prVal);
      default:
        return null;
    }
  }

  return null;
}

async function buildAssessmentSummary(unitId, candidateIds) {
  const req = {
    params: {
      unitId,
      candidate_id: candidateIds.map(String).join(",")
    }
  };

  let result = null;

  const res = {
    status() { return this; },
    json(data) { result = data; }
  };

  await getNeedAssessmentStatusSummary(req, res);
  return result;
}


async function buildRosterList(unitId) {
  const rosterRows = await UnitRoster.findAll({ where: { unitId } });
  if (!rosterRows.length) return [];

  const ids = [...new Set(rosterRows.map((r) => r.candidateId))];
  const cands = await Candidate.findAll({ where: { id: ids } });
  const byId = new Map(cands.map((c) => [c.id, c.toJSON()]));

  return rosterRows
    .map((r) => {
      const c = byId.get(r.candidateId) ?? {};
      return {
        candidateId: c.candidateId ?? r.candidateId,
        candidateCode: c.candidateId,
        firstName: c.firstName,
        lastName: c.lastName,
        nationality: c.nationality,
        candidateStartDate: c.startDate,
        unitOutcome: r.unitOutcome,
      };
    })
    .sort((a, b) => String(a.lastName ?? "").localeCompare(String(b.lastName ?? "")));
}

// candidate reports
// negatives first (by absolute value), then positives ascending
const ppSort = (a, b) => {
  const aId = a.ppId, bId = b.ppId;
  if (aId < 0 && bId > 0) return -1;
  if (aId > 0 && bId < 0) return 1;
  if (aId < 0 && bId < 0) return Math.abs(aId) - Math.abs(bId);
  return aId - bId;
};

const applyCumulativeDayCount = (rows = []) =>
  rows.map(r => {
    const cumulative = Number(r.cumulativeDuration);
    return {
      ...r,
      ppDuration: r.totalDuration,
      totalDuration: Number.isFinite(cumulative)
        ? +cumulative.toFixed(2)
        : r.totalDuration,
    };
  });


// Calls another controller with a mock res. Never throws: a failure returns null.
const runController = async (fn, req) => {
  let out = null;
  const res = { status() { return this; }, json(d) { out = d; return this; } };
  try {
    await fn(req, res);
  } catch (e) {
    console.warn(`[report] ${fn.name} failed:`, e.message);
  }
  return out;
};

const unitReportInclude = () => [
  {
    model: db.StaffLookup,
    as: "staffAssignments",
    required: false,
    include: [
      { model: db.Staff, as: "staff", required: false, attributes: ["id", "lastName", "firstName"] }
    ]
  },
  { model: db.Benchmark, as: "benchmarks", required: false }
];

// One candidate's full report data. Works with or without PP scores.
async function buildCandidateReport(unitId, candidateId) {
  // Candidate comes from the Candidate table, NOT from scores[0]
  const candidateRecord = await Candidate.findOne({
    where: { id: candidateId },
    include: [{ model: db.Irregularity, as: "irregularities", required: false }]
  });
  if (!candidateRecord) return null;
  const c = candidateRecord.toJSON();

  const scores = await InsertScore.findAll({
    where: { unitId, candidate_id: candidateId },
    include: [
      { model: AssessmentBlockManager, as: "assessmentBlock" },
      { model: Unit, as: "unit" },
      { model: Candidate, as: "candidate", include: [{ model: db.Irregularity, as: "irregularities" }] }
    ],
    order: [["ppId", "ASC"], ["criticalRefDate", "ASC"]]
  });

  const rosterData = await UnitRoster.findAll({ where: { unitId, candidateId } });
  const marks = await CandidateMarks.findAll({
    where: { unitId, candidateId },
    order: [["entryNumber", "ASC"]]
  });
  const needRows = await needAssessment.findAll({
    where: { unitId, candidateId },
    attributes: ["ppId", "benchmarkIds", "bIds", "observation"]
  });

  const scoreJson = scores.map(s => s.toJSON());

  const candidate = {
    candidateId: c.id,
    candidateCode: c.candidateId,
    firstName: c.firstName,
    lastName: c.lastName,
    nationality: c.nationality,
    gender: c.gender,
    ethnicity: c.ethnicity,
    income: c.income,
    religion: c.religion,
    maritalStatus: c.maritalStatus,
    jobType: c.jobType,
    dateOfBirth: c.dateOfBirth,
    candidateStartDate: c.startDate,
    specialIdNo: c.specialIdNo,
    irregularities: c.irregularities || [],
    pps: [],
    roster: rosterData.map(r => {
      const plain = r.toJSON();
      return { ...plain, percentages: calculateRosterPercentages(plain) };
    }),
    scores: scoreJson.sort(ppSort),
    engageLevelStats: calculateEngageLevelPercentages(scoreJson),
    candidateMarks: marks.map(m => m.toJSON()),
    competencyResults: [],
    competencyAverages: [],
    competencyCumalative: [],
    competencycumulativeAverages: [],
    needAssessments: needRows
      .map(na => ({
        ppId: na.ppId,
        benchmarkIds: toIdArray(na.benchmarkIds),
        bIds: toIdArray(na.bIds),
        observation: na.observation
      }))
      .sort(ppSort),
    assessmentChain: [],
    neuroScienceRms: { count: 0, data: [], cognitiveLoad: {} },
    effectivity: null
  };

  scores.forEach(row => {
    if (!candidate.pps.find(p => p.ppId === row.ppId)) {
      candidate.pps.push({
        ppId: row.ppId,
        shortDescription: row.assessmentBlock?.shortDescription,
        periodType: row.assessmentBlock?.periodType,
        delivery: row.assessmentBlock?.delivery
      });
    }
  });
  candidate.pps.sort(ppSort);

  // Score-dependent calculations run only when the candidate has scores
  if (scores.length) {
    const competencyData = await runController(getPpCompetencyRatioMultipleCandidate, {
      query: { unitId: String(unitId), candidate_id: String(candidateId) }
    });
    candidate.competencyResults = applyCumulativeDayCount(competencyData?.results || []).sort(ppSort);
    candidate.competencyAverages = competencyData?.averages || [];
    candidate.competencyCumalative = competencyData?.cumulativeSums || [];
    candidate.competencycumulativeAverages = competencyData?.cumulativeAverages || [];

    const unitTypeRow = await Unit.findByPk(unitId, { attributes: ["unitType"], raw: true });
    candidate.effectivity = await candidateEffectivity(unitId, candidateId, unitTypeRow?.unitType, competencyData);

    const neuroData = await runController(getNeuroScienceRmsValues, {
      params: { unitId, candidateId }, query: {}
    });
    if (neuroData?.data?.length) {
      candidate.neuroScienceRms = {
        count: neuroData.count,
        data: neuroData.data,
        cognitiveLoad: neuroData.cognitiveLoad
      };
    }

    const chainData = await runController(getAssessmentChainData, {
      params: { unitId, candidateId }
    });
    candidate.assessmentChain = chainData?.results || [];
  }

  return candidate;
}


exports.getDataReportByUnitCandidate = async (req, res) => {
  try {
    const { unitId, candidateId } = req.params;
    if (!unitId || !candidateId) {
      return res.status(400).json({ message: "unitId and candidateId are required" });
    }

    const unit = await Unit.findOne({ where: { id: unitId }, include: unitReportInclude() });
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const candidate = await buildCandidateReport(unitId, candidateId);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    const totalCount = await UnitRoster.count({ where: { unitId } });

    return res.status(200).json({
      unit: {
        ...unit.toJSON(),
        rosterStats: { totalCount },
        candidates: [candidate]          // always included, with or without scores
      }
    });
  } catch (error) {
    console.error("Error fetching unit candidate report:", error);
    res.status(500).json({ message: "Error fetching unit candidate report", error: error.message });
  }
};

exports.getDataReportByUnitAllCandidates = async (req, res) => {
  try {
    const { unitId } = req.params;
    if (!unitId) return res.status(400).json({ message: "unitId is required" });

    const unit = await Unit.findOne({ where: { id: unitId }, include: unitReportInclude() });
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const rosterIdRows = await UnitRoster.findAll({
      where: { unitId },
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("candidateId")), "candidateId"]],
      raw: true
    });
    let candidateIds = rosterIdRows.map(r => r.candidateId);

    if (!candidateIds.length) {
      const scoreIdRows = await InsertScore.findAll({
        where: { unitId },
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("candidate_id")), "candidateId"]],
        raw: true
      });
      candidateIds = scoreIdRows.map(s => s.candidateId);
    }

    // Candidates are built in parallel (bounded) but kept in the original order.
    const built = await mapLimit(candidateIds, REPORT_CONCURRENCY,
      (candidateId) => buildCandidateReport(unitId, candidateId));
    const candidates = built.filter(Boolean);   // no skipping for missing scores

    const totalCount = await UnitRoster.count({ where: { unitId } });

    return res.status(200).json({
      unit: { ...unit.toJSON(), rosterStats: { totalCount }, candidates }
    });
  } catch (error) {
    console.error("Error fetching unit report:", error);
    res.status(500).json({ message: "Error fetching unit report", error: error.message });
  }
};

function calculateSTAP(RRNValue, PRNValue, ARNValue, MSIPValue, unitType) {
  const rrn = RRNValue ?? 0;
  const prn = PRNValue ?? 0;
  const arn = ARNValue ?? 0;
  const msip = MSIPValue ?? 0;

  if (
    rrn >= 0.50 &&
    prn >= 0.50 &&
    (unitType !== "Third Parameter" || arn >= 0.50) &&
    msip <= 0.42
  ) {
    return "STABLE";
  } else {
    return "UNSTABLE";
  }
}


const calculateSTAG = (deltaRRN, deltaPRN, deltaARN, msipValue, type, GEQ) => {

  if (deltaRRN >= 0 && deltaPRN >= 0 && (type !== "Third Parameter" || deltaARN >= 0) && msipValue <= 0.42 && GEQ >= 0) {
    return 'STABLE'
  }
  else {
    return 'UNSTABLE'
  }
}

const calculateAverageSTAP = (tabulationAverages, unitType) => {
  const getMetric = (name) =>
    tabulationAverages.find(a => a.metric === name)?.value ?? null;

  const avgRRN = getMetric("RRN");
  const avgPRN = getMetric("PRN");
  const avgARN = getMetric("ARN");
  const avgMSIP = getMetric("MSIP");

  return calculateSTAP(
    avgRRN,
    avgPRN,
    avgARN,
    avgMSIP,
    unitType
  );
};


const calculateAverageSTAG = (tabulationAverages, unitType) => {
  const getMetric = (name) =>
    tabulationAverages.find(a => a.metric === name)?.value ?? null;

  const avgDeltaRRN = getMetric("deltaRRN");
  const avgDeltaPRN = getMetric("deltaPRN");
  const avgDeltaARN = getMetric("deltaARN");
  const avgMSIP = getMetric("MSIP");
  const avgGEQ = getMetric("GEQ");
  console.log("avgDeltaRRN:", avgDeltaRRN);
  console.log("avgDeltaPRN:", avgDeltaPRN);
  console.log("avgDeltaARN:", avgDeltaARN);
  console.log("avgMSIP:", avgMSIP);
  console.log("avgGEQ:", avgGEQ);

  return calculateSTAG(
    avgDeltaRRN,
    avgDeltaPRN,
    avgDeltaARN,
    avgMSIP,
    unitType
  );
};


function calculateStableFraction(data, key) {
  if (!Array.isArray(data) || !data.length) return 0;

  let stable = 0;
  let total = 0;

  data.forEach(item => {
    const value = item[key];
    if (value === "STABLE" || value === "UNSTABLE") {
      total++;
      if (value === "STABLE") stable++;
    }
  });

  return total === 0 ? 0 : stable / total;
}

const pickAverageRow = (candidate) =>
  (candidate.competencyAverages ?? []).find((a) => a.ppId === "Average") ??
  candidate.competencyAverages?.[0] ??
  null;

async function buildUnitReport(unitId) {
  const unitRosterAccumulator = {
    presentCount: 0,
    excusedAbsences: 0,
    unexcusedAbsences: 0,
    excusedTardies: 0,
    unexcusedTardies: 0
  };

  const unit = await Unit.findOne({
    where: { id: unitId },
    include: [
      {
        model: db.StaffLookup,
        as: "staffAssignments",
        required: false,
        include: [
          { model: db.Staff, as: "staff", required: false, attributes: ["id", "firstName", "lastName"] }
        ]
      },
      { model: db.Benchmark, as: "benchmarks", required: false }
    ]
  });

  if (!unit) return null;

  // ALL roster candidates (scored or not) for the UNIT ROSTER section
  const rosterCandidates = await buildRosterList(unitId);
  const rosterTotalCount = await UnitRoster.count({ where: { unitId } });

  // Candidate ids: roster first, fallback to InsertScore
  const rosterIdRows = await UnitRoster.findAll({
    where: { unitId },
    attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("candidateId")), "candidateId"]],
    raw: true
  });
  let candidateIds = rosterIdRows.map(r => r.candidateId);

  if (!candidateIds.length) {
    const scoreIdRows = await InsertScore.findAll({
      where: { unitId },
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("candidate_id")), "candidateId"]],
      raw: true
    });
    candidateIds = scoreIdRows.map(s => s.candidateId);
  }

  if (!candidateIds.length) {
    return {
      ...unit.toJSON(),
      candidates: [],
      rosterCandidates,
      rosterStats: { totalCount: rosterTotalCount },
      tabulationAverages: [],
      averageInteractionClass: 0,
      competencyStability: { stapStableFraction: 0, stagStableFraction: 0 }
    };
  }

  const candidateIdList = candidateIds.map(String).join(",");

  // Unit-level tables: fetch once (same for every candidate)
  const leaderMarks = await LeaderMarks.findAll({ where: { unitId }, order: [["entryNumber", "ASC"]] });
  const unitImprovement = await UnitImprovement.findAll({ where: { unitId } });

  const unitScoreBucket = [];
  let unitStapStableCount = 0;
  let unitStagStableCount = 0;
  let unitCompetencyCandidateCount = 0;
  const candidates = [];

  const processCandidate = async (candidateId) => {
    const scores = await InsertScore.findAll({
      where: { unitId, candidate_id: candidateId },
      include: [
        { model: AssessmentBlockManager, as: "assessmentBlock" },
        { model: Unit, as: "unit" },
        { model: Candidate, as: "candidate" }
      ],
      order: [["ppId", "ASC"], ["criticalRefDate", "ASC"]]
    });

    if (!scores.length) return null;   // unscored candidates still appear via rosterCandidates

    const rosterData = await UnitRoster.findAll({ where: { unitId, candidateId } });

    const marks = await CandidateMarks.findAll({
      where: { unitId, candidateId },
      order: [["entryNumber", "ASC"]]
    });

    const candidate = {
      candidateId: scores[0].candidate.candidateId,
      candidateCode: scores[0].candidate.candidateId,
      firstName: scores[0].candidate.firstName,
      lastName: scores[0].candidate.lastName,
      nationality: scores[0].candidate.nationality,
      gender: scores[0].candidate.gender,
      ethnicity: scores[0].candidate.ethnicity,
      income: scores[0].candidate.income,
      religion: scores[0].candidate.religion,
      maritalStatus: scores[0].candidate.maritalStatus,
      jobType: scores[0].candidate.jobType,
      dateOfBirth: scores[0].candidate.dateOfBirth,
      candidateStartDate: scores[0].candidate.startDate,
      specialIdNo: scores[0].candidate.specialIdNo,
      pps: [],
      roster: rosterData.map(r => {
        const plain = r.toJSON();
        return { ...plain, percentages: calculateRosterPercentages(plain) };
      }),
      scores: scores.map(s => s.toJSON()),
      candidateMarks: marks.map(m => m.toJSON()),
      leaderMarks: leaderMarks.map(l => l.toJSON()),
      unitImprovement: unitImprovement.map(u => u.toJSON()),
      effortBu: [],
      competencyResults: [],
      competencyAverages: [],
      competencyCumalative: [],
      competencycumulativeAverages: [],
      needAssessments: [],
      engageLevelStats: calculateEngageLevelPercentages(scores.map(s => s.toJSON()))
    };

    scores.forEach(row => {
      if (!candidate.pps.find(p => p.ppId === row.ppId)) {
        candidate.pps.push({
          ppId: row.ppId,
          shortDescription: row.assessmentBlock?.shortDescription,
          periodType: row.assessmentBlock?.periodType,
          delivery: row.assessmentBlock?.delivery
        });
      }
    });

    // Competency
    let competencyData = null;
    await getPpCompetencyRatioMultipleCandidate(
      { query: { unitId: String(unitId), candidate_id: String(candidateId) } },
      { status() { return this; }, json(data) { competencyData = data; } }
    );
    candidate.competencyResults = applyCumulativeDayCount(competencyData?.results || []);
    candidate.competencyAverages = competencyData?.averages || [];
    candidate.competencyCumalative = competencyData?.cumulativeSums || [];
    candidate.competencycumulativeAverages = competencyData?.cumulativeAverages || [];
    candidate.effectivity = await candidateEffectivity(unitId, candidateId, unit.unitType, competencyData);

    // Effort BU (CSD / USD)
    let effortBU = null;
    await getEffortBu(
      { params: { unitId: String(unitId), candidate_id: String(candidateId) } },
      { status() { return this; }, json(d) { effortBU = d; } }
    );
    candidate.effortBu = effortBU || [];

    // Need assessments
    const needAssessments = await needAssessment.findAll({
      where: { unitId, candidateId },
      attributes: ["ppId", "benchmarkIds", "bIds", "observation"]
    });
    candidate.needAssessments = needAssessments.map(na => ({
      ppId: na.ppId,
      benchmarkIds: toIdArray(na.benchmarkIds),
      bIds: toIdArray(na.bIds),
      observation: na.observation
    }));

    return { candidate, rosterData };
  };

  // Candidates are processed in parallel (bounded), then aggregated in the
  // ORIGINAL order with exactly the same logic as before -> identical results.
  const processed = await mapLimit(candidateIds, REPORT_CONCURRENCY, processCandidate);

  for (const item of processed) {
    if (!item) continue;
    const { candidate, rosterData } = item;

    rosterData.forEach(r => {
      unitRosterAccumulator.presentCount += r.presentCount || 0;
      unitRosterAccumulator.excusedAbsences += r.excusedAbsences || 0;
      unitRosterAccumulator.unexcusedAbsences += r.unexcusedAbsences || 0;
      unitRosterAccumulator.excusedTardies += r.excusedTardies || 0;
      unitRosterAccumulator.unexcusedTardies += r.unexcusedTardies || 0;
    });

    unitScoreBucket.push(...candidate.scores);

    // Unit-level STAP / STAG (one value per candidate, from the "Average" row)
    const avgRow = pickAverageRow(candidate);
    if (avgRow) {
      unitCompetencyCandidateCount++;
      if (avgRow.STAP === "STABLE") unitStapStableCount++;
      if (avgRow.STAG === "STABLE") unitStagStableCount++;
    }

    candidates.push(candidate);
  }

  // Need assessment status summary (once for the unit)
  let assessmentSummary = null;
  await getNeedAssessmentStatusSummary(
    { params: { unitId: String(unitId), candidate_id: candidateIdList } },
    { status() { return this; }, json(payload) { assessmentSummary = payload; return this; } }
  );

  const competencyStability = {
    stapStableFraction: unitCompetencyCandidateCount === 0 ? 0 : unitStapStableCount / unitCompetencyCandidateCount,
    stagStableFraction: unitCompetencyCandidateCount === 0 ? 0 : unitStagStableCount / unitCompetencyCandidateCount
  };

  const tabulationAverages = calculateUnitTabulationAverages(candidates, unit.unitType, unit.signatureProfile);

  const avgRR = tabulationAverages.find(t => t.metric === "RRN")?.value ?? 0;
  const avgPR = tabulationAverages.find(t => t.metric === "PRN")?.value ?? 0;
  const avgAR = tabulationAverages.find(t => t.metric === "ARN")?.value ?? 0;
  const averageInteractionClass = calculateInteractionClass(
    avgRR, avgPR, avgAR, unit.unitType, unit.signatureProfile
  );

  // Effectivity (unit level): pass % per parameter from each candidate's average
  // parameters, and the Effectivity Type split of every saved effectivity object.
  const effAverages = candidates.map((c) => c.effectivity?.average).filter(Boolean);
  const effectivity = {
    thresholds: effectivityFx.getThresholds(unit.unitType),
    passFractions: Array.from({ length: effectivityFx.PARAMETER_COUNT }, (_, i) => {
      const flags = effAverages.map((a) => a.pass?.[i]).filter((v) => v === true || v === false);
      return flags.length ? Number((flags.filter(Boolean).length / flags.length).toFixed(3)) : null;
    }),
    typeBreakdown: effectivityFx.typeBreakdown(candidates.flatMap((c) => (c.effectivity?.rows || []).filter((r) => r.id))),
  };

  return {
    ...unit.toJSON(),
    candidates,
    effectivity,
    rosterCandidates,                                   // every roster candidate
    engageLevelStats: calculateEngageLevelPercentages(unitScoreBucket),
    rosterPercentages: calculateRosterPercentages(unitRosterAccumulator),
    tabulationAverages,
    rosterStats: { totalCount: rosterTotalCount },
    averageInteractionClass,
    assessmentSummary,
    competencyStability
  };
}


exports.getDataReportByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    if (!unitId) return res.status(400).json({ message: "unitId is required" });

    const unit = await buildUnitReport(unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    return res.status(200).json({ unit });
  } catch (error) {
    console.error("Error fetching unit report:", error);
    res.status(500).json({ message: "Error fetching unit report", error: error.message });
  }
};

exports.getDataReportByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    const units = await Unit.findAll({
      where: { clientId },
      attributes: ["id"]
    });

    if (!units.length) {
      return res.status(200).json({
        clientId,
        units: []
      });
    }

    // Units are built two at a time (each unit already runs its candidates in
    // parallel); order is preserved so the output is identical.
    const built = await mapLimit(units, 2, (unit) => buildUnitReport(unit.id));
    const reports = built.filter(Boolean);

    return res.status(200).json({
      clientId,
      units: reports
    });

  } catch (error) {
    console.error("Error fetching client report:", error);
    return res.status(500).json({
      message: "Error fetching client report",
      error: error.message
    });
  }
};

exports.getGlobalDataReportByClient = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    // 1️⃣ Fetch all units under this client
    const units = await Unit.findAll({
      where: { clientId },
      attributes: ["id", "environment", "frameworkAge"]
    });

    if (!units.length) {
      return res.status(200).json({
        client: null,
        summary: [],
        totalUniqueCandidates: 0
      });
    }

    const unitIds = units.map(u => u.id);

    // 2️⃣ Fetch all candidate IDs from UnitRoster and InsertScore
    const rosterCandidates = await UnitRoster.findAll({
      where: { unitId: unitIds },
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidateId")), "candidateId"]],
      raw: true
    });

    const scoreCandidates = await InsertScore.findAll({
      where: { unitId: unitIds },
      attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidate_id")), "candidateId"]],
      raw: true
    });

    // Merge and get unique candidate IDs
    const allCandidateIds = new Set([
      ...rosterCandidates.map(r => r.candidateId),
      ...scoreCandidates.map(s => s.candidateId)
    ]);

    const totalUniqueCandidates = allCandidateIds.size;

    // 3️⃣ Fetch client details
    const client = await Client.findAll({
      where: { id: clientId },
      attributes: ["id", "executiveId", "companyName", "institutionalType", "companyContactNumber", "country", "companySizeId"],
      include: [
        {
          model: db.CompanySize,
          as: "companySize"
        }
      ]
    });

    // 4️⃣ Fetch global analytics & thresholds
    const globalAnalyticsReq = { params: { clientId: String(clientId) } };

    let globalAnalytics = null;
    let globalAnalyticsThreshold = null;

    await getGlobalAnalyticsDataByUnit(globalAnalyticsReq, {
      status() { return this; },
      json(payload) { globalAnalytics = payload; return this; }
    });

    await getUnitSuccessRatesByThreshold(globalAnalyticsReq, {
      status() { return this; },
      json(payload) { globalAnalyticsThreshold = payload; return this; }
    });

    // Framework / curriculum age – classroom units only (null = no classroom units -> "-").
    const classroomUnits = units.filter((u) => u.environment === "Classroom");
    const frameworkAge = classroomUnits.length
      ? Object.fromEntries(FRAMEWORK_AGES.map((age) => [
        age,
        Number((classroomUnits.filter((u) => u.frameworkAge === age).length / classroomUnits.length).toFixed(3)),
      ]))
      : null;

    // Effectivity (all units): % of candidates whose average parameter passes, and type split.
    let effectivity = null;
    await require('./effectivity.controller').getClientEffectivity(
      { params: { clientId: String(clientId) } },
      { status() { return this; }, json(payload) { effectivity = payload; return this; } }
    );

    return res.status(200).json({
      client: client.length ? client[0].toJSON() : null,
      totalUniqueCandidates,
      summary: [
        { globalAnalytics, globalAnalyticsThreshold }
      ],
      frameworkAge,
      classroomUnitCount: classroomUnits.length,
      effectivity
    });

  } catch (error) {
    console.error("Error fetching client report:", error);
    return res.status(500).json({
      message: "Error fetching client report",
      error: error.message
    });
  }
};
