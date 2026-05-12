const db = require("../models");

const { Op, Sequelize } = require("sequelize");

const sequelize = db.sequelize;

const InsertScore = db.InsertScore;
const InsertScoreCriteria = db.InsertScoreCriteria;
const ScoringCriteria = db.ScoringCriteria;

const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;

// GET all Insert Scores
exports.getInsertScores = async (req, res) => {
  try {
    const scores = await InsertScore.findAll({
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock' }, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }]
    });
    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching insert scores', error: error.message });
  }
};

// GET Insert Scores by Assessment Block ID
exports.getInsertScoresByBlockId = async (req, res) => {
  try {
    const { blockId } = req.params;

    const scores = await InsertScore.findAll({
      where: { assessmentBlockId: blockId },
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock' }, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });



    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching insert scores by blockId', error: error.message });
  }
};


// GET Insert Scores by Unit ID
exports.getInsertScoresByUnitId = async (req, res) => {
  try {
    const { unitId } = req.params;

    const scores = await InsertScore.findAll({
      where: { unitId: unitId },
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock' }, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    
    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching insert scores by blockId', error: error.message });
  }
};


// POST create a new Insert Score
exports.createInsertScore = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    const results = [];

    for (const item of payload) {
      let {
        unitId,
        assessmentBlockId,
        candidate_id,
        ppId,
        durationHrs,
        criticalRefDate,
        remarks,
        workflowStage,
        assessmentType,
        scheduleImpact,
        engageLevel,
        competency,
        attainedScore,
        maxScore,

        // frontend sends this
        customCriteria = [],

        // fixed mc1-mc20
        ...rest
      } = item;

      // =========================
      // VALIDATIONS
      // =========================

      if (!assessmentBlockId) {
        await transaction.rollback();
        return res.status(400).json({
          message: "assessmentBlockId is required",
        });
      }

      if (!unitId) {
        await transaction.rollback();
        return res.status(400).json({
          message: "unitId is required",
        });
      }

      if (!candidate_id) {
        await transaction.rollback();
        return res.status(400).json({
          message: "candidate_id is required",
        });
      }

      const blockExists = await AssessmentBlockManager.findByPk(
        assessmentBlockId,
        { transaction }
      );

      if (!blockExists) {
        await transaction.rollback();
        return res.status(400).json({
          message: "AssessmentBlockManager not found",
        });
      }

      const unit = await Unit.findByPk(unitId, { transaction });

      if (!unit) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Unit not found",
        });
      }

      // =========================
      // AUTO SCORE CALCULATION
      // =========================

      if (unit.environment === "Workforce") {
        let total = 0;
        let filledCount = 0;

        const maxAllowed =
          unit.scoringSystem === "3-Point" ? 3 : 5;

        // Fixed mc1-mc20
        for (let i = 1; i <= 20; i++) {
          const mcVal = rest[`mc${i}`];

          if (
            mcVal !== null &&
            mcVal !== undefined &&
            mcVal !== ""
          ) {
            total += parseFloat(mcVal);
            filledCount++;
          }
        }

        // Custom Criteria
        if (Array.isArray(customCriteria)) {
          for (const cc of customCriteria) {
            if (
              cc.value !== null &&
              cc.value !== undefined &&
              cc.value !== ""
            ) {
              total += parseFloat(cc.value);
              filledCount++;
            }
          }
        }

        attainedScore = total;
        maxScore = filledCount * maxAllowed;
      }

      // =========================
      // GENERATE subPpId
      // =========================

      let subPpId;

      const existingScores = await InsertScore.findAll({
        where: {
          unitId,
          candidate_id,
          ppId,
        },
        attributes: ["subPpId"],
        transaction,
      });

      if (existingScores.length === 0) {
        subPpId = ppId > 0 ? 1 : -1;
      } else {
        subPpId =
          ppId > 0
            ? Math.max(
                ...existingScores.map((s) => s.subPpId)
              ) + 1
            : Math.min(
                ...existingScores.map((s) => s.subPpId)
              ) - 1;
      }

      // =========================
      // CREATE INSERT SCORE
      // =========================

      const newScore = await InsertScore.create(
        {
          unitId,
          assessmentBlockId,
          candidate_id,
          ppId,
          subPpId,
          durationHrs,
          criticalRefDate,
          remarks,
          workflowStage,
          assessmentType,
          scheduleImpact,
          engageLevel,
          competency,
          attainedScore,
          maxScore,

          // ONLY mc1-mc20 remain here
          ...rest,
        },
        { transaction }
      );

      // =========================
      // CREATE CUSTOM CRITERIA
      // =========================

      const criteriaRows = [];

      if (
        Array.isArray(customCriteria) &&
        customCriteria.length > 0
      ) {
        for (const cc of customCriteria) {
          // skip empty values
          if (
            cc.value === null ||
            cc.value === undefined ||
            cc.value === ""
          ) {
            continue;
          }

          criteriaRows.push({
            insertScoreId: newScore.id,
            scoringCriteriaId: cc.scoringCriteriaId,
            value: cc.value,
          });
        }

        if (criteriaRows.length > 0) {
          await InsertScoreCriteria.bulkCreate(
            criteriaRows,
            { transaction }
          );
        }
      }

      // =========================
      // FETCH COMPLETE RECORD
      // =========================

      const scoreWithRelations =
        await InsertScore.findOne({
          where: { id: newScore.id },

          include: [
            {
              model: AssessmentBlockManager,
              as: "assessmentBlock",
            },
            {
              model: Unit,
              as: "unit",
            },
            {
              model: Candidate,
              as: "candidate",
            },
            {
              model: InsertScoreCriteria,
              as: "customCriteria",

              include: [
                {
                  model: ScoringCriteria,
                  as: "criteria",
                },
              ],
            },
          ],

          transaction,
        });

      results.push(scoreWithRelations);
    }

    await transaction.commit();

    return res.status(201).json(results);

  } catch (error) {
    await transaction.rollback();

    console.error(error);

    return res.status(500).json({
      message: "Error creating insert score",
      error: error.message,
    });
  }
};


