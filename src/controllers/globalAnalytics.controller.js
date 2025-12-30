const { fn, col, literal } = require("sequelize");
const db = require("../models");

const Unit = db.Unit;
const Benchmark = db.Benchmark;
const AssessmentBlockManager = db.AssessmentBlockManager;
const UnitRoster = db.UnitRoster;
const NeedAssessments = db.CandidateNeedAssessment;
const CandidateMarks = db.CandidateMarks;
const LeaderMarks = db.LeaderMarks;
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');


exports.getUnitSuccessRatesByThreshold = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    // ===================================================
    // 1. Fetch all units with their threshold values
    // ===================================================
    const units = await Unit.findAll({
      where: { clientId },
      attributes: [
        "id", "unitId", "unitName", 
        "XEP", "XRR", "XLR", "XWR", "XSR", 
        "XTR", "XPR", "XRVSR", "XPVSR", "XAVSR",
        "XCP", "XBP", "MSIP", "IC", "ΔGEQ", "ΔRRN", "ΔPRN", "ΔARN"
      ],
      raw: true,
    });

    if (!units.length) {
      return res.status(404).json({ message: "No units found for this client" });
    }

    // ===================================================
    // 2. For each unit, fetch all candidates and calculate their averages
    // ===================================================
    const allResults = [];
    const totalMetrics = {
      XEP: { threshold: "XEP", successCount: 0, totalInstances: 0 },
      XRR: { threshold: "XRR", successCount: 0, totalInstances: 0 },
      XLR: { threshold: "XLR", successCount: 0, totalInstances: 0 },
      XWR: { threshold: "XWR", successCount: 0, totalInstances: 0 },
      XSR: { threshold: "XSR", successCount: 0, totalInstances: 0 },
      XTR: { threshold: "XTR", successCount: 0, totalInstances: 0 },
      XPR: { threshold: "XPR", successCount: 0, totalInstances: 0 },
      XRVSR: { threshold: "XRVSR", successCount: 0, totalInstances: 0 },
      XPVSR: { threshold: "XPVSR", successCount: 0, totalInstances: 0 },
      XAVSR: { threshold: "XAVSR", successCount: 0, totalInstances: 0 },
      XCP: { threshold: "XCP", successCount: 0, totalInstances: 0 },
      XBP: { threshold: "XBP", successCount: 0, totalInstances: 0 },
      MSIP: { threshold: "MSIP", successCount: 0, totalInstances: 0 },
      IC: { threshold: "IC", successCount: 0, totalInstances: 0 },
      GEQ: { threshold: "ΔGEQ", successCount: 0, totalInstances: 0 },
      deltaRRN: { threshold: "ΔRRN", successCount: 0, totalInstances: 0 },
      deltaPRN: { threshold: "ΔPRN", successCount: 0, totalInstances: 0 },
      deltaARN: { threshold: "ΔARN", successCount: 0, totalInstances: 0 }
    };

    for (const unit of units) {
      // Get all candidates for this unit
      const unitRosters = await UnitRoster.findAll({
        where: { unitId: unit.id },
        attributes: ["candidateId"],
        raw: true,
      });

      if (!unitRosters.length) continue;

      const candidateIds = unitRosters.map(roster => roster.candidateId);

      // Fetch all metrics for all candidates in this unit
      const unitResults = await calculateAllCandidateMetrics(unit.id, candidateIds);
      
      if (unitResults.length) {
        allResults.push({
          unitId: unit.id,
          unitName: unit.unitName,
          thresholds: {
            XEP: unit.XEP || 0,
            XRR: unit.XRR || 0,
            XLR: unit.XLR || 0,
            XWR: unit.XWR || 0,
            XSR: unit.XSR || 0,
            XTR: unit.XTR || 0,
            XPR: unit.XPR || 0,
            XRVSR: unit.XRVSR || 0,
            XPVSR: unit.XPVSR || 0,
            XAVSR: unit.XAVSR || 0,
            XCP: unit.XCP || 0,
            XBP: unit.XBP || 0,
            MSIP: unit.MSIP || 0,
            IC: unit.IC || 0,
            GEQ: unit.ΔGEQ || 0,
            deltaRRN: unit["ΔRRN"] || 0,  // Receptive growth diff threshold
            deltaPRN: unit["ΔPRN"] || 0,  // Productive growth diff threshold  
            deltaARN: unit["ΔARN"] || 0 
          },
          candidateResults: unitResults
        });
      }
    }

    // ===================================================
    // 3. Calculate success rates across all instances for all metrics
    // ===================================================
    for (const unitData of allResults) {
      for (const candidate of unitData.candidateResults) {
        // For each metric, check if candidate average meets threshold
        Object.keys(totalMetrics).forEach(metric => {
          totalMetrics[metric].totalInstances++;
          
          const candidateAvg = candidate[`avg${metric}`];
          const threshold = unitData.thresholds[metric];
          
          if (candidateAvg !== null && candidateAvg !== undefined) {
            // For MSIP, we want <= threshold (lower is better)
            if (metric === 'MSIP') {
              if (candidateAvg <= threshold) {
                totalMetrics[metric].successCount++;
              }
            } 
            // For IC, we might want special comparison logic
            // Assuming higher IC is better (like most metrics)
            else if (candidateAvg >= threshold) {
              totalMetrics[metric].successCount++;
            }
          }
        });
      }
    }

    // ===================================================
    // 4. Calculate success rates (percentages) for all metrics
    // ===================================================
    const successRates = {};
    
    Object.keys(totalMetrics).forEach(metric => {
      const data = totalMetrics[metric];
      successRates[metric] = {
        thresholdLabel: `Average ${metric}`,
        comparison: metric === 'MSIP' ? '≤' : '≥',
        successCount: data.successCount,
        totalInstances: data.totalInstances,
        successRate: data.totalInstances > 0 
          ? +(data.successCount / data.totalInstances * 100).toFixed(2) 
          : 0,
        description: metric === 'MSIP' 
          ? 'Lower values are better' 
          : metric === 'IC'
          ? 'Higher Interaction Class is better' // Custom description for IC
          : 'Higher values are better'
      };
    });

    // ===================================================
    // 5. Calculate unit-level success counts
    // ===================================================
    const unitDetails = allResults.map(unit => {
      const unitSuccessCounts = {};
      
      // Initialize counts for each metric
      Object.keys(totalMetrics).forEach(metric => {
        unitSuccessCounts[`${metric}SuccessCount`] = 0;
      });
      
      // Count successes for each candidate in this unit
      unit.candidateResults.forEach(candidate => {
        Object.keys(totalMetrics).forEach(metric => {
          const candidateAvg = candidate[`avg${metric}`];
          const threshold = unit.thresholds[metric];
          
          if (candidateAvg !== null && candidateAvg !== undefined) {
            if (metric === 'MSIP') {
              if (candidateAvg <= threshold) {
                unitSuccessCounts[`${metric}SuccessCount`]++;
              }
            } else if (candidateAvg >= threshold) {
              unitSuccessCounts[`${metric}SuccessCount`]++;
            }
          }
        });
      });
      
      return {
        unitId: unit.unitId,
        unitName: unit.unitName,
        candidateCount: unit.candidateResults.length,
        thresholds: unit.thresholds,
        successCounts: unitSuccessCounts,
        successRates: {}
      };
    });

    // Calculate success rates for each unit
    unitDetails.forEach(unit => {
      Object.keys(totalMetrics).forEach(metric => {
        if (unit.candidateCount > 0) {
          unit.successRates[`${metric}Rate`] = 
            +(unit.successCounts[`${metric}SuccessCount`] / unit.candidateCount * 100).toFixed(2);
        } else {
          unit.successRates[`${metric}Rate`] = 0;
        }
      });
    });

    // ===================================================
    // 6. Return comprehensive results
    // ===================================================
    res.status(200).json({
      message: "Success rates calculated based on unit thresholds",
      summary: {
        totalUnits: units.length,
        totalCandidates: totalMetrics.XEP.totalInstances, // All metrics have same total instances
        metrics: successRates
      },
      unitDetails,
      allResults: allResults.map(unit => ({
        unitId: unit.unitId,
        unitName: unit.unitName,
        sampleCandidateResults: unit.candidateResults.slice(0, 3) // Show first 3 candidates as sample
      }))
    });

  } catch (error) {
    console.error("Unit Success Rates Error:", error);
    res.status(500).json({
      message: "Error calculating unit success rates",
      error: error.message,
    });
  }
};

