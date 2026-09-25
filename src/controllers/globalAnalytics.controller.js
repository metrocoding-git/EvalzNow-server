const { fn, col, literal, Op } = require("sequelize");
const db = require("../models");
const Unit = db.Unit;
const Benchmark = db.Benchmark;
const AssessmentBlockManager = db.AssessmentBlockManager;
const UnitRoster = db.UnitRoster;
const NeedAssessments = db.CandidateNeedAssessment;
const CandidateMarks = db.CandidateMarks;
const LeaderMarks = db.LeaderMarks;
const InsertScore = db.InsertScore;
const StaffLookup = db.StaffLookup;
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');

const CIO = "Communicative I/O", TNP = "Theory & Practice", TP = "Third Parameter";

// Which unit types each metric applies to. Anything not listed applies to all types.
const METRIC_UNIT_TYPES = {
  XRR: [CIO], XLR: [CIO], XWR: [CIO], XSR: [CIO],
  XTR: [TNP], XPR: [TNP],
  XRVSR: [TP], XPVSR: [TP], XAVSR: [TP],
  avgDeltaARN: [TP], sumDeltaARN: [TP],
};

// metric key -> threshold column on Unit
const METRIC_THRESHOLD_COLUMN = {
  XEP: "XEP", XRR: "XRR", XLR: "XLR", XWR: "XWR", XSR: "XSR", XTR: "XTR", XPR: "XPR",
  XRVSR: "XRVSR", XPVSR: "XPVSR", XAVSR: "XAVSR", XCP: "XCP", XBP: "XBP",
  MSIP: "MSIP", IC: "IC", GEQ: "ΔGEQ",
  avgDeltaRRN: "ΔRRN", avgDeltaPRN: "ΔPRN", avgDeltaARN: "ΔARN",
  sumDeltaRRN: "ΔRRN", sumDeltaPRN: "ΔPRN", sumDeltaARN: "ΔARN",
};

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// true = pass, false = fail, null = not applicable / no data (not counted at all)
function evaluateMetric(metric, value, threshold, unitType) {
  const types = METRIC_UNIT_TYPES[metric];
  if (types && !types.includes(unitType)) return null;

  const v = toNum(value);
  const t = toNum(threshold);
  if (v === null || t === null) return null;

  return metric === "MSIP" ? v <= t : v >= t;
}

