const { getInsertScoresByUnitAndCandidate } = require('./insertScore.controller');
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { getUnitRostersByUnitIdAndCandidateId } = require('./unitRoster.controller');
const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const CandidateMarks = db.CandidateMarks;
const CandidateNeedAssessment = db.CandidateNeedAssessment;
const UnitImprovement = db.UnitImprovement;
const AssessmentChain = db.AssessmentChain;
const Unit = db.Unit;
const Candidate = db.Candidate;
const AssessmentBlockManager = db.AssessmentBlockManager;


/// <summary>
/// Method to Calculate the cumulative area/effort under the curve for Productivity Rates - trapezoidal riemman sums [Calculus]
/// </summary>
/// <param name="xArray">array data - covers the range of Performance Point IDs (+PP ID only)</param>
/// <param name="yArray">array data - represents the productivity rates for each +PP ID.</param>
/// <param name="subrowCount">array data - represents the total number of sub PP ID rows in the master PP ID</param>
/// <returns>The area under the curve represents the Effort for the Butler Utility</returns>
/// <returns>This function can be used for the candidate start date (CSD) and the unit start date (USD)</returns>

function effortBU(xArray, yArray, subrowCount) {
  var areasub = 0;
  var area = 0;

  for (var i = 0; i < xArray.length; i++) {
    if (i <= xArray.length - 2 && yArray[i] != 0 && yArray[i + 1] != 0) {
      areasub +=
        (yArray[i] * subrowCount[i] + yArray[i + 1] * subrowCount[i + 1]) / 2;
    } else {
      continue;
    }
  }

  area = areasub / 10;
  return parseFloat(area).toFixed(3);
}