// PUT update an Insert Score
// PUT update an Insert Score
exports.updateInsertScore = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    let { customCriteria, ...updateData } = req.body;

    const existingScore = await InsertScore.findByPk(id, { transaction: t });
    if (!existingScore) {
      await t.rollback();
      return res.status(404).json({ message: "Insert score not found" });
    }

    // If assessmentBlockId is updated, check existence
    if (updateData.assessmentBlockId) {
      const blockExists = await AssessmentBlockManager.findByPk(updateData.assessmentBlockId, { transaction: t });
      if (!blockExists) {
        await t.rollback();
        return res.status(400).json({ message: "AssessmentBlockManager not found" });
      }
    }

    let newPpId = updateData.ppId ?? existingScore.ppId;

    // If ppId is changed, need to update subPpId
    if (newPpId !== existingScore.ppId) {
      const { unitId, candidate_id } = existingScore;

      // Step 1: reorder the old ppId to remove gap
      if (existingScore.ppId > 0) {
        await InsertScore.increment(
          { subPpId: -1 },
          {
            where: {
              unitId,
              candidate_id,
              ppId: existingScore.ppId,
              subPpId: { [Op.gt]: existingScore.subPpId },
            },
            transaction: t,
          }
        );
      } else {
        await InsertScore.increment(
          { subPpId: 1 },
          {
            where: {
              unitId,
              candidate_id,
              ppId: existingScore.ppId,
              subPpId: { [Op.lt]: existingScore.subPpId },
            },
            transaction: t,
          }
        );
      }

      // Step 2: calculate new subPpId for the new ppId
      const existingScores = await InsertScore.findAll({
        where: { unitId: existingScore.unitId, candidate_id: existingScore.candidate_id, ppId: newPpId },
        attributes: ["subPpId"],
        transaction: t,
      });

      let newSubPpId;
      if (existingScores.length === 0) newSubPpId = newPpId > 0 ? 1 : -1;
      else newSubPpId = newPpId > 0
        ? Math.max(...existingScores.map(s => s.subPpId)) + 1
        : Math.min(...existingScores.map(s => s.subPpId)) - 1;

      updateData.subPpId = newSubPpId;


      // ✅ Step 3: also update assessmentBlockId to match new ppId
      const newBlock = await AssessmentBlockManager.findOne({
        where: {
          unitId,
          candidate_id,
          ppId: newPpId,
        },
        transaction: t,
      });

      if (!newBlock) {
        await t.rollback();
        return res.status(400).json({ message: `No AssessmentBlockManager found for new ppId ${newPpId}` });
      }

      updateData.assessmentBlockId = newBlock.id; //code change
    }

    const unit = await Unit.findByPk(existingScore.unitId, { transaction: t });
    if (unit && unit.environment === "Workforce") {
      const maxAllowed = unit.scoringSystem === "3-Point" ? 3 : 5;
      let total = 0;
      let filledCount = 0;

      // MC calculation
      for (let i = 1; i <= 20; i++) {
        const mcKey = `mc${i}`;
        const mcVal = updateData.hasOwnProperty(mcKey) ? updateData[mcKey] : existingScore[mcKey];
        if (mcVal !== null && mcVal !== undefined && mcVal !== "") {
          total += parseFloat(mcVal);
          filledCount++;
        }
      }

      // CC calculation
      let ccToUse = customCriteria;
      if (!req.body.hasOwnProperty('customCriteria')) {
        const existingCC = await InsertScoreCriteria.findAll({ where: { insertScoreId: id }, transaction: t });
        ccToUse = existingCC.map(cc => ({ scoringCriteriaId: cc.scoringCriteriaId, value: cc.value }));
      }

      if (Array.isArray(ccToUse)) {
        ccToUse.forEach(cc => {
          if (cc.value !== null && cc.value !== undefined && cc.value !== "") {
            total += parseFloat(cc.value);
            filledCount++;
          }
        });
      }

      updateData.attainedScore = total;
      updateData.maxScore = filledCount * maxAllowed;
    }

    // Step 3: update the record //methna mn code change kara
    await InsertScore.update(updateData, { where: { id }, transaction: t });

    // Step 4: update custom criteria if provided
    if (req.body.hasOwnProperty('customCriteria')) {
      await InsertScoreCriteria.destroy({ where: { insertScoreId: id }, transaction: t });
      if (Array.isArray(customCriteria) && customCriteria.length > 0) {
        const criteriaRows = customCriteria
          .filter(cc => cc.value !== null && cc.value !== undefined && cc.value !== "")
          .map(cc => ({
            insertScoreId: id,
            scoringCriteriaId: cc.scoringCriteriaId,
            value: cc.value,
          }));
        if (criteriaRows.length > 0) {
          await InsertScoreCriteria.bulkCreate(criteriaRows, { transaction: t });
        }
      }
    }

    const updatedScore = await InsertScore.findOne({
      where: { id },
      include: [
        { model: AssessmentBlockManager, as: 'assessmentBlock' },
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' },
        {
          model: InsertScoreCriteria,
          as: "customCriteria",
          include: [{ model: ScoringCriteria, as: "criteria" }]
        }
      ],
      transaction: t,
    });

    await t.commit();
    res.status(200).json(formatScore(updatedScore));

  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Error updating insert score", error: error.message });
  }
};