exports.getUnitSuccessRatesByThreshold = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ message: "clientId is required" });

    const units = await Unit.findAll({
      where: { clientId },
      attributes: [
        "id", "unitId", "unitName", "unitType",
        "XEP", "XRR", "XLR", "XWR", "XSR", "XTR", "XPR",
        "XRVSR", "XPVSR", "XAVSR", "XCP", "XBP", "MSIP", "IC",
        "ΔGEQ", "ΔRRN", "ΔPRN", "ΔARN",
      ],
      raw: true,
    });
    if (!units.length) return res.status(404).json({ message: "No units found for this client" });

    const metricKeys = Object.keys(METRIC_THRESHOLD_COLUMN);
    const totalMetrics = Object.fromEntries(
      metricKeys.map((m) => [m, { successCount: 0, totalInstances: 0 }])
    );

    const allResults = [];
    for (const unit of units) {
      const rosters = await UnitRoster.findAll({
        where: { unitId: unit.id }, attributes: ["candidateId"], raw: true,
      });
      const candidateIds = [...new Set(rosters.map((r) => r.candidateId))];   // no duplicates
      if (!candidateIds.length) continue;

      const unitResults = await calculateAllCandidateMetrics(unit.id, candidateIds);
      if (!unitResults.candidateMetrics.length) continue;

      allResults.push({
        unitId: unit.id,
        unitCode: unit.unitId,
        unitName: unit.unitName,
        unitType: unit.unitType,
        // a missing threshold stays null, so that unit is skipped for that metric
        thresholds: Object.fromEntries(
          metricKeys.map((m) => [m, toNum(unit[METRIC_THRESHOLD_COLUMN[m]])])
        ),
        candidateResults: unitResults.candidateMetrics,
      });
    }

    let totalCandidates = 0;
    const unitDetails = [];

    for (const unit of allResults) {
      const counts = Object.fromEntries(metricKeys.map((m) => [m, { pass: 0, total: 0 }]));

      for (const candidate of unit.candidateResults) {
        totalCandidates++;
        for (const metric of metricKeys) {
          const r = evaluateMetric(metric, candidate[metric], unit.thresholds[metric], unit.unitType);
          if (r === null) continue;
          counts[metric].total++;
          totalMetrics[metric].totalInstances++;
          if (r) {
            counts[metric].pass++;
            totalMetrics[metric].successCount++;
          }
        }
      }

      const successCounts = {}, successRates = {};
      for (const m of metricKeys) {
        successCounts[`${m}SuccessCount`] = counts[m].pass;
        successRates[`${m}Rate`] = counts[m].total
          ? +((counts[m].pass / counts[m].total) * 100).toFixed(2)
          : null;
      }

      unitDetails.push({
        unitId: unit.unitCode,
        unitName: unit.unitName,
        unitType: unit.unitType,
        candidateCount: unit.candidateResults.length,
        thresholds: unit.thresholds,
        successCounts,
        successRates,
      });
    }

    const successRates = {};
    for (const metric of metricKeys) {
      const d = totalMetrics[metric];
      let thresholdLabel;
      if (metric.startsWith("avgDelta")) thresholdLabel = `Average Δ${metric.replace("avgDelta", "")}`;
      else if (metric.startsWith("sumDelta")) thresholdLabel = `Cumulative Sum Δ${metric.replace("sumDelta", "")}`;
      else thresholdLabel = `Average ${metric}`;

      successRates[metric] = {
        thresholdLabel,
        comparison: metric === "MSIP" ? "≤" : "≥",
        successCount: d.successCount,
        totalInstances: d.totalInstances,          // only candidates the metric applies to
        successRate: d.totalInstances > 0 ? +(d.successCount / d.totalInstances).toFixed(3) : 0,
        description: getMetricDescription(metric),
      };
    }

    res.status(200).json({
      message: "Success rates calculated based on unit thresholds",
      summary: {
        totalUnits: units.length,
        totalCandidates,
        regularMetrics: {
          XEP: successRates.XEP, XRR: successRates.XRR, XLR: successRates.XLR,
          XWR: successRates.XWR, XSR: successRates.XSR, XTR: successRates.XTR,
          XPR: successRates.XPR, XRVSR: successRates.XRVSR, XPVSR: successRates.XPVSR,
          XAVSR: successRates.XAVSR, XCP: successRates.XCP, XBP: successRates.XBP,
          MSIP: successRates.MSIP, IC: successRates.IC, GEQ: successRates.GEQ,
        },
        averageDeltaMetrics: {
          avgDeltaRRN: successRates.avgDeltaRRN,
          avgDeltaPRN: successRates.avgDeltaPRN,
          avgDeltaARN: successRates.avgDeltaARN,
        },
        cumulativeSumDeltaMetrics: {
          sumDeltaRRN: successRates.sumDeltaRRN,
          sumDeltaPRN: successRates.sumDeltaPRN,
          sumDeltaARN: successRates.sumDeltaARN,
        },
      },
      unitDetails,
      explanation: {
        avgDeltaRRN: "Average ∆RR (from averages.deltaRRN) compared to unit ΔRRN threshold",
        avgDeltaPRN: "Average ∆PR (from averages.deltaPRN) compared to unit ΔPRN threshold",
        avgDeltaARN: "Average ∆AR (from averages.deltaARN) compared to unit ΔARN threshold",
        sumDeltaRRN: "Cumulative Sum ∆RR (from cumulativeSums.deltaRRN) compared to unit ΔRRN threshold",
        sumDeltaPRN: "Cumulative Sum ∆PR (from cumulativeSums.deltaPRN) compared to unit ΔPRN threshold",
        sumDeltaARN: "Cumulative Sum ∆AR (from cumulativeSums.deltaARN) compared to unit ΔARN threshold",
      },
    });
  } catch (error) {
    console.error("Unit Success Rates Error:", error);
    res.status(500).json({ message: "Error calculating unit success rates", error: error.message });
  }
};

// Helper function for metric descriptions
function getMetricDescription(metric) {
  switch (metric) {
    case 'MSIP': return 'Lower values are better';
    case 'IC': return 'Higher Interaction Class is better';
    case 'avgDeltaRRN': return 'Average Receptive Growth - higher is better';
    case 'avgDeltaPRN': return 'Average Productive Growth - higher is better';
    case 'avgDeltaARN': return 'Average Acuity Growth - higher is better';
    case 'sumDeltaRRN': return 'Cumulative Receptive Growth - higher is better';
    case 'sumDeltaPRN': return 'Cumulative Productive Growth - higher is better';
    case 'sumDeltaARN': return 'Cumulative Acuity Growth - higher is better';
    default: return 'Higher values are better';
  }
}