exports.getAuxiliaryGraphData = async (req, res) => {
  try {
      const { unitId, candidate_id } = req.params;
      const { ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query || {}; // Add query parameters

      // Convert "66,67,82" → ["66","67","82"]
      const candidateList = candidate_id.split(",").map(id => id.trim());

      if (!unitId || !candidate_id) {
          return res.status(400).json({ message: "unitId and candidate_id are required" });
      }

      // ----------------------------------------------------
      // 1) CALL EXISTING INSERT SCORE CONTROLLER
      // ----------------------------------------------------
      let insertScoresAll = [];

      for (const cid of candidateList) {
          const mockReq1 = { params: { unitId, candidate_id: cid } };
          let oneInsertScore = null;

          const mockRes1 = {
              status(code) { this.statusCode = code; return this; },
              json(data) { oneInsertScore = data; return this; }
          };

          await getInsertScoresByUnitAndCandidate(mockReq1, mockRes1);

          if (Array.isArray(oneInsertScore)) {
              // Apply filtering to insert scores
              let filteredScores = oneInsertScore;
              
              // Filter by ppId range
              if (ppIdFrom || ppIdTo) {
                  filteredScores = filteredScores.filter(score => {
                      const ppId = score.ppId;
                      let passes = true;
                      
                      if (ppIdFrom && ppId < Number(ppIdFrom)) passes = false;
                      if (ppIdTo && ppId > Number(ppIdTo)) passes = false;
                      
                      return passes;
                  });
              }
              
              // Filter by criticalRefDate range
              if (criticalRefDateFrom || criticalRefDateTo) {
                  filteredScores = filteredScores.filter(score => {
                      const refDate = new Date(score.criticalRefDate);
                      let passes = true;
                      
                      if (criticalRefDateFrom && refDate < new Date(criticalRefDateFrom)) passes = false;
                      if (criticalRefDateTo && refDate > new Date(criticalRefDateTo)) passes = false;
                      
                      return passes;
                  });
              }
              
              insertScoresAll.push(...filteredScores);
          }
      }

      // ----------------------------------------------------
      // 2) NOW CALL COMPETENCY RATIO CONTROLLER WITH FILTERS
      // ----------------------------------------------------
      const mockReq2 = {
          query: { 
              unitId, 
              candidate_id,
              ppIdFrom,      // Pass filters
              ppIdTo,        // Pass filters
              criticalRefDateFrom,  // Pass filters
              criticalRefDateTo     // Pass filters
          }
      };
      let competencyData = null;

      const mockRes2 = {
          status(code) {
              this.statusCode = code;
              return this;
          },
          json(data) {
              competencyData = data;
              return this;
          }
      };

      await getPpCompetencyRatioMultipleCandidate(mockReq2, mockRes2);

      if (!competencyData || !competencyData.results) {
          return res.status(404).json({ message: "No competency ratio data found" });
      }

      const competencyResults = competencyData.results;

      // ----------------------------------------------------
      // 3) CALL ROSTER CONTROLLER
      // ----------------------------------------------------
      let rostersAll = [];

      for (const cid of candidateList) {
          const mockReq3 = { params: { unitId, candidateId: cid } };
          let rosterData = null;

          const mockRes3 = {
              status(code) { this.statusCode = code; return this; },
              json(data) { rosterData = data; return this; }
          };

          await getUnitRostersByUnitIdAndCandidateId(mockReq3, mockRes3);

          if (Array.isArray(rosterData)) {
              rostersAll.push(...rosterData);
          }
      }

      const engageLevelCounts = {
        High: 0,
        Medium: 0,
        Low: 0,
        "N/A": 0
      };
    
      insertScoresAll.forEach(score => {
          const level = score.engageLevel?.trim() || "N/A";
      
          if (engageLevelCounts[level] !== undefined) {
              engageLevelCounts[level]++;
          } else {
              // safety fallback (unexpected value)
              engageLevelCounts["N/A"]++;
          }
      });

      // ----------------------------------------------------
      // FILTER ONLY POSITIVE PPIDs in InsertScores
      // ----------------------------------------------------
      const positiveRecords = insertScoresAll.filter(r => r.ppId > 0);

      if (positiveRecords.length === 0) {
          return res.status(200).json({
              unitId,
              candidate_id,
              rosterData: rostersAll,
              results: [],
              filters: {
                  ppIdFrom: ppIdFrom || null,
                  ppIdTo: ppIdTo || null,
                  criticalRefDateFrom: criticalRefDateFrom || null,
                  criticalRefDateTo: criticalRefDateTo || null
              },
              message: "No positive ppId found matching filters"
          });
      }

      // Day difference helper
      const dayDiff = (a, b) =>
          Math.ceil((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24));

      // -------------------------------
      // Helper: tolerant candidate id getter
      // -------------------------------
      const getCandidateIdFromInsertRecord = (rec) => {
          // Try several common variants
          if (rec.candidateId != null) return String(rec.candidateId);
          if (rec.candidate_id != null) return String(rec.candidate_id);
          if (rec.candidate && (rec.candidate.id != null)) return String(rec.candidate.id);
          // last resort: check nested candidate object with different casing
          if (rec.candidate && (rec.candidateId != null)) return String(rec.candidate.candidateId);
          return undefined;
      };
      
      // -------------------------------
      // Group insert scores by candidate + ppId (robust)
      // -------------------------------
      const groupByCandidateAndPp = {};
      
      positiveRecords.forEach(rec => {
          const candId = getCandidateIdFromInsertRecord(rec);
          if (!candId) {
              console.warn('InsertScore record missing candidate id:', rec);
              return; // skip or you could still group by ppId-only
          }
          const key = `${candId}_${String(rec.ppId)}`;
          if (!groupByCandidateAndPp[key]) groupByCandidateAndPp[key] = [];
          groupByCandidateAndPp[key].push(rec);
      });
      
      // --- build fast lookup for competency results ---
      // create keys with candidateId_ppId and also store by ppId alone (array) for fallback
      const compMap = new Map();
      const compByPpId = new Map();
      
      competencyResults.forEach(c => {
          // competency results use candidateId property (based on your controller) — normalize to string
          const candKey = `${String(c.candidateId)}_${String(c.ppId)}`;
          compMap.set(candKey, c);
      
          const ppKey = String(c.ppId);
          if (!compByPpId.has(ppKey)) compByPpId.set(ppKey, []);
          compByPpId.get(ppKey).push(c);
      });
      
      // helper to try multiple possible field names
      const pickField = (obj, candidates) => {
          if (!obj) return null;
          for (const key of candidates) {
              if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) return obj[key];
          }
          return null;
      };
      
      // -------------------------------
      // Build finalResponse from grouped records
      // -------------------------------
      const finalResponse = Object.keys(groupByCandidateAndPp).map(groupKey => {
          const records = groupByCandidateAndPp[groupKey];
      
          // latest insert-score record (by criticalRefDate)
          records.sort((a, b) => new Date(b.criticalRefDate) - new Date(a.criticalRefDate));
          const top = records[0];
      
          // get candId robustly (string)
          const candId = getCandidateIdFromInsertRecord(top);
          const ppId = top.ppId;
      
          // Try direct candidate+pp lookup in competency results
          const compKey = `${String(candId)}_${String(ppId)}`;
          let competencyMatch = compMap.get(compKey);
      
          // fallback: any entry for this ppId
          if (!competencyMatch) {
              const arr = compByPpId.get(String(ppId));
              if (Array.isArray(arr) && arr.length > 0) {
                  // prefer exact candidate match if present
                  competencyMatch = arr.find(c => String(c.candidateId) === String(candId)) || arr[0];
              }
          }
      
          if (!competencyMatch) {
              console.warn(`No competency match for candidate ${candId} ppId ${ppId}`, {
                  availableForPpId: compByPpId.get(String(ppId)) || []
              });
          }
      
          // tolerant fields
          const duration = pickField(competencyMatch, [
              'cumulativeDuration', 'cumulative_duration', 'cumulativeDurationHrs', 'duration', 'cumulative_time'
          ]);
      
          const productivityCsd = pickField(competencyMatch, [
              'Productivity_CSD', 'productivity_csd', 'productivityCsd', 'ProductivityCSD'
          ]);
      
          const productivityUsd = pickField(competencyMatch, [
              'Productivity_USD', 'productivity_usd', 'productivityUsd', 'ProductivityUSD'
          ]);
      
          // compute tenure days using nested candidate/unit objects if present
          const candidateStart = (top.candidate && top.candidate.startDate) ? top.candidate.startDate : null;
          const unitStart = (top.unit && top.unit.unitStartDate) ? top.unit.unitStartDate : null;
      
          return {
              candidateId: candId != null ? (isNaN(Number(candId)) ? candId : Number(candId)) : null,
              ppId: Number(ppId),
              subPpId: top.subPpId,
              criticalRefDate: top.criticalRefDate,
              engageLevel: top.engageLevel,
      
              csdTenureDays: candidateStart ? dayDiff(top.criticalRefDate, candidateStart) : null,
              usdTenureDays: unitStart ? dayDiff(top.criticalRefDate, unitStart) : null,
      
              duration: duration != null ? Number(duration) : null,
              Productivity_CSD: productivityCsd != null ? Number(productivityCsd) : null,
              Productivity_USD: productivityUsd != null ? Number(productivityUsd) : null
          };
      });

      // ----------------------------------------------------
      // FINAL OUTPUT
      // ----------------------------------------------------
      return res.status(200).json({
          unitId,
          candidate_id,
          rosterData: rostersAll,
          engageLevelSummary: engageLevelCounts,
          results: finalResponse,
          filters: {
              ppIdFrom: ppIdFrom || null,
              ppIdTo: ppIdTo || null,
              criticalRefDateFrom: criticalRefDateFrom || null,
              criticalRefDateTo: criticalRefDateTo || null
          }
      });

  } catch (error) {
      console.error("Error in getAuxiliaryGraphData:", error);

      return res.status(500).json({
          message: "Error computing auxiliary graph data",
          error: error.message
      });
  }
};

