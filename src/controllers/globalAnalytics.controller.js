const { fn, col, literal } = require("sequelize");
const db = require("../models");

const Unit = db.Unit;
const Benchmark = db.Benchmark;
const AssessmentBlockManager = db.AssessmentBlockManager;
const UnitRoster = db.UnitRoster;
const NeedAssessments = db.CandidateNeedAssessment;
const CandidateMarks = db.CandidateMarks;

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
      "Case 3b: Receptive-Weighed": 0,
    };

    const unitTypeSummary = {
      "Theory & Practice": 0,
      "Communicative I/O": 0,
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

    const needAssessmentSummary = { total: 0, open: 0 };

    // ===================================================
    // 4️⃣ Need Assessments Aggregation
    // ===================================================
    const needAssessmentTotals = await NeedAssessments.findAll({
      attributes: [
        "unitId",
        [fn("COUNT", col("CandidateNeedAssessment.id")), "totalNeedAssessments"],
        [
          literal(`
            SUM(
              CASE WHEN JSON_LENGTH(CandidateNeedAssessment.benchmarkIds) = 0 THEN 1 ELSE 0 END
            )
          `),
          "openNeedAssessments",
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
      group: ["CandidateNeedAssessment.unitId"],
      raw: true,
    });

    for (const row of needAssessmentTotals) {
      needAssessmentSummary.total += Number(row.totalNeedAssessments) || 0;
      needAssessmentSummary.open += Number(row.openNeedAssessments) || 0;
    }

    // ===================================================
    // 5️⃣ Candidate Marks Aggregation (per unit, per candidate)
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
    // 6️⃣ Build final candidateMarks structure
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

    // ===================================================
    // 7️⃣ Other Analytics Calculations
    // ===================================================
    for (const unit of units) {
      const bc = Number(unit.benchmarkCount) || 0;
      const ab = Number(unit.assessmentBlockCount) || 0;

      if (signatureProfileSummary[unit.signatureProfile] !== undefined)
        signatureProfileSummary[unit.signatureProfile]++;
      if (unitTypeSummary[unit.unitType] !== undefined) unitTypeSummary[unit.unitType]++;
      if (bc <= 10) benchmarkCountSummary["BC ≤ 10"]++;
      else if (bc <= 25) benchmarkCountSummary["10 < BC ≤ 25"]++;
      else benchmarkCountSummary["BC > 25"]++;
      if (ab <= 8) assessmentBlockSummary["AB ≤ 8"]++;
      else if (ab <= 20) assessmentBlockSummary["8 < AB ≤ 20"]++;
      else assessmentBlockSummary["AB > 20"]++;
    }

    // ===================================================
    // 8️⃣ Final Response
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
      candidateMarks,
    });
  } catch (error) {
    console.error("Global Analytics Error:", error);
    res.status(500).json({
      message: "Error fetching global analytics data",
      error: error.message,
    });
  }
};