// Helper function to calculate ALL candidate metrics AND stability counts
async function calculateAllCandidateMetrics(unitId, candidateIds) {
  try {
    const results = [];

    for (const candidateId of candidateIds) {
      // Get all metrics for this candidate
      const candidateData = await getAllCandidateMetricsFromTabulation(unitId, candidateId);

      if (candidateData) {
        results.push({
          candidateId,
          // Regular metrics
          XEP: candidateData.avgXEP,
          XRR: candidateData.avgXRR,
          XLR: candidateData.avgXLR,
          XWR: candidateData.avgXWR,
          XSR: candidateData.avgXSR,
          XTR: candidateData.avgXTR,
          XPR: candidateData.avgXPR,
          XRVSR: candidateData.avgXRVSR,
          XPVSR: candidateData.avgXPVSR,
          XAVSR: candidateData.avgXAVSR,
          XCP: candidateData.avgXCP,
          XBP: candidateData.avgXBP,
          MSIP: candidateData.avgMSIP,
          IC: candidateData.avgIC,
          GEQ: candidateData.avgGEQ,
          avgDeltaRRN: candidateData.avgDeltaRRN,
          avgDeltaPRN: candidateData.avgDeltaPRN,
          avgDeltaARN: candidateData.avgDeltaARN,
          sumDeltaRRN: candidateData.sumDeltaRRN,
          sumDeltaPRN: candidateData.sumDeltaPRN,
          sumDeltaARN: candidateData.sumDeltaARN
        });

      }
    }

    return {
      candidateMetrics: results,
    };
  } catch (error) {
    console.error("Error calculating candidate metrics:", error);
    return {
      candidateMetrics: [],
    };
  }
}

// Helper function to get ALL candidate metrics AND count STAP/STAG from tabulation data
async function getAllCandidateMetricsFromTabulation(unitId, candidateId) {
  try {
    const tabulationData = await callTabulationFunction(unitId, candidateId);
    if (!tabulationData) return null;

    const cid = String(candidateId).trim();
    const mine = (tabulationData.averages ?? []).filter(
      (a) => String(a.candidateId).trim() === cid
    );
    const regularAvg = mine.find((a) => a.ppId === "Average") ?? mine[0];
    if (!regularAvg) return null;

    const cumulativeSum = (tabulationData.cumulativeSums ?? []).find(
      (s) => String(s.candidateId).trim() === cid
    );

    const n = (v) => (v === null || v === undefined || v === "" ? null : parseFloat(v));

    return {
      avgXEP: n(regularAvg.XEP), avgXRR: n(regularAvg.XRR), avgXLR: n(regularAvg.XLR),
      avgXWR: n(regularAvg.XWR), avgXSR: n(regularAvg.XSR), avgXTR: n(regularAvg.XTR),
      avgXPR: n(regularAvg.XPR), avgXRVSR: n(regularAvg.XRVSR), avgXPVSR: n(regularAvg.XPVSR),
      avgXAVSR: n(regularAvg.XAVSR), avgXCP: n(regularAvg.XCP), avgXBP: n(regularAvg.XBP),
      avgMSIP: n(regularAvg.MSIP), avgIC: regularAvg.IC ?? null, avgGEQ: n(regularAvg.GEQ),
      avgDeltaRRN: n(regularAvg.deltaRRN), avgDeltaPRN: n(regularAvg.deltaPRN),
      avgDeltaARN: n(regularAvg.deltaARN),
      sumDeltaRRN: n(cumulativeSum?.deltaRRN), sumDeltaPRN: n(cumulativeSum?.deltaPRN),
      sumDeltaARN: n(cumulativeSum?.deltaARN),
    };
  } catch (error) {
    console.error("Error fetching tabulation data:", error);
    return null;
  }
}

// Helper function to call your existing tabulation function
async function callTabulationFunction(unitId, candidateId) {
  try {
    const tabulationController = require('./tabulationTable.controller');

    const mockReq = {
      query: {
        unitId: unitId,
        candidate_id: candidateId.toString(),
      }
    };

    let capturedData = null;
    const mockRes = {
      json: (data) => {
        capturedData = data;
      },
      status: () => mockRes
    };

    await tabulationController.getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

    return capturedData;
  } catch (error) {
    console.error("Error calling tabulation function:", error);
    return null;
  }
}

// Helper function to map IC string to IC class number
function getIcClass(icValue, signatureProfile) {
  if (!icValue) return null;

  const match = icValue.match(/(\d)R(\d)P/);
  if (!match) return null;

  const r = parseInt(match[1], 10);
  const p = parseInt(match[2], 10);

  switch (signatureProfile) {
    case 'Case 1: Solid Balanced':
    case 'Case 2: Rigorous Balanced':
      // Average IC: take R=P value (both equal in these cases)
      return r; // or p, same
    case 'Case 3a: Productive-Weighted':
      // Use P value
      return p;
    case 'Case 3b: Receptive-Weighted':
      // Use R value
      return r;
    default:
      return null;
  }
}