exports.getCandidateMarks = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    if (!unitId || !candidate_id) {
      return res.status(400).json({
        message: "unitId and candidate_id are required"
      });
    }

    const marks = await CandidateMarks.findAll({
      where: {
        unitId: unitId,
        candidateId: candidate_id
      },
      order: [["entryNumber", "ASC"]],
      include: [
        {
          model: db.Candidate,
          as: "candidate",
          attributes: ["id", "firstName", "lastName"]
        },
        {
          model: db.Unit,
          as: "unit",
          attributes: ["id", "unitName"]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      count: marks.length,
      data: marks
    });

  } catch (error) {
    console.error("Error in getCandidateMarks:", error);

    return res.status(500).json({
      message: "Error computing candidate marks",
      error: error.message
    });
  }
};

exports.createCandidateMarks = async (req, res) => {
  try {
    const {
      unitId,
      candidateId,
      impactType,
      concernIdentified,
      identityDate,
      concernResolved,
      resolutionDate
    } = req.body;

    // Validate required fields
    if (!unitId || !candidateId || !impactType || !concernIdentified || !identityDate) {
      return res.status(400).json({
        message: "unitId, candidateId, impactType, concernIdentified, and identityDate are required"
      });
    }

    // Validate impact type
    if (!["Positive", "Negative"].includes(impactType)) {
      return res.status(400).json({ message: "impactType must be 'Positive' or 'Negative'" });
    }

    // Generate next entry number for this candidate in this unit
    const lastEntry = await db.CandidateMarks.findOne({
      where: { unitId, candidateId },
      order: [["entryNumber", "DESC"]]
    });

    const nextEntryNumber = lastEntry ? lastEntry.entryNumber + 1 : 1;

    // Create candidate mark
    const newMark = await db.CandidateMarks.create({
      unitId,
      candidateId,
      entryNumber: nextEntryNumber,
      impactType,
      concernIdentified,
      identityDate,
      concernResolved,
      resolutionDate: resolutionDate || null
    });

    // Fetch the created item with associations
    const fullData = await CandidateMarks.findOne({
      where: { id: newMark.id },
      include: [
        { model: db.Candidate, as: "candidate", attributes: ["id", "firstName", "lastName"] },
        { model: db.Unit, as: "unit", attributes: ["id", "unitName"] }
      ]
    });

    return res.status(201).json({
      success: true,
      message: "Candidate mark created successfully",
      data: fullData
    });

  } catch (error) {
    console.error("Error in createCandidateMarks:", error);
    return res.status(500).json({
      message: "Error creating candidate mark",
      error: error.message
    });
  }
};

exports.getCandidateNeedAssessments = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    if (!unitId || !candidate_id) {
      return res.status(400).json({
        message: "unitId and candidate_id are required"
      });
    }

    const assessments = await CandidateNeedAssessment.findAll({
      where: {
        unitId: unitId,
        candidateId: candidate_id
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: db.Candidate,
          as: "candidate",
          attributes: ["id", "firstName", "lastName"]
        },
        {
          model: db.Unit,
          as: "unit",
          attributes: ["id", "unitName"]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    });

  } catch (error) {
    console.error("Error in getCandidateNeedAssessments:", error);

    return res.status(500).json({
      message: "Error computing candidate need assessments",
      error: error.message
    });
  }
}