// DELETE an Insert Score

exports.deleteInsertScore = async (req, res) => {
  const t = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    // Find the score to delete
    const score = await InsertScore.findByPk(id, { transaction: t });
    if (!score) {
      await t.rollback();
      return res.status(404).json({ message: "Insert score not found" });
    }

    const { unitId, candidate_id, ppId, subPpId } = score;

    // Delete the record
    await InsertScore.destroy({ where: { id }, transaction: t });

    // Reorder subPpIds after the deleted one
    if (ppId > 0) {
      // Positive ppId → incrementing subPpIds
      await InsertScore.increment(
        { subPpId: -1 }, // decrement by 1
        {
          where: {
            unitId,
            candidate_id,
            ppId,
            subPpId: { [Op.gt]: subPpId }, // shift only bigger ones down
          },
          transaction: t,
        }
      );
    } else {
      // Negative ppId → decrementing subPpIds
      await InsertScore.increment(
        { subPpId: 1 }, // increment by 1
        {
          where: {
            unitId,
            candidate_id,
            ppId,
            subPpId: { [Op.lt]: subPpId }, // shift only smaller ones up
          },
          transaction: t,
        }
      );
    }

    await t.commit();
    res.status(200).json({ message: "Insert score deleted and subPpIds reordered" });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({
      message: "Error deleting insert score",
      error: error.message,
    });
  }
};



