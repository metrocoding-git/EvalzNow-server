const { getInsertScoresByUnitAndCandidate } = require('./insertScore.controller');
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { getUnitRostersByUnitIdAndCandidateId } = require('./unitRoster.controller');
const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const CandidateMarks = db.CandidateMarks;
const CandidateNeedAssessment = db.CandidateNeedAssessment;
const UnitImprovement = db.UnitImprovement;

exports.getAuxiliaryGraphData = async (req, res) => {
    try {
        const { unitId, candidate_id } = req.params;

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
                insertScoresAll.push(...oneInsertScore);  // merge
            }
        }


        // ----------------------------------------------------
        // 2) NOW CALL COMPETENCY RATIO CONTROLLER
        // ----------------------------------------------------
        const mockReq2 = {
            query: { unitId, candidate_id }
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


        // ----------------------------------------------------
        // FILTER ONLY POSITIVE PPIDs in InsertScores
        // ----------------------------------------------------
        const positiveRecords = insertScoresAll.filter(r => r.ppId > 0);


        if (positiveRecords.length === 0) {
            return res.status(200).json({
                unitId,
                candidate_id,
                tenureData: [],
                message: "No positive ppId found"
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
            results: finalResponse
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
    const { unitId, candidateId, benchmarkIds, bIds, lesson } = req.body;

    // Validate required fields
    if (!unitId || !candidateId || !Array.isArray(benchmarkIds) || !Array.isArray(bIds)) {
      return res.status(400).json({
        message: "unitId, candidateId, bIds and benchmarkIds (as array) are required"
      });
    }

    // Create candidate need assessment
    const newAssessment = await UnitImprovement.create({
      unitId,
      candidateId,
      benchmarkIds,
      bIds,
      lesson: lesson 
    });

    // Fetch the created item with associations
    const fullData = await db.UnitImprovement.findOne({
      where: { id: newAssessment.id },
      include: [
        { model: db.Candidate, as: "candidate", attributes: ["id", "firstName", "lastName"] },
        { model: db.Unit, as: "unit", attributes: ["id", "unitName"] }
      ]
    });

    return res.status(201).json({
      success: true,
      message: "Candidate unit Improvement created successfully",
      data: fullData
    });

  } catch (error) {
    console.error("Error in  unit Improvement:", error);
    return res.status(500).json({
      message: "Error creating candidate need assessment",
      error: error.message
    });
  }
}