exports.createCandidateNeedAssessment = async (req, res) => {
  try {
    const { unitId, candidateId, ppId, benchmarkIds, bIds, observation } = req.body;

    // Validate required fields
    if (!unitId || !candidateId || !ppId || !Array.isArray(benchmarkIds) || !Array.isArray(bIds)) {
      return res.status(400).json({
        message: "unitId, candidateId, ppId, bIds and benchmarkIds (as array) are required"
      });
    }

    // Create candidate need assessment
    const newAssessment = await CandidateNeedAssessment.create({
      unitId,
      candidateId,
      ppId,
      benchmarkIds,
      bIds,
      observation: observation || null
    });

    // Fetch the created item with associations
    const fullData = await db.CandidateNeedAssessment.findOne({
      where: { id: newAssessment.id },
      include: [
        { model: db.Candidate, as: "candidate", attributes: ["id", "firstName", "lastName"] },
        { model: db.Unit, as: "unit", attributes: ["id", "unitName"] }
      ]
    });

    return res.status(201).json({
      success: true,
      message: "Candidate need assessment created successfully",
      data: fullData
    });

  } catch (error) {
    console.error("Error in createCandidateNeedAssessment:", error);
    return res.status(500).json({
      message: "Error creating candidate need assessment",
      error: error.message
    });
  }
}

exports.updateCandidateNeedAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { benchmarkIds, bIds, observation } = req.body;

    if (!id) {
      return res.status(400).json({
        message: "Assessment id is required"
      });
    }

    // Validate arrays if provided
    if (
      (benchmarkIds !== undefined && !Array.isArray(benchmarkIds)) ||
      (bIds !== undefined && !Array.isArray(bIds))
    ) {
      return res.status(400).json({
        message: "benchmarkIds and bIds must be arrays"
      });
    }

    const assessment = await db.CandidateNeedAssessment.findByPk(id);

    if (!assessment) {
      return res.status(404).json({
        message: "Candidate need assessment not found"
      });
    }

    // Update ONLY allowed fields
    await assessment.update({
      benchmarkIds:
        benchmarkIds !== undefined
          ? benchmarkIds
          : assessment.benchmarkIds,

      bIds:
        bIds !== undefined
          ? bIds
          : assessment.bIds,

      observation:
        observation !== undefined
          ? observation
          : assessment.observation
    });

    // Fetch updated record with relations
    const updatedData = await db.CandidateNeedAssessment.findByPk(id, {
      include: [
        {
          model: db.Candidate,
          as: "candidate",
          attributes: ["id", "firstName", "lastName"]
        },
        {
          model: db.Unit,
          as: "unit",
          attributes: ["id", "unitName"]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "Candidate need assessment updated successfully",
      data: updatedData
    });

  } catch (error) {
    console.error("Error in updateCandidateNeedAssessment:", error);
    return res.status(500).json({
      message: "Error updating candidate need assessment",
      error: error.message
    });
  }
};

exports.deleteCandidateNeedAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Assessment id is required"
      });
    }

    const assessment = await db.CandidateNeedAssessment.findByPk(id);

    if (!assessment) {
      return res.status(404).json({
        message: "Candidate need assessment not found"
      });
    }

    await assessment.destroy();

    return res.status(200).json({
      success: true,
      message: "Candidate need assessment deleted successfully"
    });

  } catch (error) {
    console.error("Error in deleteCandidateNeedAssessment:", error);

    return res.status(500).json({
      message: "Error deleting candidate need assessment",
      error: error.message
    });
  }
};

exports.getLessonImprovements = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    if (!unitId || !candidate_id) {
      return res.status(400).json({
        message: "unitId and candidate_id are required"
      });
    }

    const assessments = await UnitImprovement.findAll({
      where: {
        unitId: unitId,
        candidateId: candidate_id
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: db.Candidate,
          as: "candidate",
          attributes: ["id", "firstName", "lastName"]
        },
        {
          model: db.Unit,
          as: "unit",
          attributes: ["id", "unitName"]
        }
      ]
    });

    return res.status(200).json({
      success: true,
      count: assessments.length,
      data: assessments
    });

  } catch (error) {
    console.error("Error in getUnitImprovements:", error);

    return res.status(500).json({
      message: "Error computing candidate need assessments",
      error: error.message
    });
  }
}

exports.createLessonImprovement = async (req, res) => {
  try {
    const { unitId, candidateId, candidateIds, benchmarkIds, bIds, lesson } = req.body;

    // Accept both single candidateId and array candidateIds
    let candidatesArray = [];

    if (Array.isArray(candidateIds)) {
      candidatesArray = candidateIds;
    } else if (Array.isArray(candidateId)) {
      candidatesArray = candidateId;
    } else if (candidateId) {
      candidatesArray = [candidateId];
    }

    // Validate
    if (!unitId || candidatesArray.length === 0 || !lesson) {
      return res.status(400).json({
        message: "unitId, candidateId(s), and lesson are required"
      });
    }

    // Normalize benchmarkIds and bIds
    const normalizedBenchmarkIds = benchmarkIds || [];
    const normalizedBIds = bIds || [];

    // Create all improvements in parallel
    const createdEntries = await Promise.all(
      candidatesArray.map(async (cid) => {
        const entry = await UnitImprovement.create({
          unitId,
          candidateId: cid,
          benchmarkIds: normalizedBenchmarkIds,
          bIds: normalizedBIds,
          lesson
        });

        // fetch with associations
        return await db.UnitImprovement.findOne({
          where: { id: entry.id },
          include: [
            {
              model: db.Candidate,
              as: "candidate",
              attributes: ["id", "firstName", "lastName"]
            },
            {
              model: db.Unit,
              as: "unit",
              attributes: ["id", "unitName"]
            }
          ]
        });
      })
    );

    return res.status(201).json({
      success: true,
      count: createdEntries.length,
      message:
        createdEntries.length > 1
          ? "Unit Improvements created for multiple candidates"
          : "Candidate Unit Improvement created successfully",
      data: createdEntries
    });

  } catch (error) {
    console.error("Error in unit Improvement:", error);
    return res.status(500).json({
      message: "Error creating candidate need assessment",
      error: error.message
    });
  }
};