const formatScore = (score) => {
  const plainScore = score.toJSON();

  // initialize cc1-cc20
  for (let i = 1; i <= 20; i++) {
    plainScore[`cc${i}`] = null;
    plainScore[`cc${i}Label`] = null;
    plainScore[`cc${i}Id`] = null;
  }

  // map using criteriaId (NOT index)
  if (plainScore.customCriteria) {
    plainScore.customCriteria.forEach((cc) => {
      const criteriaId = cc.criteria?.criteriaId;

      if (!criteriaId || criteriaId > 20) return;

      const key = `cc${criteriaId}`;
      plainScore[key] = cc.value;
      plainScore[`${key}Label`] = cc.criteria?.criteria || null;
      plainScore[`${key}Id`] = criteriaId;
    });
  }

  return plainScore;
};

exports.getInsertScoresByUnitAndCandidate = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    const scores = await InsertScore.findAll({
      where: {
        unitId,
        candidate_id,
      },

      include: [
        {
          model: AssessmentBlockManager,
          as: "assessmentBlock",
        },

        {
          model: Unit,
          as: "unit",
        },

        {
          model: Candidate,
          as: "candidate",
        },

        {
          model: InsertScoreCriteria,
          as: "customCriteria",

          include: [
            {
              model: ScoringCriteria,
              as: "criteria",
            },
          ],
        },
      ],

      order: [
        [
          Sequelize.literal(`
            CASE 
              WHEN "ppId" >= 0 THEN "ppId"
            END
          `),
          "ASC",
        ],

        [
          Sequelize.literal(`
            CASE 
              WHEN "ppId" < 0 THEN "ppId"
            END
          `),
          "DESC",
        ],

        ["criticalRefDate", "ASC"],
      ],
    });

    const formattedScores = scores.map((score) => formatScore(score));

    return res.status(200).json(formattedScores);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Error fetching insert scores by unitId and candidateId",
      error: error.message,
    });
  }
};


exports.getPpSummary = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.query;

    // Define competencies for each unit type
    const competenciesMap = {
      "Communicative I/O": ["Listening", "Reading", "Speaking", "Writing"],
      "Theory & Practice": ["Theory", "Practice"],
      "Third Parameter": ["Receptive", "Productive", "Acuity"],
    };

    // Step 1: Aggregate ppId, duration sum, latest criticalRefDate
    const aggregates = await InsertScore.findAll({
      attributes: [
        "ppId",
        [Sequelize.fn("SUM", Sequelize.col("durationHrs")), "totalDuration"],
        [Sequelize.fn("MAX", Sequelize.col("criticalRefDate")), "latestCriticalRefDate"],
      ],
      where: {
        ...(unitId ? { unitId } : {}),
        ...(candidate_id ? { candidate_id } : {}),
      },
      group: ["ppId"],
      raw: true,
    });

    // Step 2: For each ppId, determine missing competencies
    const results = await Promise.all(
      aggregates.map(async (agg) => {
        // Fetch all InsertScores for this ppId
        const scores = await InsertScore.findAll({
          where: {
            ppId: agg.ppId,
            ...(unitId ? { unitId } : {}),
            ...(candidate_id ? { candidate_id } : {}),
          },
          include: [
            {
              model: AssessmentBlockManager,
              as: "assessmentBlock",
              attributes: ["shortDescription"],
            },
            {
              model: Unit,
              as: "unit",
              attributes: ["unitType"],
            },
          ],
          raw: true,
          nest: true,
        });

        const unitType = scores[0]?.unit?.unitType;
        const allCompetencies = competenciesMap[unitType] || [];

        // Get list of competencies that exist in InsertScore
        const presentCompetencies = scores.map(s => s.competency).filter(Boolean);

        // Determine missing ones
        const missingCompetency = allCompetencies.filter(c => !presentCompetencies.includes(c));

        // Get shortDescription from the latest criticalRefDate
        const latestScore = scores.reduce((prev, curr) => {
          return new Date(curr.criticalRefDate) > new Date(prev.criticalRefDate) ? curr : prev;
        }, scores[0]);

        return {
          ppId: agg.ppId,
          shortDescription: latestScore?.assessmentBlock?.shortDescription || null,
          totalDuration: agg.totalDuration,
          latestCriticalRefDate: agg.latestCriticalRefDate,
          missingCompetency: missingCompetency.join(", ") || null,
          error: missingCompetency.length > 0 ? "Yes" : "No",
        };
      })
    );

    res.status(200).json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error generating PP summary",
      error: error.message,
    });
  }
};