// Helper function to calculate ALL candidate metrics for a unit
async function calculateAllCandidateMetrics(unitId, candidateIds) {
  try {
    const results = [];
    
    for (const candidateId of candidateIds) {
      // Get all metrics for this candidate
      const candidateData = await getAllCandidateMetricsFromTabulation(unitId, candidateId);
      
      if (candidateData) {
        results.push({
          candidateId,
          avgXEP: candidateData.avgXEP,
          avgXRR: candidateData.avgXRR,
          avgXLR: candidateData.avgXLR,
          avgXWR: candidateData.avgXWR,
          avgXSR: candidateData.avgXSR,
          avgXTR: candidateData.avgXTR,
          avgXPR: candidateData.avgXPR,
          avgXRVSR: candidateData.avgXRVSR,
          avgXPVSR: candidateData.avgXPVSR,
          avgXAVSR: candidateData.avgXAVSR,
          avgXCP: candidateData.avgXCP,
          avgXBP: candidateData.avgXBP,
          avgMSIP: candidateData.avgMSIP,
          avgIC: candidateData.avgIC,
          avgGEQ: candidateData.avgGEQ, // ADDED IC average
          avgDeltaRRN: candidateData.avgDeltaRRN,  // From cumulativeAverages.deltaRRN
          avgDeltaPRN: candidateData.avgDeltaPRN,  // From cumulativeAverages.deltaPRN
          avgDeltaARN: candidateData.avgDeltaARN 
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error calculating candidate metrics:", error);
    return [];
  }
}

// Helper function to get ALL candidate metrics from tabulation data
async function getAllCandidateMetricsFromTabulation(unitId, candidateId) {
  try {
    // You need to implement this based on your actual tabulation logic
    // Here's an example using your existing tabulation function
    
    // Create a mock request/response to call your existing function
    const tabulationData = await callTabulationFunction(unitId, candidateId);
    
    if (!tabulationData ) {
      return null;
    }

    const cumulativeAvg = tabulationData.cumulativeAverages ? 
    tabulationData.cumulativeAverages.find(avg => avg.candidateId === candidateId.toString()) : null;
  
    // Get regular averages
    const regularAvg = tabulationData.averages ? 
      tabulationData.averages.find(avg => avg.candidateId === candidateId.toString()) : null;

    
    // Extract averages from the tabulation data
    // Adjust these property names based on your actual tabulation output
    return {
      avgXEP: regularAvg?.XEP || 0,
      avgXRR: regularAvg?.XRR || 0,
      avgXLR: regularAvg?.XLR || 0,
      avgXWR: regularAvg?.XWR || 0,
      avgXSR: regularAvg?.XSR || 0,
      avgXTR: regularAvg?.XTR || 0,
      avgXPR: regularAvg?.XPR || 0,
      avgXRVSR: regularAvg?.XRVSR || 0,
      avgXPVSR: regularAvg?.XPVSR || 0,
      avgXAVSR: regularAvg?.XAVSR || 0,
      avgXCP: regularAvg?.XCP || 0,
      avgXBP: regularAvg?.XBP || 0,
      avgMSIP: regularAvg?.MSIP || 0,
      avgIC: regularAvg?.IC || 0,
      avgGEQ: regularAvg?.GEQ || 0,
      
      avgDeltaRRN: cumulativeAvg?.deltaRRN || 0,  //  Average ∆RR
      avgDeltaPRN: cumulativeAvg?.deltaPRN || 0,  //  Average ∆PR
      avgDeltaARN: cumulativeAvg?.deltaARN || 0   //  Average ∆AR
    };
    
  } catch (error) {
    console.error("Error fetching tabulation data:", error);
    return null;
  }
}

// Helper function to call your existing tabulation function
async function callTabulationFunction(unitId, candidateId) {
  try {
    // This is a wrapper to call getPpCompetencyRatioMultipleCandidate
    // You might need to adjust this based on how your function works
    
    // If you can call it directly:
    const tabulationController = require('./tabulationTable.controller');
    
    // Create a mock request
    const mockReq = {
      query: {
        unitId: unitId,
        candidate_id: candidateId.toString(),
        // Add other required parameters
      }
    };
    
    // Create a mock response that captures the result
    let capturedData = null;
    const mockRes = {
      json: (data) => {
        capturedData = data;
      },
      status: () => mockRes
    };
    
    // Call the function
    await tabulationController.getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
    
    return capturedData;
    
  } catch (error) {
    console.error("Error calling tabulation function:", error);
    return null;
  }
}

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
      impactScore: 0,
      totalMarks: 0,
    };
    
    for (const row of candidateImpactByUnit) {
      const positive = Number(row.positiveCount) || 0;
      const total = Number(row.totalCount) || 0;
    
      if (total > 0) {
        globalCandidateMarks.impactScore += positive / total;
      }
    
      globalCandidateMarks.totalMarks += total;
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

    const leaderImpactByUnit = await LeaderMarks.findAll({
      attributes: [
        "unitId",
        "candidateId",
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
      group: ["LeaderMarks.unitId", "LeaderMarks.candidateId"],
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
      impactScore: 0,
      totalMarks: 0,
    };
    
    for (const row of leaderImpactByUnit) {
      const positive = Number(row.positiveCount) || 0;
      const total = Number(row.totalCount) || 0;
    
      if (total > 0) {
        globalLeaderMarks.impactScore += positive / total;
      }
    
      globalLeaderMarks.totalMarks += total;
    }
    

    const unitOutcomeTotals = await UnitRoster.findAll({
      attributes: [
        [
          fn(
            "SUM",
            literal(`CASE WHEN unitOutcome = 'Ongoing' THEN 1 ELSE 0 END`)
          ),
          "ongoing",
        ],
        [
          fn(
            "SUM",
            literal(`CASE WHEN unitOutcome = 'Pass' THEN 1 ELSE 0 END`)
          ),
          "pass",
        ],
        [
          fn(
            "SUM",
            literal(`CASE WHEN unitOutcome = 'Fail' THEN 1 ELSE 0 END`)
          ),
          "fail",
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
      ongoing: Number(unitOutcomeTotals[0]?.ongoing) || 0,
      pass: Number(unitOutcomeTotals[0]?.pass) || 0,
      fail: Number(unitOutcomeTotals[0]?.fail) || 0,
    };
    

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
    });
  } catch (error) {
    console.error("Global Analytics Error:", error);
    res.status(500).json({
      message: "Error fetching global analytics data",
      error: error.message,
    });
  }
};