exports.updateLessonImprovement = async (req, res) => {
  try {
    const { id } = req.params;     // improvement record ID
    const { lesson, benchmarkIds, bIds } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Improvement ID is required" });
    }

    // Fetch existing record
    const improvement = await UnitImprovement.findByPk(id);

    if (!improvement) {
      return res.status(404).json({ message: "Unit improvement not found" });
    }

    // Parse arrays safely
    const parsedBenchmarkIds = Array.isArray(benchmarkIds)
      ? benchmarkIds
      : benchmarkIds
      ? JSON.parse(benchmarkIds)
      : improvement.benchmarkIds;

    const parsedBIds = Array.isArray(bIds)
      ? bIds
      : bIds
      ? JSON.parse(bIds)
      : improvement.bIds;

    // Update fields
    improvement.lesson = lesson ?? improvement.lesson;
    improvement.benchmarkIds = parsedBenchmarkIds;
    improvement.bIds = parsedBIds;

    await improvement.save();

    // Fetch updated record with relationships
    const fullData = await UnitImprovement.findOne({
      where: { id: improvement.id },
      include: [
        { model: db.Candidate, as: "candidate", attributes: ["id", "firstName", "lastName"] },
        { model: db.Unit, as: "unit", attributes: ["id", "unitName"] }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "Unit improvement updated successfully",
      data: fullData
    });

  } catch (error) {
    console.error("Error updating unit improvement:", error);
    return res.status(500).json({
      message: "Error updating unit improvement",
      error: error.message
    });
  }
};

// Delete a unit improvement entry
exports.deleteUnitImprovement = async (req, res) => {
  try {
    const { id } = req.params; // unit improvement record ID

    if (!id) {
      return res.status(400).json({
        message: "Unit improvement ID is required"
      });
    }

    // Find the unit improvement record
    const unitImprovement = await UnitImprovement.findOne({
      where: { id }
    });

    if (!unitImprovement) {
      return res.status(404).json({
        message: "Unit improvement record not found"
      });
    }

    // Delete the record
    await UnitImprovement.destroy({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: "Unit improvement deleted successfully"
    });

  } catch (error) {
    console.error("Error in deleteUnitImprovement:", error);
    return res.status(500).json({
      message: "Error deleting unit improvement",
      error: error.message
    });
  }
};

exports.createLeaderMarks = async (req, res) => {
  try {
    let {
      unitId,
      candidateId, // can be single ID or array of IDs
      staffLookupId,
      impactType,
      concernIdentified,
      identityDate,
      concernResolved,
      resolutionDate
    } = req.body;

    // ============================
    // 1. Required fields
    // ============================
    if (!unitId || !candidateId || !staffLookupId || !impactType || !concernIdentified || !identityDate) {
      return res.status(400).json({
        message: "unitId, candidateId, staffLookupId, impactType, concernIdentified, and identityDate are required"
      });
    }

    // Ensure candidateId is an array
    const candidateIds = Array.isArray(candidateId) ? candidateId : [candidateId];

    // Validate impact type
    if (!["Positive", "Negative"].includes(impactType)) {
      return res.status(400).json({ message: "impactType must be 'Positive' or 'Negative'" });
    }

    // ============================
    // 2. Loop through each candidate and create marks
    // ============================
    const createdMarks = [];

    for (const id of candidateIds) {
      // Auto-generate next entry number for this candidate
      const lastEntry = await db.LeaderMarks.findOne({
        where: { unitId, candidateId: id },
        order: [["entryNumber", "DESC"]]
      });

      const nextEntryNumber = lastEntry ? lastEntry.entryNumber + 1 : 1;

      const newMark = await db.LeaderMarks.create({
        unitId,
        candidateId: id,
        staffLookupId,
        entryNumber: nextEntryNumber,
        impactType,
        concernIdentified,
        identityDate,
        concernResolved,
        resolutionDate: resolutionDate || null
      });

      // Fetch full relational data
      const fullData = await db.LeaderMarks.findOne({
        where: { id: newMark.id },
        include: [
          {
            model: db.Candidate,
            as: "candidate",
            attributes: ["id", "firstName", "lastName"]
          },
          {
            model: db.Unit,
            as: "unit",
            attributes: ["id", "unitName"]
          },
          {
            model: db.StaffLookup,
            as: "leaderLookup",
            include: [
              {
                model: db.Staff,
                as: "staff",
                attributes: ["id", "firstName", "lastName", "emailAddress", "jobTitle"]
              }
            ]
          }
        ]
      });

      createdMarks.push(fullData);
    }

    return res.status(201).json({
      success: true,
      message: "Leader mark(s) created successfully",
      count: createdMarks.length,
      data: createdMarks
    });

  } catch (error) {
    console.error("❌ Error in createLeaderMarks:", error);
    return res.status(500).json({
      message: "Error creating leader mark",
      error: error.message
    });
  }
};