exports.getScoresByUnitGrouped = async (req, res) => {
  try {
    const { unitId, candidateId } = req.params;

    if (!unitId) {
      return res.status(400).json({ message: "unitId is required" });
    }

    if (!candidateId) {
      return res.status(400).json({ message: " candidateId are required" });
    }

    const competencyTypes = {
      "Communicative I/O": [
        { attained: "Attained Listening Score", max: "Maximum Listening Score", dataKey: "Listening" },
        { attained: "Attained Reading Score", max: "Maximum Reading Score", dataKey: "Reading" },
        { attained: "Attained Speaking Score", max: "Maximum Speaking Score", dataKey: "Speaking" },
        { attained: "Attained Writing Score", max: "Maximum Writing Score", dataKey: "Writing" }
      ],
      "Theory & Practice": [
        { attained: "Attained Theory Score", max: "Maximum Theory Score", dataKey: "Theory" },
        { attained: "Attained Practice Score", max: "Maximum Practice Score", dataKey: "Practice" }
      ],
      "Third Parameter": [
        { attained: "Attained Receptive Variable Score", max: "Maximum Receptive Variable Score", dataKey: "Receptive" },
        { attained: "Attained Productive Variable Score", max: "Maximum Productive Variable Score", dataKey: "Productive" },
        { attained: "Attained Acuity Variable Score", max: "Maximum Acuity Variable Score", dataKey: "Acuity" }
      ]
    };

    const rows = await InsertScore.findAll({
      attributes: [
        "competency",
        "ppId",
        [Sequelize.col("unit.unitName"), "unitName"],
        [Sequelize.col("unit.unitId"), "unitId"],
        [Sequelize.col("unit.unitType"), "unitType"],
        [Sequelize.fn("COUNT", Sequelize.col("InsertScore.id")), "count"],
        [Sequelize.fn("SUM", Sequelize.col("InsertScore.attainedScore")), "totalAttained"],
        [Sequelize.fn("SUM", Sequelize.col("InsertScore.maxScore")), "totalMax"]
      ],
      where: { 
        unitId,
        candidate_id: candidateId   
      },
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: [],
        },
      ],
      group: ["competency", "ppId", "InsertScore.unitId", "unit.unitName", "unit.unitType"],
      raw: true,
    });

    const pivoted = {};
    rows.forEach(row => {
      const { ppId, competency, totalAttained, totalMax, unitName, unitId, unitType } = row;
      if (!pivoted[ppId]) {
        pivoted[ppId] = { ppId, unitName, unitId, unitType };
      }

      Object.values(competencyTypes).forEach(typeArr => {
        typeArr.forEach(type => {
          if (type.dataKey === competency) {
            pivoted[ppId][type.attained] = Number(totalAttained) || 0;
            pivoted[ppId][type.max] = Number(totalMax) || 0;
          }
        });
      });
    });

    const result = Object.values(pivoted).sort((a, b) => a.ppId - b.ppId);

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching grouped insert scores",
      error: error.message,
    });
  }
};

