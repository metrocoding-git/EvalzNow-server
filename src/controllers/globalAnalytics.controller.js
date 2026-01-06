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
        "XEP", "XRR", "XLR", "XWR", "XSR", "XTR", "XPR",
        "XRVSR", "XPVSR", "XAVSR", "XCP", "XBP", "MSIP", "IC",
        "ΔGEQ", "ΔRRN", "ΔPRN", "ΔARN"
      ],
      raw: true,
    });

    if (!units.length) {
      return res.status(404).json({ message: "No units found for this client" });
    }

    // =================================================== 
    // 2. Initialize totals including STAP/STAG counters
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
      avgDeltaRRN: { threshold: "ΔRRN", successCount: 0, totalInstances: 0 },
      avgDeltaPRN: { threshold: "ΔPRN", successCount: 0, totalInstances: 0 },
      avgDeltaARN: { threshold: "ΔARN", successCount: 0, totalInstances: 0 },
      sumDeltaRRN: { threshold: "ΔRRN", successCount: 0, totalInstances: 0 },
      sumDeltaPRN: { threshold: "ΔPRN", successCount: 0, totalInstances: 0 },
      sumDeltaARN: { threshold: "ΔARN", successCount: 0, totalInstances: 0 }
    };

    // NEW: STAP and STAG counters
    const stabilityMetrics = {
      STAP: { stableCount: 0, unstableCount: 0, totalInstances: 0 },
      STAG: { stableCount: 0, unstableCount: 0, totalInstances: 0 }
    };

    // =================================================== 
    // 3. Process each unit
    // ===================================================
    for (const unit of units) {
      const unitRosters = await UnitRoster.findAll({
        where: { unitId: unit.id },
        attributes: ["candidateId"],
        raw: true,
      });

      if (!unitRosters.length) continue;

      const candidateIds = unitRosters.map(roster => roster.candidateId);

      // Fetch all metrics AND stability data for candidates
      const unitResults = await calculateAllCandidateMetrics(unit.id, candidateIds);

      if (unitResults.candidateMetrics.length) {
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
            avgDeltaRRN: unit["ΔRRN"] || 0,
            avgDeltaPRN: unit["ΔPRN"] || 0,
            avgDeltaARN: unit["ΔARN"] || 0,
            sumDeltaRRN: unit["ΔRRN"] || 0,
            sumDeltaPRN: unit["ΔPRN"] || 0,
            sumDeltaARN: unit["ΔARN"] || 0
          },
          candidateResults: unitResults.candidateMetrics,
          // NEW: Unit-level stability counts
          stabilityData: unitResults.stabilityCounts
        });
      }
    }

    // =================================================== 
    // 4. Calculate success rates and aggregate stability data
    // ===================================================
    for (const unitData of allResults) {
      for (const candidate of unitData.candidateResults) {
        // Process regular metrics
        Object.keys(totalMetrics).forEach(metric => {
          totalMetrics[metric].totalInstances++;
          const candidateValue = candidate[metric];
          const threshold = unitData.thresholds[metric];
          
          if (candidateValue !== null && candidateValue !== undefined) {
            if (metric === 'MSIP') {
              if (candidateValue <= threshold) {
                totalMetrics[metric].successCount++;
              }
            } else if (candidateValue >= threshold) {
              totalMetrics[metric].successCount++;
            }
          }
        });
      }

      // NEW: Aggregate stability counts
      stabilityMetrics.STAP.stableCount += unitData.stabilityData.STAP.stableCount;
      stabilityMetrics.STAP.unstableCount += unitData.stabilityData.STAP.unstableCount;
      stabilityMetrics.STAP.totalInstances += unitData.stabilityData.STAP.totalInstances;
      
      stabilityMetrics.STAG.stableCount += unitData.stabilityData.STAG.stableCount;
      stabilityMetrics.STAG.unstableCount += unitData.stabilityData.STAG.unstableCount;
      stabilityMetrics.STAG.totalInstances += unitData.stabilityData.STAG.totalInstances;
    }

    // =================================================== 
    // 5. Calculate success rates for regular metrics
    // ===================================================
    const successRates = {};
    Object.keys(totalMetrics).forEach(metric => {
      const data = totalMetrics[metric];
      let thresholdLabel;
      
      if (metric.startsWith('avgDelta')) {
        const metricName = metric.replace('avgDelta', '');
        thresholdLabel = `Average Δ${metricName}`;
      } else if (metric.startsWith('sumDelta')) {
        const metricName = metric.replace('sumDelta', '');
        thresholdLabel = `Cumulative Sum Δ${metricName}`;
      } else {
        thresholdLabel = `Average ${metric}`;
      }

      successRates[metric] = {
        thresholdLabel: thresholdLabel,
        comparison: metric === 'MSIP' ? '≤' : '≥',
        successCount: data.successCount,
        totalInstances: data.totalInstances,
        successRate: data.totalInstances > 0 
          ? +(data.successCount / data.totalInstances * 100).toFixed(2) 
          : 0,
        description: getMetricDescription(metric)
      };
    });

    // =================================================== 
    // 6. Calculate unit-level success counts
    // ===================================================
    const unitDetails = allResults.map(unit => {
      const unitSuccessCounts = {};
      
      Object.keys(totalMetrics).forEach(metric => {
        unitSuccessCounts[`${metric}SuccessCount`] = 0;
      });

      unit.candidateResults.forEach(candidate => {
        Object.keys(totalMetrics).forEach(metric => {
          const candidateValue = candidate[metric];
          const threshold = unit.thresholds[metric];
          
          if (candidateValue !== null && candidateValue !== undefined) {
            if (metric === 'MSIP') {
              if (candidateValue <= threshold) {
                unitSuccessCounts[`${metric}SuccessCount`]++;
              }
            } else if (candidateValue >= threshold) {
              unitSuccessCounts[`${metric}SuccessCount`]++;
            }
          }
        });
      });

      const unitSuccessRates = {};
      Object.keys(totalMetrics).forEach(metric => {
        if (unit.candidateResults.length > 0) {
          unitSuccessRates[`${metric}Rate`] = 
            +(unitSuccessCounts[`${metric}SuccessCount`] / unit.candidateResults.length * 100).toFixed(2);
        } else {
          unitSuccessRates[`${metric}Rate`] = 0;
        }
      });

      return {
        unitId: unit.unitId,
        unitName: unit.unitName,
        candidateCount: unit.candidateResults.length,
        thresholds: unit.thresholds,
        successCounts: unitSuccessCounts,
        successRates: unitSuccessRates,
        // NEW: Include stability data at unit level
        stabilityData: {
          STAP: {
            stableCount: unit.stabilityData.STAP.stableCount,
            unstableCount: unit.stabilityData.STAP.unstableCount,
            totalInstances: unit.stabilityData.STAP.totalInstances,
            stablePercentage: unit.stabilityData.STAP.totalInstances > 0
              ? +(unit.stabilityData.STAP.stableCount / unit.stabilityData.STAP.totalInstances * 100).toFixed(2)
              : 0
          },
          STAG: {
            stableCount: unit.stabilityData.STAG.stableCount,
            unstableCount: unit.stabilityData.STAG.unstableCount,
            totalInstances: unit.stabilityData.STAG.totalInstances,
            stablePercentage: unit.stabilityData.STAG.totalInstances > 0
              ? +(unit.stabilityData.STAG.stableCount / unit.stabilityData.STAG.totalInstances * 100).toFixed(2)
              : 0
          }
        }
      };
    });

    // =================================================== 
    // 7. Return comprehensive results
    // ===================================================
    res.status(200).json({
      message: "Success rates calculated based on unit thresholds",
      summary: {
        totalUnits: units.length,
        totalCandidates: totalMetrics.XEP.totalInstances,
        regularMetrics: {
          XEP: successRates.XEP,
          XRR: successRates.XRR,
          XLR: successRates.XLR,
          XWR: successRates.XWR,
          XSR: successRates.XSR,
          XTR: successRates.XTR,
          XPR: successRates.XPR,
          XRVSR: successRates.XRVSR,
          XPVSR: successRates.XPVSR,
          XAVSR: successRates.XAVSR,
          XCP: successRates.XCP,
          XBP: successRates.XBP,
          MSIP: successRates.MSIP,
          IC: successRates.IC,
          GEQ: successRates.GEQ
        },
        averageDeltaMetrics: {
          avgDeltaRRN: successRates.avgDeltaRRN,
          avgDeltaPRN: successRates.avgDeltaPRN,
          avgDeltaARN: successRates.avgDeltaARN
        },
        cumulativeSumDeltaMetrics: {
          sumDeltaRRN: successRates.sumDeltaRRN,
          sumDeltaPRN: successRates.sumDeltaPRN,
          sumDeltaARN: successRates.sumDeltaARN
        },
        // NEW: Global stability metrics
        stabilityMetrics: {
          STAP: {
            stableCount: stabilityMetrics.STAP.stableCount,
            unstableCount: stabilityMetrics.STAP.unstableCount,
            totalInstances: stabilityMetrics.STAP.totalInstances,
            stablePercentage: stabilityMetrics.STAP.totalInstances > 0
              ? +(stabilityMetrics.STAP.stableCount / stabilityMetrics.STAP.totalInstances * 100).toFixed(2)
              : 0,
            description: "Stability Assessment Performance - counts instances where STAP = 'STABLE'"
          },
          STAG: {
            stableCount: stabilityMetrics.STAG.stableCount,
            unstableCount: stabilityMetrics.STAG.unstableCount,
            totalInstances: stabilityMetrics.STAG.totalInstances,
            stablePercentage: stabilityMetrics.STAG.totalInstances > 0
              ? +(stabilityMetrics.STAG.stableCount / stabilityMetrics.STAG.totalInstances * 100).toFixed(2)
              : 0,
            description: "Stability Assessment Growth - counts instances where STAG = 'STABLE'"
          }
        }
      },
      unitDetails,
      explanation: {
        avgDeltaRRN: "Average ∆RR (from averages.deltaRRN) compared to unit ΔRRN threshold",
        avgDeltaPRN: "Average ∆PR (from averages.deltaPRN) compared to unit ΔPRN threshold",
        avgDeltaARN: "Average ∆AR (from averages.deltaARN) compared to unit ΔARN threshold",
        sumDeltaRRN: "Cumulative Sum ∆RR (from cumulativeSums.deltaRRN) compared to unit ΔRRN threshold",
        sumDeltaPRN: "Cumulative Sum ∆PR (from cumulativeSums.deltaPRN) compared to unit ΔPRN threshold",
        sumDeltaARN: "Cumulative Sum ∆AR (from cumulativeSums.deltaARN) compared to unit ΔARN threshold",
        STAP: "Counts all ppId instances across all candidates where STAP = 'STABLE' (not averaged)",
        STAG: "Counts all ppId instances across all candidates where STAG = 'STABLE' (not averaged)"
      }
    });

  } catch (error) {
    console.error("Unit Success Rates Error:", error);
    res.status(500).json({
      message: "Error calculating unit success rates",
      error: error.message,
    });
  }
};