// Main controller
exports.getClientIcDistribution = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ message: "clientId is required" });

    // 1️⃣ Get all units for the client
    const units = await Unit.findAll({
      where: { clientId },
      attributes: ["id", "unitId", "unitName"],
      raw: true
    });

    if (!units.length) return res.status(404).json({ message: "No units found for this client" });

    const icCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalCandidates = 0;

    // 2️⃣ Iterate units & candidates
    for (const unit of units) {
      const rosters = await UnitRoster.findAll({
        where: { unitId: unit.id },
        attributes: ["candidateId"],
        raw: true
      });

      if (!rosters.length) continue;

      for (const { candidateId } of rosters) {
        const tabulationData = await callTabulationFunction(unit.id, candidateId);

        if (!tabulationData?.averages) continue;

        // Use default signatureProfile if missing
        const signatureProfile = tabulationData.signatureProfile || 'Case 1: Solid Balanced';

        const candidateAvg = tabulationData.averages.find(
          avg => avg.candidateId.toString().trim() === candidateId.toString().trim() && avg.ppId === "Average"
        );

        if (!candidateAvg) {
          console.log("No average found for candidate:", candidateId, "averages:", tabulationData.averages);
          continue;
        }

        if (!candidateAvg.IC) {
          console.log("No IC value for candidate:", candidateId, "IC field:", candidateAvg.IC);
          continue;
        }

        const icClass = getIcClass(candidateAvg.IC, signatureProfile);
        console.log("Candidate:", candidateId, "IC:", candidateAvg.IC, "IC Class:", icClass);

        if (icClass !== null && icCounts.hasOwnProperty(icClass)) {
          icCounts[icClass]++;
          totalCandidates++;
        }
      }

    }

    // 3️⃣ Convert counts to percentages
    const icDistribution = {};
    for (let i = 0; i <= 5; i++) {
      icDistribution[i] = totalCandidates > 0
        ? +(icCounts[i] / totalCandidates).toFixed(3)
        : 0;
    }

    return res.status(200).json({
      message: "IC class distribution calculated",
      totalCandidates,
      icCounts,
      icDistribution
    });

  } catch (error) {
    console.error("IC Distribution Error:", error);
    return res.status(500).json({
      message: "Error calculating IC class distribution",
      error: error.message
    });
  }
};

exports.getClientProductivityDistribution = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    // 1️⃣ Fetch units with environment
    const units = await Unit.findAll({
      where: { clientId },
      attributes: ["id", "environment"],
      raw: true
    });

    if (!units.length) {
      return res.status(404).json({ message: "No units found for this client" });
    }

    const counts = {
      low: 0,
      mid: 0,
      high: 0
    };

    let totalCandidates = 0;

    // 2️⃣ Loop units
    for (const unit of units) {
      const { id: unitId, environment } = unit;

      const rosters = await UnitRoster.findAll({
        where: { unitId },
        attributes: ["candidateId"],
        raw: true
      });

      if (!rosters.length) continue;

      // 3️⃣ Loop candidates
      for (const { candidateId } of rosters) {
        const tabulationData = await callTabulationFunction(unitId, candidateId);

        if (!tabulationData?.averages) continue;

        const avg = tabulationData.averages.find(
          a =>
            a.candidateId?.toString() === candidateId.toString() &&
            a.ppId === "Average"
        );

        if (!avg) continue;

        // 4️⃣ Pick productivity based on environment
        let urValue = null;

        if (environment === "Classroom") {
          urValue = avg.Productivity_USD;
        } else if (environment === "Workforce") {
          urValue = avg.Productivity_CSD;
        }

        if (urValue === null || urValue === undefined) continue;

        const ur = Number(urValue);
        if (Number.isNaN(ur)) continue;

        // 5️⃣ Categorize UR
        if (ur < 0.3) {
          counts.low++;
        } else if (ur <= 0.6) {
          counts.mid++;
        } else {
          counts.high++;
        }

        totalCandidates++;
      }
    }

    // 6️⃣ Normalize to 0–1
    const distribution = {
      low: totalCandidates ? +(counts.low / totalCandidates).toFixed(3) : 0,
      mid: totalCandidates ? +(counts.mid / totalCandidates).toFixed(3) : 0,
      high: totalCandidates ? +(counts.high / totalCandidates).toFixed(3) : 0
    };

    return res.status(200).json({
      message: "Productivity distribution calculated",
      totalCandidates,
      counts,
      distribution
    });

  } catch (error) {
    console.error("Productivity Distribution Error:", error);
    return res.status(500).json({
      message: "Error calculating productivity distribution",
      error: error.message
    });
  }
};