exports.getLeaderMarks = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    if (!unitId || !candidate_id) {
      return res.status(400).json({
        message: "unitId and candidate_id are required"
      });
    }

    const marks = await db.LeaderMarks.findAll({
      where: {
        unitId: unitId,
        candidateId: candidate_id
      },
      order: [["entryNumber", "ASC"]],
      include: [
        {
          model: db.Candidate,
          as: "candidate",
          attributes: ["id", "firstName", "lastName"]
        },
        {
          model: db.Unit,
          as: "unit",
          attributes: ["id", "unitName"]
        },
        {
          model: db.StaffLookup,
          as: "leaderLookup",
          attributes: ["id", "roleType"],
          include: [
            {
              model: db.Staff,
              as: "staff",
              attributes: ["id", "firstName", "lastName", "emailAddress", "jobTitle"]
            }
          ]
        }
      ]
    });

    // ======================================================
    // Flatten the staff name into each record
    // ======================================================
    const formatted = marks.map((item) => {
      const staff = item.leaderLookup?.staff;

      return {
        ...item.toJSON(),
        staffFirstName: staff?.firstName || null,
        staffLastName: staff?.lastName || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error("Error in getLeaderMarks:", error);

    return res.status(500).json({
      message: "Error computing leader marks",
      error: error.message
    });
  }
};


exports.getEffortBu = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;
    const { ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query || {};

    const ppFrom = ppIdFrom ? Number(ppIdFrom) : null;
    const ppTo = ppIdTo ? Number(ppIdTo) : null;

    const dateFrom = criticalRefDateFrom
      ? new Date(criticalRefDateFrom)
      : null;

    const dateTo = criticalRefDateTo
      ? new Date(criticalRefDateTo)
      : null;

    if (!unitId || !candidate_id) {
      return res.status(400).json({
        message: "unitId and candidate_id are required"
      });
    }

    // ----------------------------------------
    // 1) FETCH INSERT SCORES
    // ----------------------------------------
    let insertScores = [];
    const mockReq1 = { params: { unitId, candidate_id } };

    const mockRes1 = {
      status(code) { this.statusCode = code; return this; },
      json(data) { insertScores = data; return this; }
    };

    await getInsertScoresByUnitAndCandidate(mockReq1, mockRes1);

    // Only positive ppIds
    const positive = insertScores.filter(r => {
      if (r.ppId <= 0) return false;
    
      if (ppFrom !== null && r.ppId < ppFrom) return false;
      if (ppTo !== null && r.ppId > ppTo) return false;
    
      if (dateFrom || dateTo) {
        const refDate = new Date(r.criticalRefDate);
        if (dateFrom && refDate < dateFrom) return false;
        if (dateTo && refDate > dateTo) return false;
      }
    
      return true;
    });
    

    if (!positive.length) {
      return res.status(200).json({
        message: "No positive ppId records found",
        results: null
      });
    }

    // ----------------------------------------
    // 2) BUILD subrowCount per ppId
    // ----------------------------------------
    const ppCountMap = {};
    positive.forEach(r => {
      ppCountMap[r.ppId] = (ppCountMap[r.ppId] || 0) + 1;
    });

    // ----------------------------------------
    // 3) FETCH AUXILIARY GRAPH DATA
    // ----------------------------------------
    let auxData = null;
    const mockReq2 = { 
      params: { unitId, candidate_id },
      query: req.query || {}   };

    const mockRes2 = {
      status(code) { this.statusCode = code; return this; },
      json(data) { auxData = data; return this; }
    };

    await exports.getAuxiliaryGraphData(mockReq2, mockRes2);

    if (!auxData || !auxData.results?.length) {
      return res.status(404).json({
        message: "No auxiliary graph data found"
      });
    }

    // ----------------------------------------
    // 4) EXTRACT ARRAYS (sorted by ppId)
    // ----------------------------------------
    const sorted = auxData.results
  .filter(r => {
    if (r.ppId <= 0) return false;

    if (ppFrom !== null && r.ppId < ppFrom) return false;
    if (ppTo !== null && r.ppId > ppTo) return false;

    if (dateFrom || dateTo) {
      const refDate = new Date(r.criticalRefDate);
      if (dateFrom && refDate < dateFrom) return false;
      if (dateTo && refDate > dateTo) return false;
    }

    return true;
  })
  .sort((a, b) => a.ppId - b.ppId);


    const xArray = sorted.map(r => r.ppId);
    const yArrayCSD = sorted.map(r => r.Productivity_CSD || 0);
    const yArrayUSD = sorted.map(r => r.Productivity_USD || 0);
    const subrowCount = sorted.map(r => ppCountMap[r.ppId] || 0);

    // ----------------------------------------
    // 5) CALCULATE EFFORT BU
    // ----------------------------------------
    const effortCSD = effortBU(xArray, yArrayCSD, subrowCount);
    const effortUSD = effortBU(xArray, yArrayUSD, subrowCount);

    // ----------------------------------------
    // 6) RESPONSE
    // ----------------------------------------
    return res.status(200).json({
      unitId,
      candidate_id,
      inputArrays: {
        xArray,
        yArrayCSD,
        yArrayUSD,
        subrowCount
      },
      data: {
        CSD: effortCSD,
        USD: effortUSD
      }
    });

  } catch (error) {
    console.error("Error in getEffortBu:", error);

    return res.status(500).json({
      message: "Error computing Effort BU",
      error: error.message
    });
  }
};