// Helper function for metric descriptions
function getMetricDescription(metric) {
  switch(metric) {
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
    
    // Initialize unit-level stability counters
    const unitStabilityCounts = {
      STAP: { stableCount: 0, unstableCount: 0, totalInstances: 0 },
      STAG: { stableCount: 0, unstableCount: 0, totalInstances: 0 }
    };

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

        // NEW: Aggregate stability counts for this candidate
        unitStabilityCounts.STAP.stableCount += candidateData.stabilityCounts.STAP.stableCount;
        unitStabilityCounts.STAP.unstableCount += candidateData.stabilityCounts.STAP.unstableCount;
        unitStabilityCounts.STAP.totalInstances += candidateData.stabilityCounts.STAP.totalInstances;
        
        unitStabilityCounts.STAG.stableCount += candidateData.stabilityCounts.STAG.stableCount;
        unitStabilityCounts.STAG.unstableCount += candidateData.stabilityCounts.STAG.unstableCount;
        unitStabilityCounts.STAG.totalInstances += candidateData.stabilityCounts.STAG.totalInstances;
      }
    }

    return {
      candidateMetrics: results,
      stabilityCounts: unitStabilityCounts
    };
  } catch (error) {
    console.error("Error calculating candidate metrics:", error);
    return {
      candidateMetrics: [],
      stabilityCounts: {
        STAP: { stableCount: 0, unstableCount: 0, totalInstances: 0 },
        STAG: { stableCount: 0, unstableCount: 0, totalInstances: 0 }
      }
    };
  }
}