// GET Insert Scores grouped by ppId with criticalRefDate range
// GET Insert Scores grouped by ppId with startDate from previous ppId's max
// exports.getCriticalDateRangeByPpId = async (req, res) => {
//   try {
//     const { unitId, candidate_id, ppId } = req.query;

    // Step 1: fetch all ppIds and their MAX criticalRefDate
    // const ppDates = await InsertScore.findAll({
    //   attributes: [
    //     "ppId",
    //     [Sequelize.fn("MAX", Sequelize.col("criticalRefDate")), "maxDate"],
    //   ],
    //   where: {
    //     ...(unitId ? { unitId } : {}),
    //     ...(candidate_id ? { candidate_id } : {}),
    //   },
    //   group: ["ppId"],
    //   order: [["ppId", "ASC"]],
    //   raw: true,
    // });

    // Step 2: separate positive and negative ppIds
//     const positivePpIds = ppDates.filter(p => p.ppId > 0);
//     const negativePpIds = ppDates.filter(p => p.ppId < 0).sort((a, b) => a.ppId - b.ppId); // -1, -2, -3

//     const calculateRange = arr => {
//       return arr.map((current, index, arr) => {
//         let startDate;
//         // For first in array or maxDate null => current date
//         if (index === 0 || !current.maxDate) {
//           startDate = new Date().toISOString().split("T")[0];
//         } else {
//           const prevMaxDate = new Date(arr[index - 1].maxDate);
//           prevMaxDate.setDate(prevMaxDate.getDate() + 1);
//           startDate = prevMaxDate.toISOString().split("T")[0];
//         }

//         // End date logic (same as before)
//         let endDate = null;
//         if (index < arr.length - 1) {
//           const nextMaxDate = new Date(arr[index + 1].maxDate);
//           nextMaxDate.setDate(nextMaxDate.getDate() - 1);
//           endDate = nextMaxDate.toISOString().split("T")[0];
//         }

//         return {
//           ppId: current.ppId,
//           startDate,
//           endDate,
//         };
//       });
//     };

//     const positiveResults = calculateRange(positivePpIds);
//     const negativeResults = calculateRange(negativePpIds);

//     const results = [...negativeResults, ...positiveResults];

//     // If ppId query is provided, return only that ppId
//     if (ppId) {
//       const single = results.find(r => r.ppId == ppId) || null;
//       return res.status(200).json(single);
//     }

//     res.status(200).json(results);
//   } catch (error) {
//     console.error("Error fetching critical date range by ppId:", error);
//     res.status(500).json({
//       message: "Error fetching critical date range by ppId",
//       error: error.message,
//     });
//   }
// };




exports.getCriticalDateRangeByPpId = async (req, res) => {
  try {
    const { ppId, unitId, candidateId } = req.params;
    const today = "2000-12-31"; // YYYY-MM-DD

    const data = await InsertScore.findAll({
      where: { unitId, candidate_id: candidateId },
      attributes: ["ppId", "criticalRefDate"],
      order: [["ppId", "ASC"], ["criticalRefDate", "DESC"]],
    });

    const positives = data.filter(d => d.ppId > 0).sort((a, b) => a.ppId - b.ppId);
    const negatives = data.filter(d => d.ppId < 0).sort((a, b) => a.ppId - b.ppId); // -3, -2, -1

    const id = parseInt(ppId, 10);
    let result = null;

    if (id > 0) {
      const current = positives.find(d => d.ppId === id);
      const next = positives.find(d => d.ppId > id);

      let startDate;
      if (id === 1) {
        startDate = today;
      } else {
        const prev = positives.filter(d => d.ppId < id).pop();
        startDate = prev ? prev.criticalRefDate : today;
      }

      result = {
        ppId: id,
        startDate,
        endDate: next ? next.criticalRefDate : null,
      };
    } else if (id < 0) {
      const current = negatives.find(d => d.ppId === id);
      const next = negatives.find(d => d.ppId < id); // farther from zero (e.g., -3 after -2)

      let startDate;
      if (id === -1) {
        startDate = today;
      } else {
        const prevNeg = negatives.filter(d => d.ppId > id).shift(); // closer to zero (e.g., -2’s prev is -1)
        startDate = prevNeg ? prevNeg.criticalRefDate : today;
      }

      result = {
        ppId: id,
        startDate,
        endDate: next ? next.criticalRefDate : null,
      };
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching critical date range by ppId",
      error: error.message,
    });
  }
};