exports.createAssessmentChain = async (req, res) => {
  try {
    const {
      unitId,
      candidateId,
      selection1,
      selection2,
      selection3,
      selection4,
      selection5
    } = req.body;

    // ----------------------------
    // 1️⃣ Validate required fields
    // ----------------------------
    if (!unitId || !candidateId || !selection1) {
      return res.status(400).json({
        message: "unitId, candidateId, and selection1 are required"
      });
    }

    // ----------------------------
    // 2️⃣ Check if Unit exists
    // ----------------------------
    const unitExists = await Unit.findByPk(unitId);
    if (!unitExists) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // ----------------------------
    // 3️⃣ Check if Candidate exists
    // ----------------------------
    const candidateExists = await Candidate.findByPk(candidateId);
    if (!candidateExists) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // ----------------------------
    // 4️⃣ Check if selection1 exists
    // ----------------------------
    const block1Exists = await AssessmentBlockManager.findByPk(selection1);
    if (!block1Exists) {
      return res.status(404).json({ message: "selection1 block not found" });
    }

    // Optional selections validation
    const optionalSelections = { selection2, selection3, selection4, selection5 };
    for (const [key, val] of Object.entries(optionalSelections)) {
      if (val) {
        const blockExists = await AssessmentBlockManager.findByPk(val);
        if (!blockExists) {
          return res.status(404).json({ message: `${key} block not found` });
        }
      }
    }

    // ----------------------------
    // 5️⃣ Create AssessmentChain
    // ----------------------------
    const newChain = await AssessmentChain.create({
      unitId,
      candidateId,
      selection1,
      selection2: selection2 || null,
      selection3: selection3 || null,
      selection4: selection4 || null,
      selection5: selection5 || null
    });

    // ----------------------------
    // 6️⃣ Fetch created chain with associations
    // ----------------------------
    const fullChain = await AssessmentChain.findOne({
      where: { id: newChain.id },
      include: [
        { model: Unit, as: 'unit', attributes: ['id', 'unitName'] },
        { model: Candidate, as: 'candidate', attributes: ['id', 'firstName', 'lastName'] },
        { model: AssessmentBlockManager, as: 'block1' },
        { model: AssessmentBlockManager, as: 'block2' },
        { model: AssessmentBlockManager, as: 'block3' },
        { model: AssessmentBlockManager, as: 'block4' },
        { model: AssessmentBlockManager, as: 'block5' },
      ]
    });

    return res.status(201).json({
      success: true,
      message: "AssessmentChain created successfully",
      data: fullChain
    });

  } catch (error) {
    console.error("Error in createAssessmentChain:", error);
    return res.status(500).json({
      message: "Error creating AssessmentChain",
      error: error.message
    });
  }
};


