const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
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
  try {
    const {
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
      ...rest
    } = req.body;

    if (!assessmentBlockId) {
      return res.status(400).json({ message: 'assessmentBlockId is required' });
    }
    if (!unitId) {
      return res.status(400).json({ message: 'unitId is required' });
    }
    if (!candidate_id) {
      return res.status(400).json({ message: 'candidateId is required' });
    }

    // Ensure related assessment block manager exists
    const blockExists = await AssessmentBlockManager.findByPk(assessmentBlockId);
    if (!blockExists) {
      return res.status(400).json({ message: 'AssessmentBlockManager not found' });
    }

    // 🔑 Auto-generate subPpId (scoped by unitId, candidate_id, ppId)
    let subPpId;
    const existingScores = await InsertScore.findAll({
      where: { unitId, candidate_id, ppId },
      attributes: ['subPpId']
    });

    if (existingScores.length === 0) {
      // no subPpId exists yet → start new sequence
      subPpId = ppId > 0 ? 1 : -1;
    } else {
      if (ppId > 0) {
        const maxSub = Math.max(...existingScores.map(s => s.subPpId));
        subPpId = maxSub + 1;
      } else {
        const minSub = Math.min(...existingScores.map(s => s.subPpId));
        subPpId = minSub - 1;
      }
    }

    // Create the new score
    const newScore = await InsertScore.create({
      unitId,
      assessmentBlockId,
      candidate_id,
      ppId,
      subPpId,   // ✅ auto-generated
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
      ...rest,
    });

    const scoreWithRelations = await InsertScore.findOne({
      where: { id: newScore.id },
      include: [
        { model: AssessmentBlockManager, as: 'assessmentBlock' },
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    res.status(201).json(scoreWithRelations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating insert score', error: error.message });
  }
};



// PUT update an Insert Score
exports.updateInsertScore = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.assessmentBlockId) {
      const blockExists = await AssessmentBlockManager.findByPk(req.body.assessmentBlockId);
      if (!blockExists) {
        return res.status(400).json({ message: 'AssessmentBlockManager not found' });
      }
    }

    const updated = await InsertScore.update(req.body, { where: { id } });

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Insert score not found or no changes made' });
    }

    const updatedScore = await InsertScore.findOne({
      where: { id },
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock'}, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
       ]
    });

    res.status(200).json(updatedScore);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating insert score', error: error.message });
  }
};

// DELETE an Insert Score
exports.deleteInsertScore = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await InsertScore.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Insert score not found' });
    }

    res.status(200).json({ message: 'Insert score deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting insert score', error: error.message });
  }
};


exports.getInsertScoresByUnitAndCandidate = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    const scores = await InsertScore.findAll({
      where: { unitId, candidate_id },
      include: [
        { model: AssessmentBlockManager, as: 'assessmentBlock' },
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    

    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching insert scores by unitId and candidateId',
      error: error.message
    });
  }
};


exports.getPpSummary = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.query; // optional filters

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

    // Step 2: For each ppId, fetch shortDescription + missingCompetency
    const results = await Promise.all(
      aggregates.map(async (agg) => {
        // Get the InsertScore row that has the latest criticalRefDate
        const latestScore = await InsertScore.findOne({
          where: {
            ppId: agg.ppId,
            criticalRefDate: agg.latestCriticalRefDate,
            ...(unitId ? { unitId } : {}),
            ...(candidate_id ? { candidate_id } : {}),
          },
          include: [
            {
              model: AssessmentBlockManager,
              as: "assessmentBlock",
              attributes: ["shortDescription"],
            },
          ],
          order: [["criticalRefDate", "DESC"]],
        });

        return {
          ppId: agg.ppId,
          shortDescription: latestScore?.assessmentBlock?.shortDescription || null,
          totalDuration: agg.totalDuration,
          latestCriticalRefDate: agg.latestCriticalRefDate,
          missingCompetency: latestScore?.competency || null,
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