// MODIFIED: Helper function to get ALL candidate metrics AND count STAP/STAG from tabulation data
async function getAllCandidateMetricsFromTabulation(unitId, candidateId) {
  try {
    const tabulationData = await callTabulationFunction(unitId, candidateId);
    
    if (!tabulationData) return null;

    // Find candidate in averages
    const regularAvg = tabulationData.averages?.find(
      avg => avg.candidateId === candidateId.toString()
    );

    // Find candidate in cumulativeSums
    const cumulativeSum = tabulationData.cumulativeSums?.find(
      sum => sum.candidateId === candidateId.toString()
    );

    if (!regularAvg) return null;

    // NEW: Count STAP and STAG from results array (which contains all ppIds)
    const stabilityCounts = {
      STAP: { stableCount: 0, unstableCount: 0, totalInstances: 0 },
      STAG: { stableCount: 0, unstableCount: 0, totalInstances: 0 }
    };

    // Process all ppId records for this candidate from the results array
    if (tabulationData.results && Array.isArray(tabulationData.results)) {
      tabulationData.results.forEach(record => {
        if (record.candidateId === candidateId.toString() && record.ppId > 0) {
          // Count STAP
          if (record.STAP !== null && record.STAP !== undefined) {
            stabilityCounts.STAP.totalInstances++;
            if (record.STAP === 'STABLE') {
              stabilityCounts.STAP.stableCount++;
            } else if (record.STAP === 'UNSTABLE') {
              stabilityCounts.STAP.unstableCount++;
            }
          }

          // Count STAG
          if (record.STAG !== null && record.STAG !== undefined) {
            stabilityCounts.STAG.totalInstances++;
            if (record.STAG === 'STABLE') {
              stabilityCounts.STAG.stableCount++;
            } else if (record.STAG === 'UNSTABLE') {
              stabilityCounts.STAG.unstableCount++;
            }
          }
        }
      });
    }

    return {
      // Regular average metrics
      avgXEP: regularAvg.XEP ?? 0,
      avgXRR: regularAvg.XRR ?? 0,
      avgXLR: regularAvg.XLR ?? 0,
      avgXWR: regularAvg.XWR ?? 0,
      avgXSR: regularAvg.XSR ?? 0,
      avgXTR: regularAvg.XTR ?? 0,
      avgXPR: regularAvg.XPR ?? 0,
      avgXRVSR: regularAvg.XRVSR ?? 0,
      avgXPVSR: regularAvg.XPVSR ?? 0,
      avgXAVSR: regularAvg.XAVSR ?? 0,
      avgXCP: regularAvg.XCP ?? 0,
      avgXBP: regularAvg.XBP ?? 0,
      avgMSIP: regularAvg.MSIP ?? 0,
      avgIC: regularAvg.IC ?? 0,
      avgGEQ: regularAvg.GEQ ?? 0,
      // Average delta values from averages array
      avgDeltaRRN: regularAvg.deltaRRN ?? 0,
      avgDeltaPRN: regularAvg.deltaPRN ?? 0,
      avgDeltaARN: regularAvg.deltaARN ?? 0,
      // Cumulative sum delta values from cumulativeSums array
      sumDeltaRRN: cumulativeSum?.deltaRRN ?? 0,
      sumDeltaPRN: cumulativeSum?.deltaPRN ?? 0,
      sumDeltaARN: cumulativeSum?.deltaARN ?? 0,
      // NEW: Stability counts
      stabilityCounts: stabilityCounts
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