exports.getAssessmentChainData = async (req, res) => {
  try {
    const { unitId, candidateId } = req.params;

    if (!unitId || !candidateId) {
      return res.status(400).json({ message: "unitId and candidateId are required" });
    }

    // 1️⃣ Fetch all chains for candidate & unit
    const chains = await AssessmentChain.findAll({
      where: { unitId, candidateId },
      include: [
        { model: Unit, as: "unit", attributes: ["id", "unitName"] },
        { model: Candidate, as: "candidate", attributes: ["id", "firstName", "lastName"] },
        { model: AssessmentBlockManager, as: "block1" },
        { model: AssessmentBlockManager, as: "block2" },
        { model: AssessmentBlockManager, as: "block3" },
        { model: AssessmentBlockManager, as: "block4" },
        { model: AssessmentBlockManager, as: "block5" },
      ],
      order: [["createdAt", "ASC"]]
    });

    // 2️⃣ Fetch tabulation data for all selections
    const allPpIds = [];
    chains.forEach(chain => {
      for (let i = 1; i <= 5; i++) {
        const block = chain[`block${i}`];
        if (block && block.ppId) allPpIds.push(block.ppId);
      }
    });

    // Call existing tabulation controller logic
    const mockReq = { query: { unitId, candidate_id: candidateId } };
    let tabData = null;
    const mockRes = {
      status() { return this; },
      json(data) { tabData = data; return this; }
    };
    await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

    if (!tabData || !tabData.results) {
      return res.status(404).json({ message: "No tabulation data found" });
    }
    const competencyResults = tabData.results;

    // Helper to fetch candidateNeedAssessment for ppId
    const getBenchmarkIds = async (unitId, candidateId, ppId) => {
      const assessments = await CandidateNeedAssessment.findAll({
        where: { unitId, candidateId, ppId }
      });
      return assessments.map(a => a.benchmarkIds).flat();
    };

    // 3️⃣ Build response
    const response = [];

    for (const chain of chains) {
      const selections = [];

      for (let i = 1; i <= 5; i++) {
        const block = chain[`block${i}`];
        if (!block) continue;

        const ppId = block.ppId;

        // Get competency info for this ppId
        const comp = competencyResults.find(c => String(c.ppId) === String(ppId) && String(c.candidateId) === String(candidateId)) || {};

        const RRN = comp.RRN || null;
        const PRN = comp.PRN || null;
        const ARN = comp.ARN || null;
        const criticalRefDate = comp.criticalRefDate || null;

        // Get benchmark ids
        const benchmarkIds = await getBenchmarkIds(unitId, candidateId, ppId);

        // Determine action status
        let actionStatus = "Open";
        if (benchmarkIds.length === 5) actionStatus = "Closed";
        else if (benchmarkIds.length > 0 && benchmarkIds.length < 5) actionStatus = "Pending";

        selections.push({
          selectionNumber: i,
          ppId,
          RRN,
          PRN,
          ARN,
          criticalRefDate,
          benchmarkIds,
          actionStatus
        });
      }

      response.push({
        chainId: chain.id,
        unitId: chain.unitId,
        candidateId: chain.candidateId,
        selections
      });
    }

    return res.status(200).json({
      success: true,
      results: response
    });

  } catch (error) {
    console.error("Error in getAssessmentChainData:", error);
    return res.status(500).json({
      message: "Error fetching assessment chain data",
      error: error.message
    });
  }
};

exports.getNeedAssessmentStatusSummary = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    if (!unitId || !candidate_id) {
      return res.status(400).json({
        message: "unitId and candidate_id are required"
      });
    }

    // ----------------------------------------
    // Parse candidates
    // ----------------------------------------
    const candidateIds = candidate_id
      .split(",")
      .map(id => Number(id.trim()))
      .filter(Boolean);

    if (!candidateIds.length) {
      return res.status(400).json({
        message: "No valid candidateIds provided"
      });
    }

    // ----------------------------------------
    // 1️⃣ CALL COMPETENCY CONTROLLER
    // ----------------------------------------
    let competencyData = null;

    const mockReq = {
      query: {
        unitId,
        candidate_id
      }
    };

    const mockRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { competencyData = data; return this; }
    };

    await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

    if (!competencyData || !Array.isArray(competencyData.results)) {
      return res.status(404).json({
        message: "No competency data found"
      });
    }

    // ----------------------------------------
    // 2️⃣ Extract unique candidateId + ppId pairs
    // ----------------------------------------
    const ppKeys = competencyData.results.map(r => ({
        candidateId: Number(r.candidateId),
        ppId: Number(r.ppId)
      }));

    // ----------------------------------------
    // 3️⃣ Fetch Need Assessments
    // ----------------------------------------
    const needAssessments = await CandidateNeedAssessment.findAll({
      where: {
        unitId,
        candidateId: {
          [Op.in]: candidateIds
        }
      },
      attributes: ["candidateId", "ppId", "benchmarkIds"]
    });

    // ----------------------------------------
    // 4️⃣ Build lookup map: candidateId_ppId
    // ----------------------------------------
    const assessmentMap = new Map();

    needAssessments.forEach(row => {
      const key = `${row.candidateId}_${row.ppId}`;
      assessmentMap.set(key, row);
    });

    // ----------------------------------------
    // 5️⃣ Status counters
    // ----------------------------------------
    const statusCounts = {
      Open: 0,
      Pending: 0,
      Closed: 0
    };

    // ----------------------------------------
    // 6️⃣ Determine status PER ppId
    // ----------------------------------------
    ppKeys.forEach(({ candidateId, ppId }) => {
      const key = `${candidateId}_${ppId}`;
      const assessment = assessmentMap.get(key);

      // 🚨 NO ROW = OPEN
      if (!assessment) {
        statusCounts.Open += 1;
        return;
      }

      let benchmarks = [];

      if (Array.isArray(assessment.benchmarkIds)) {
        benchmarks = assessment.benchmarkIds;
      } else if (typeof assessment.benchmarkIds === "string") {
        try {
          benchmarks = JSON.parse(assessment.benchmarkIds);
        } catch {
          benchmarks = [];
        }
      }

      const count = benchmarks.length;

      if (count === 0) {
        statusCounts.Open += 1;
      } else if (count < 5) {
        statusCounts.Pending += 1;
      } else {
        statusCounts.Closed += 1;
      }
    });

    // ----------------------------------------
    // RESPONSE
    // ----------------------------------------
    return res.status(200).json({
      unitId,
      candidates: candidateIds,
      statusCounts
    });

  } catch (error) {
    console.error("Error in getNeedAssessmentStatusSummary:", error);

    return res.status(500).json({
      message: "Error computing need assessment status summary",
      error: error.message
    });
  }
};