exports.getCandidateStableCounts = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ message: "clientId is required" });

    const units = await Unit.findAll({ where: { clientId }, attributes: ["id"], raw: true });

    let STAP_STABLE = 0, STAP_UNSTABLE = 0, STAG_STABLE = 0, STAG_UNSTABLE = 0;

    for (const unit of units) {
      const rosters = await UnitRoster.findAll({
        where: { unitId: unit.id }, attributes: ["candidateId"], raw: true,
      });
      const candidateIds = [...new Set(rosters.map((r) => r.candidateId))];

      for (const candidateId of candidateIds) {
        const data = await callTabulationFunction(unit.id, candidateId);
        const cid = String(candidateId).trim();
        const rows = (data?.averages ?? []).filter((a) => String(a.candidateId).trim() === cid);
        const avg = rows.find((a) => a.ppId === "Average") ?? rows[0];
        if (!avg) continue;

        if (avg.STAP === "STABLE") STAP_STABLE++;
        else if (avg.STAP === "UNSTABLE") STAP_UNSTABLE++;

        if (avg.STAG === "STABLE") STAG_STABLE++;
        else if (avg.STAG === "UNSTABLE") STAG_UNSTABLE++;
      }
    }

    return res.status(200).json({
      message: "Global STAP & STAG stability counts (per candidate)",
      STAP: { STABLE: STAP_STABLE, UNSTABLE: STAP_UNSTABLE },
      STAG: { STABLE: STAG_STABLE, UNSTABLE: STAG_UNSTABLE },
    });
  } catch (error) {
    console.error("STAP/STAG Count Error:", error);
    res.status(500).json({ message: "Error calculating STAP/STAG counts", error: error.message });
  }
};



// Alternative: Direct database query approach (more efficient)
async function getCandidateMetricsFromDB(unitId, candidateId) {
  try {
    // Query your InsertScore table or whichever table stores calculated metrics
    // This assumes you have a table storing candidate performance metrics

    const metrics = await db.InsertScore.findAll({
      where: {
        unitId: unitId,
        candidate_id: candidateId,
        ppId: { [db.Sequelize.Op.gt]: 0 } // Only positive ppIds
      },
      attributes: [
        [db.Sequelize.fn('AVG', db.Sequelize.col('XEP')), 'avgXEP'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XRR')), 'avgXRR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XLR')), 'avgXLR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XWR')), 'avgXWR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XSR')), 'avgXSR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XTR')), 'avgXTR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XPR')), 'avgXPR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XRVSR')), 'avgXRVSR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XPVSR')), 'avgXPVSR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XAVSR')), 'avgXAVSR'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XCP')), 'avgXCP'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('XBP')), 'avgXBP'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('MSIP')), 'avgMSIP'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('IC')), 'avgIC'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('GEQ')), 'avgGEQ'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('deltaRRN')), 'avgDeltaRRN'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('deltaPRN')), 'avgDeltaPRN'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('deltaARN')), 'avgDeltaARN']
      ],
      group: ['candidate_id'],
      raw: true
    });

    if (metrics && metrics.length > 0) {
      return metrics[0];
    }

    return null;

  } catch (error) {
    console.error("Error querying metrics from DB:", error);
    return null;
  }
}

exports.getGlobalAnalyticsDataByUnit = async (req, res) => {
  try {
    const { clientId } = req.params;


    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    // ===================================================
    // 1️⃣ Units + Benchmark + Assessment Block counts
    // ===================================================
    const units = await Unit.findAll({
      where: { clientId },
      attributes: [
        "id",
        "signatureProfile",
        "unitType",
        [fn("COUNT", fn("DISTINCT", col("benchmarks.id"))), "benchmarkCount"],
        [fn("COUNT", fn("DISTINCT", col("assessmentBlocks.id"))), "assessmentBlockCount"],
      ],
      include: [
        { model: Benchmark, as: "benchmarks", attributes: [], required: false },
        { model: AssessmentBlockManager, as: "assessmentBlocks", attributes: [], required: false },
      ],
      group: ["Unit.id"],
      raw: true,
    });



    // ===================================================
    // 2️⃣ Attendance (UnitRoster) Aggregation
    // ===================================================
    const rosterTotals = await Unit.findAll({
      where: { clientId },
      attributes: [
        [fn("SUM", col("roster.presentCount")), "present"],
        [fn("SUM", col("roster.excusedAbsences")), "excusedAbsences"],
        [fn("SUM", col("roster.unexcusedAbsences")), "unexcusedAbsences"],
        [fn("SUM", col("roster.excusedTardies")), "excusedTardies"],
        [fn("SUM", col("roster.unexcusedTardies")), "unexcusedTardies"],
      ],
      include: [
        {
          model: UnitRoster,
          as: "roster",
          attributes: [],
          required: false,
        },
      ],
      raw: true,
    });

    const candidateCountByUnit = await UnitRoster.findAll({
      attributes: [
        "unitId",
        [fn("COUNT", fn("DISTINCT", col("candidateId"))), "candidateCount"],
      ],
      include: [
        {
          model: Unit,
          as: "unit",
          where: { clientId },
          attributes: [],
          required: true,
        },
      ],
      group: ["unitId"],
      raw: true,
    });

    const staffCountByUnit = await StaffLookup.findAll({
      where: { roleType: "Leader" },   // only Leaders
      attributes: [
        "unitId",
        [fn("COUNT", col("StaffLookup.id")), "staffCount"],
      ],
      include: [
        {
          model: Unit,
          as: "unit",
          where: { clientId },
          attributes: [],
          required: true,
        },
      ],
      group: ["StaffLookup.unitId"],
      raw: true,
    });


    const assessmentBlockCountsByCandidate =
      await AssessmentBlockManager.findAll({
        where: {
          ppid: {
            [Op.gt]: 0, // Only positive PP IDs
          },
        },
        attributes: [
          "unitId",
          "candidate_id",
          [fn("COUNT", col("AssessmentBlockManager.id")), "blockCount"],
        ],
        include: [
          {
            model: Unit,
            as: "unit",
            where: { clientId },
            attributes: [],
            required: true,
          },
        ],
        group: ["unitId", "candidate_id"],
        raw: true,
      });

    const candidateMap = {};
    for (const row of candidateCountByUnit) {
      candidateMap[row.unitId] = Number(row.candidateCount) || 0;
    }

    const staffMap = {};
    for (const row of staffCountByUnit) {
      staffMap[row.unitId] = Number(row.staffCount) || 0;
    }

    const candidateStaffRatioSummary = {
      "≤ 10": 0,
      "10–20": 0,
      "> 20": 0,
    };

    const attendanceSummary = {
      present: Number(rosterTotals[0]?.present) || 0,
      excusedAbsences: Number(rosterTotals[0]?.excusedAbsences) || 0,
      unexcusedAbsences: Number(rosterTotals[0]?.unexcusedAbsences) || 0,
      excusedTardies: Number(rosterTotals[0]?.excusedTardies) || 0,
      unexcusedTardies: Number(rosterTotals[0]?.unexcusedTardies) || 0,
    };

    // ===================================================
    // 3️⃣ Existing Analytics Containers
    // ===================================================
    const signatureProfileSummary = {
      "Case 1: Solid Balanced": 0,
      "Case 2: Rigorous Balanced": 0,
      "Case 3a: Productive-Weighted": 0,
      "Case 3b: Receptive-Weighted": 0,
    };

    const unitTypeSummary = {
      "Communicative I/O": 0,
      "Theory & Practice": 0,
      "Third Parameter": 0,
    };

    const benchmarkCountSummary = {
      "BC ≤ 10": 0,
      "10 < BC ≤ 25": 0,
      "BC > 25": 0,
    };

    const assessmentBlockSummary = {
      "AB ≤ 8": 0,
      "8 < AB ≤ 20": 0,
      "AB > 20": 0,
    };

    // const needAssessmentSummary = { total: 0, open: 0 };

    // ===================================================
    // 4️⃣ Need Assessments Aggregation
    // ===================================================
    // Fetch all NeedAssessments for the client
    const needAssessments = await NeedAssessments.findAll({
      include: [
        {
          model: Unit,
          as: "unit",
          where: { clientId },
          attributes: [],
          required: true,
        },
      ],
      raw: true,
    });


    for (const row of assessmentBlockCountsByCandidate) {
      const count = Number(row.blockCount) || 0;

      if (count <= 8) {
        assessmentBlockSummary["AB ≤ 8"]++;
      } else if (count <= 20) {
        assessmentBlockSummary["8 < AB ≤ 20"]++;
      } else {
        assessmentBlockSummary["AB > 20"]++;
      }
    }

    const totalAssessmentBlockCount = await AssessmentBlockManager.count({
      include: [
        {
          model: Unit,
          as: "unit",
          where: { clientId },
          attributes: [],
          required: true,
        },
      ],
    });

    // Initialize counters
    const needAssessmentSummary = {
      Total: totalAssessmentBlockCount,
      Open: 0,
      Pending: 0,
      Closed: 0,
    };

    for (const na of needAssessments) {
      let bIds = [];
      try {
        bIds = JSON.parse(na.bIds || "[]");
      } catch (err) {
        bIds = [];
      }

      const observation = (na.observation || "").trim();

      if (bIds.length > 0 && observation) {
        needAssessmentSummary.Closed++;
      } else {
        needAssessmentSummary.Pending++;
      }
    }

    needAssessmentSummary.Open = Math.max(
      0,
      needAssessmentSummary.Total -
      (needAssessmentSummary.Pending + needAssessmentSummary.Closed)
    );


    // for (const row of needAssessmentTotals) {
    //   needAssessmentSummary.total += Number(row.totalNeedAssessments) || 0;
    //   needAssessmentSummary.open += Number(row.openNeedAssessments) || 0;
    // }

    // ===================================================
    //  Candidate Marks Aggregation (per unit, per candidate)
    // ===================================================
    const candidateImpactByUnit = await CandidateMarks.findAll({
      attributes: [
        "unitId",
        "candidateId",
        [fn("SUM", literal(`CASE WHEN impactType = 'Positive' THEN 1 ELSE 0 END`)), "positiveCount"],
        [fn("COUNT", col("CandidateMarks.id")), "totalCount"],
      ],
      include: [
        {
          model: Unit,
          as: "unit",
          where: { clientId },
          attributes: [],
          required: true,
        },
      ],
      group: ["CandidateMarks.unitId", "CandidateMarks.candidateId"],
      raw: true,
    });

    // ===================================================
    //  Build final candidateMarks structure
    // ===================================================
    const candidateMarks = {};

    for (const row of candidateImpactByUnit) {
      const unitId = row.unitId;
      const positive = Number(row.positiveCount) || 0;
      const total = Number(row.totalCount) || 0;

      if (!candidateMarks[unitId]) {
        candidateMarks[unitId] = { impactScore: 0, totalMarks: 0 };
      }

      if (total > 0) candidateMarks[unitId].impactScore += positive / total;
      candidateMarks[unitId].totalMarks += total;
    }

    const globalCandidateMarks = {
      positiveMarks: 0,
      totalMarks: 0,
      impactScore: 0,
    };

    for (const row of candidateImpactByUnit) {
      const positive = Number(row.positiveCount) || 0;
      const total = Number(row.totalCount) || 0;

      globalCandidateMarks.positiveMarks += positive;
      globalCandidateMarks.totalMarks += total;
    }

    if (globalCandidateMarks.totalMarks > 0) {
      globalCandidateMarks.impactScore =
        globalCandidateMarks.positiveMarks / globalCandidateMarks.totalMarks;
    }


    // ===================================================
    // 7️⃣ Other Analytics Calculations
    // ===================================================
    for (const unit of units) {

      const unitId = unit.id;

      const candidateCount = candidateMap[unitId] ?? 0;
      const staffCount = staffMap[unitId] ?? 0;

      // 🚨 Avoid division by zero
      if (staffCount === 0) continue;

      const ratio = candidateCount / staffCount;

      if (ratio <= 10) {
        candidateStaffRatioSummary["≤ 10"]++;
      } else if (ratio <= 20) {
        candidateStaffRatioSummary["10–20"]++;
      } else {
        candidateStaffRatioSummary["> 20"]++;
      }

      console.log(`[CTL] unit ID: ${unitId}, Candidate Count: ${candidateCount}, Staff Count: ${staffCount}, Ratio: ${ratio.toFixed(2)}`, candidateStaffRatioSummary);
      const bc = Number(unit.benchmarkCount) || 0;
      // const ab = Number(unit.assessmentBlockCount) || 0;

      if (signatureProfileSummary[unit.signatureProfile] !== undefined)
        signatureProfileSummary[unit.signatureProfile]++;
      if (unitTypeSummary[unit.unitType] !== undefined) unitTypeSummary[unit.unitType]++;
      if (bc <= 10) benchmarkCountSummary["BC ≤ 10"]++;
      else if (bc <= 25) benchmarkCountSummary["10 < BC ≤ 25"]++;
      else benchmarkCountSummary["BC > 25"]++;
      // if (ab <= 8) assessmentBlockSummary["AB ≤ 8"]++;
      // else if (ab <= 20) assessmentBlockSummary["8 < AB ≤ 20"]++;
      // else assessmentBlockSummary["AB > 20"]++;
    }

    const leaderImpactByUnit = await LeaderMarks.findAll({
      attributes: [
        "unitId",
        [
          fn(
            "SUM",
            literal(`CASE WHEN impactType = 'Positive' THEN 1 ELSE 0 END`)
          ),
          "positiveCount",
        ],
        [fn("COUNT", col("LeaderMarks.id")), "totalCount"],
      ],
      include: [
        {
          model: Unit,
          as: "unit",
          where: { clientId },
          attributes: [],
          required: true,
        },
      ],
      group: ["LeaderMarks.unitId"], //  unitId
      raw: true,
    });


    const leaderMarks = {};

    for (const row of leaderImpactByUnit) {
      const unitId = row.unitId;
      const positive = Number(row.positiveCount) || 0;
      const total = Number(row.totalCount) || 0;

      if (!leaderMarks[unitId]) {
        leaderMarks[unitId] = {
          impactScore: 0,
          totalMarks: 0,
        };
      }

      if (total > 0) {
        leaderMarks[unitId].impactScore += positive / total;
      }

      leaderMarks[unitId].totalMarks += total;
    }

    const globalLeaderMarks = {
      positiveMarks: 0,
      totalMarks: 0,
      impactScore: 0,
    };

    for (const row of leaderImpactByUnit) {
      const positive = Number(row.positiveCount) || 0;
      const total = Number(row.totalCount) || 0;

      globalLeaderMarks.positiveMarks += positive;
      globalLeaderMarks.totalMarks += total;
    }

    if (globalLeaderMarks.totalMarks > 0) {
      globalLeaderMarks.impactScore =
        globalLeaderMarks.positiveMarks / globalLeaderMarks.totalMarks;
    }


    const unitOutcomeTotals = await UnitRoster.findAll({
      attributes: [
        [
          fn(
            "SUM",
            literal(`CASE WHEN unitOutcome = 'Ongoing' THEN 1 ELSE 0 END`)
          ),
          "Ongoing",
        ],
        [
          fn(
            "SUM",
            literal(`CASE WHEN unitOutcome = 'Pass' THEN 1 ELSE 0 END`)
          ),
          "Pass",
        ],
        [
          fn(
            "SUM",
            literal(`CASE WHEN unitOutcome = 'Fail' THEN 1 ELSE 0 END`)
          ),
          "Fail",
        ],
      ],
      include: [
        {
          model: Unit,
          as: "unit",
          where: { clientId },
          attributes: [],
          required: true,
        },
      ],
      raw: true,
    });

    const unitOutcomeSummary = {
      Pass: Number(unitOutcomeTotals[0]?.Pass) || 0,
      Fail: Number(unitOutcomeTotals[0]?.Fail) || 0,
      Ongoing: Number(unitOutcomeTotals[0]?.Ongoing) || 0,
    };

    const unitsOfClient = await Unit.findAll({
      where: { clientId },
      attributes: ["id"],
      raw: true,
    });

    let totalNeedAssessmentCount = 0;
    let existingNeedAssessmentCount = 0;

    for (const unit of unitsOfClient) {
      const unitId = unit.id;

      // 1️⃣ Total unique ppIds from InsertScore
      const insertScores = await InsertScore.findAll({
        where: { unitId },
        attributes: ["ppId"],
        raw: true,
      });
      const uniquePpIds = [...new Set(insertScores.map((s) => s.ppId))];
      totalNeedAssessmentCount += uniquePpIds.length;

      // 2️⃣ Existing NeedAssessments count for this unit
      const needAssessmentsForUnit = await NeedAssessments.count({
        where: { unitId },
      });
      existingNeedAssessmentCount += needAssessmentsForUnit;
    }

    // 3️⃣ Calculate open
    // const needAssessmentSummary = {
    //   total: totalNeedAssessmentCount,
    //   open: totalNeedAssessmentCount - existingNeedAssessmentCount,
    // };

    // ===================================================
    //  Final Response
    // ===================================================
    res.status(200).json({
      clientId,
      totalUnits: units.length,
      signatureProfiles: signatureProfileSummary,
      unitTypes: unitTypeSummary,
      benchmarkCounts: benchmarkCountSummary,
      assessmentBlocks: assessmentBlockSummary,
      attendance: attendanceSummary,
      needAssessments: needAssessmentSummary,
      candidateMarks: globalCandidateMarks,
      leaderMarks: globalLeaderMarks,
      unitOutcomes: unitOutcomeSummary,
      candidateStaffRatio: candidateStaffRatioSummary,
    });
  } catch (error) {
    console.error("Global Analytics Error:", error);
    res.status(500).json({
      message: "Error fetching global analytics data",
      error: error.message,
    });
  }
};
